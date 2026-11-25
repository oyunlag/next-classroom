import { timeoutSignal } from "../http/timeout";
import type { Course } from "./identity";
import {
  isProgressSnapshot,
  type ProgressRequest,
  type ProgressSnapshot as Snapshot,
} from "./protocol";

export const messages = {
  unregistered:
    "Сурагчийн ID эсвэл багшийн нэвтрэх нэр бүртгэлгүй эсвэл идэвхгүй байна. Нэвтрэх нэрээ шалгана уу.",
  loading: "Ахиц ачаалж байна…",
  saved: "Серверт хадгалагдсан",
  saving: "Серверт хадгалж байна…",
  offline: "Серверт хадгалаагүй · холболтоо шалгана уу",
  examActive:
    "Шалгалт идэвхтэй байгаа тул хичээлд орох боломжгүй. Эхлээд шалгалтаа үргэлжлүүлнэ үү.",
  rejected: "Ахиц хадгалах боломжгүй. Кодоо татаж аваад багшдаа хандана уу.",
  conflict:
    "Өөр цонхонд ахиц өөрчлөгдсөн. Өөрийн ажлыг татаад серверийн ахицыг ачаална уу.",
};
type CloudStatus = keyof typeof messages;
type Backup = {
  key: string;
  raw: string;
  revision: number;
  pending: Snapshot;
  sent?: Snapshot;
};
type Session = {
  id: string;
  key: string;
  revision: number;
  pending: Snapshot | null;
  sent: Snapshot | null;
  inFlight: Promise<boolean> | null;
  blocked: "conflict" | "rejected" | "examActive" | null;
  inherited: Backup[];
  lastSaved: string;
  timer?: ReturnType<typeof setTimeout>;
};
const SAVE_INTERVAL = 5000;
const KEEPALIVE_BYTES = 60 * 1024;

function statusCode(error: unknown) {
  return error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : 0;
}

function removeBackup({ key, raw }: Backup) {
  try {
    if (localStorage.getItem(key) === raw) localStorage.removeItem(key);
  } catch {
    /* The current tab's backup remains independent. */
  }
}

function readBackups(base: string): Backup[] {
  const backups: Backup[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (key !== base && !key.startsWith(`${base}:pending:`)))
        continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data: unknown = JSON.parse(raw);
        if (
          isProgressSnapshot(data) &&
          typeof data.revision === "number" &&
          Number.isSafeInteger(data.revision) &&
          data.revision >= 0 &&
          isProgressSnapshot(data.pending)
        )
          backups.push({
            key,
            raw,
            revision: data.revision,
            pending: data.pending,
            sent: isProgressSnapshot(data.sent) ? data.sent : undefined,
          });
      } catch {
        /* Ignore a damaged backup without losing other copies. */
      }
    }
  } catch {
    /* Storage is optional while the page stays open. */
  }
  return backups;
}

