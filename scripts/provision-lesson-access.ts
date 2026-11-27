import { loadEnvConfig } from "@next/env";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MongoClient } from "mongodb";
import { adminCollections } from "../lib/admin/data";
import { createStudentAccess } from "../lib/student/access";

loadEnvConfig(process.cwd());

async function main() {
  const [, , name, ...options] = process.argv;
  if (
    !name ||
    name.startsWith("--") ||
    options.some((arg) => arg !== "--apply")
  )
    throw new Error(
      "Usage: npx tsx scripts/provision-lesson-access.ts '<class name>' [--apply]",
    );
  const { profiles, groups } = await adminCollections();
  const group = await groups.findOne({
    key: name.trim().normalize("NFKC").toLocaleLowerCase("mn"),
  });
  if (!group) throw new Error("Class not found");
  const needsCode = {
    groupId: group._id,
    deletedAt: { $exists: false },
    sourceId: { $type: "string" as const },
    lessonAccessDigest: { $exists: false },
  };
  const eligible = await profiles
    .find(needsCode, { projection: { _id: 1 } })
    .toArray();
  const apply = options.includes("--apply");
  console.log(
    JSON.stringify({
      class: group.name,
      missingCodes: eligible.length,
      mode: apply ? "apply" : "preview",
    }),
  );
  if (!apply || !eligible.length) return;

  const candidates = eligible.map(({ _id }) => ({
    id: _id,
    ...createStudentAccess(),
  }));
  type Credentials = { id: string; code: string }[];
  await mkdir("work", { recursive: true });
  const directory = await mkdtemp(join("work", "lesson-access-"));
  const writePrivate = (name: string, entries: Credentials) =>
    writeFile(join(directory, name), JSON.stringify(entries, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
  await writePrivate(
    "prepared.json",
    candidates.map(({ id, code }) => ({ id, code })),
  );

  // Persist the private handoff before the first write. Verify matches after any partial failure.
  try {
    await profiles.bulkWrite(
      candidates.map(({ id, credentialDigest }) => ({
        updateOne: {
          filter: { _id: id, ...needsCode },
          update: { $set: { lessonAccessDigest: credentialDigest } },
        },
      })),
      { ordered: false },
    );
  } finally {
    const stored = await profiles
      .find(
        {
          _id: { $in: candidates.map(({ id }) => id) },
          groupId: group._id,
          deletedAt: { $exists: false },
        },
        { projection: { lessonAccessDigest: 1 } },
      )
      .toArray();
    const digests = new Map(
      stored.map((profile) => [profile._id, profile.lessonAccessDigest]),
    );
    const confirmed = candidates
      .filter(
        ({ id, credentialDigest }) => digests.get(id) === credentialDigest,
      )
      .map(({ id, code }) => ({ id, code }));
    await writePrivate("confirmed.json", confirmed);
    console.log(
      JSON.stringify({
        issued: confirmed.length,
        skipped: candidates.length - confirmed.length,
        privateHandoff: join(directory, "confirmed.json"),
      }),
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Lesson access provisioning failed",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const pool = globalThis as typeof globalThis & {
      classroomMongo?: Promise<MongoClient>;
    };
    await (await pool.classroomMongo)?.close();
  });