export function createCloudProgress(
  course: Course,
  onStatus: (status: CloudStatus) => void = () => {},
) {
  let session: Session | null = null;
  const report = (s: Session, status: CloudStatus) => {
    if (session === s) onStatus(status);
  };
  async function request(
    body: ProgressRequest,
  ): Promise<{ revision: number; progress: Snapshot | null }> {
    const payload = JSON.stringify(body);
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive:
        body.action === "save" &&
        payload.length <= KEEPALIVE_BYTES &&
        new TextEncoder().encode(payload).byteLength <= KEEPALIVE_BYTES,
      signal: timeoutSignal(15000),
    });
    if (!response.ok)
      throw Object.assign(
        new Error(
          response.status === 403
            ? messages.unregistered
            : response.status === 423
              ? messages.examActive
              : response.status === 409
                ? messages.conflict
                : messages.offline,
        ),
        { status: response.status },
      );
    const result: unknown = await response.json();
    if (
      !isProgressSnapshot(result) ||
      typeof result.revision !== "number" ||
      !Number.isSafeInteger(result.revision) ||
      result.revision < 0 ||
      (body.action === "load" &&
        result.progress !== null &&
        !isProgressSnapshot(result.progress))
    )
      throw new Error(messages.offline);
    return {
      revision: result.revision,
      progress: isProgressSnapshot(result.progress) ? result.progress : null,
    };
  }
  function backup(s: Session) {
    try {
      if (s.pending)
        localStorage.setItem(
          s.key,
          JSON.stringify({
            revision: s.revision,
            pending: s.pending,
            sent: s.sent && s.sent !== s.pending ? s.sent : undefined,
          }),
        );
      else localStorage.removeItem(s.key);
    } catch {
      /* Course stores also retain the local working copy. */
    }
  }
  function schedule(s: Session, delay = SAVE_INTERVAL) {
    if (session !== s || s.timer !== undefined || s.blocked) return;
    s.timer = setTimeout(() => {
      s.timer = undefined;
      void flush(s);
    }, delay);
  }
  async function saveSnapshot(s: Session, progress: Snapshot) {
    try {
      return await request({
        action: "save",
        course,
        studentId: s.id,
        revision: s.revision,
        progress,
      });
    } catch (error) {
      if (statusCode(error) !== 409) throw error;
      const remote = await request({ action: "load", course, studentId: s.id });
      if (
        remote.revision > s.revision &&
        JSON.stringify(remote.progress) === JSON.stringify(progress)
      )
        return remote;
      throw error;
    }
  }
  async function write(s: Session, pending: Snapshot) {
    s.sent = pending;
    backup(s);
    report(s, "saving");
    try {
      const result = await saveSnapshot(s, pending);
      s.revision = result.revision;
      s.lastSaved = JSON.stringify(pending);
      if (s.pending === pending) s.pending = null;
      s.sent = null;
      backup(s);
      s.inherited.forEach(removeBackup);
      s.inherited = [];
      report(s, s.pending ? "saving" : "saved");
      return true;
    } catch (error) {
      const status = statusCode(error);
      s.blocked =
        status === 423
          ? "examActive"
          : status === 409
            ? "conflict"
            : status >= 400 && status < 500 && ![408, 429].includes(status)
              ? "rejected"
              : null;
      report(s, s.blocked ?? "offline");
      if (!s.blocked) schedule(s, 10000);
      return false;
    }
  }
  function flush(s: Session | null = session): Promise<boolean> {
    if (!s || s.blocked) return Promise.resolve(false);
    if (s.inFlight) return s.inFlight;
    if (!s.pending) return Promise.resolve(true);
    clearTimeout(s.timer);
    s.timer = undefined;
    s.inFlight = write(s, s.sent ?? s.pending).then((saved) => {
      s.inFlight = null;
      if (saved && s.pending) {
        if (session === s) schedule(s);
        else void flush(s);
      }
      return saved;
    });
    return s.inFlight;
  }
  async function saveNow(): Promise<boolean> {
    const s = session;
    if (!s) return false;
    while (session === s && (s.inFlight || s.pending)) {
      if (!(await flush(s))) return false;
    }
    if (session !== s || s.blocked) return false;
    report(s, "saved");
    return true;
  }
  function stop() {
    if (!session) return;
    clearTimeout(session.timer);
    session.timer = undefined;
    void flush(session);
    session = null;
  }
  return {
    async load(id: string, local: Snapshot): Promise<Snapshot> {
      stop();
      const base = `kodlab:cloud:${course}:${id}`;
      const s: Session = {
        id,
        key: `${base}:pending:${crypto.getRandomValues(new Uint32Array(2)).join("-")}`,
        revision: 0,
        pending: null,
        sent: null,
        inFlight: null,
        blocked: null,
        inherited: [],
        lastSaved: "",
      };
      session = s;
      report(s, "loading");
      let remote;
      try {
        remote = await request({ action: "load", course, studentId: id });
      } catch (error) {
        if (session === s) session = null;
        throw error;
      }
      if (session !== s) throw new Error("Сурагч солигдсон. Дахин орно уу.");
      s.revision = remote.revision;
      s.lastSaved = JSON.stringify(remote.progress);
      s.inherited = readBackups(base).flatMap((previous) => {
        if (JSON.stringify(previous.pending) === s.lastSaved) {
          removeBackup(previous);
          return [];
        }
        if (
          previous.revision + 1 === remote.revision &&
          previous.sent &&
          JSON.stringify(previous.sent) === s.lastSaved
        ) {
          return [{ ...previous, revision: remote.revision, sent: undefined }];
        }
        return [previous];
      });
      const cached = s.inherited[0];
      const copies = new Set(
        s.inherited.map(({ revision, pending }) =>
          JSON.stringify({ revision, pending }),
        ),
      );
      const progress = cached?.pending ?? remote.progress ?? local;
      s.pending =
        cached?.pending ?? (remote.progress === null ? progress : null);
      if (cached && (cached.revision !== remote.revision || copies.size > 1)) {
        s.blocked = "conflict";
        s.revision = cached.revision;
        backup(s);
        report(s, "conflict");
        return progress;
      }
      s.sent = cached?.sent ?? null;
      backup(s);
      if (s.pending) void flush(s);
      else report(s, "saved");
      return progress;
    },
    save(progress: Snapshot) {
      if (!session) return;
      const serialized = JSON.stringify(progress);
      if (
        serialized ===
        (session.pending ? JSON.stringify(session.pending) : session.lastSaved)
      )
        return;
      session.pending = structuredClone(progress);
      backup(session);
      if (session.blocked) return;
      report(session, "saving");
      schedule(session);
    },
    flush,
    saveNow,
    recover() {
      if (!session || session.blocked !== "conflict") return;
      const copies = [
        ...session.inherited.map(({ revision, pending }) => ({
          revision,
          pending,
        })),
        { revision: session.revision, pending: session.pending },
      ];
      const blob = new Blob([JSON.stringify(copies, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${course}-${session.id}-unsent.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      session.inherited.forEach(removeBackup);
      try {
        localStorage.removeItem(session.key);
      } catch {}
      clearTimeout(session.timer);
      session = null;
      location.reload();
    },
    stop,
  };
}
