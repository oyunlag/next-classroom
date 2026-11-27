"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { enterLesson } from "@/lib/student/entry";
import { MAX_TEACHER_NAME_LENGTH } from "@/lib/student/identity";
import {
  exercises as webExercises,
  lessons as webLessons,
} from "@/lib/web-lab/lessons";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  Code2,
  LoaderCircle,
  UserRound,
} from "lucide-react";

const courses = {
  python: {
    name: "Python",
    mark: "Py",
    grade: "9, 10-р анги",
    placeholder: "10A-01",
    title: "Бодлогоос эхэлнэ.\nКодоор бүтээнэ.",
    description:
      "Хувьсагч, нөхцөл, давталтыг жижиг бодлогоор сурч, бичсэн кодынхоо үр дүнг шууд хараарай.",
    file: "hello.py",
    code: 'for i in range(3):\n    print("Би чадна!")',
    output: "Би чадна!\nБи чадна!\nБи чадна!",
    features: ["Мэдлэгийн сорил", "Чөлөөт код"],
  },
  nextjs: {
    name: "Next.js",
    mark: "N",
    grade: "Веб хөгжүүлэлт",
    placeholder: "10A-01",
    title: "Жижиг компонент.\nӨөрийн гэсэн веб.",
    description:
      "Компонент, props, үйлдэл, төлөвийг алхам алхмаар сурч, өөрийн интерактив вебийг бүтээгээрэй.",
    file: "page.tsx",
    code: "export default function Hello() {\n  return <h1>Сайн уу, дэлхий!</h1>;\n}",
    output: "Сайн уу, дэлхий!",
    features: ["Алхамчилсан хичээл", "Кодын шалгалт", "Шууд харах үр дүн"],
  },
  htmlcss: {
    name: "HTML & CSS",
    mark: "<>",
    grade: "6, 7, 8-р анги",
    placeholder: "6A-01",
    title: "HTML & CSS · Мини төсөл бүтээгээрэй",
    description:
      "HTML, CSS ашиглан карт, товч, мини тоглоом бүтээ. Тоглоомын хариуг if / else нөхцөлөөр сонго.",
    file: "index.html",
    code: "<h2>Шатрын клуб</h2>",
    output: "Шатрын клуб",
    features: [
      `${webLessons.length} хичээл · карт, товч, мини тоглоом`,
      `${webExercises.length} алхамчилсан дасгал`,
      "HTML файл татах",
    ],
  },
};

export default function CourseEntry({
  course,
  onLogin,
  features,
  placement,
}: {
  course: keyof typeof courses;
  onLogin: (id: string, token: string) => Promise<unknown>;
  features?: readonly string[];
  placement?: {
    grade: string;
    backHref: string;
  };
}) {
  const info = courses[course];
  const backHref = placement?.backHref ?? "/";
  const backLabel = placement?.grade ?? "Хичээл сонгох";
  const [id, setId] = useState("");
  const [teacher, setTeacher] = useState(false);
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const [examActive, setExamActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`classroom-entry entry-${course}`} lang="mn">
      <header className="classroom-entry-header">
        <Link
          href={backHref}
          className="classroom-wordmark"
          prefetch={false}
          aria-label={`КодЛаб · ${backLabel}`}
        >
          <span className="classroom-logo">
            <Code2 size={23} />
          </span>
          <span>
            Код<span>Лаб</span>
          </span>
        </Link>
        <Link href={backHref} className="classroom-back" prefetch={false}>
          <ArrowLeft size={16} /> {backLabel}
        </Link>
      </header>
      <main id="main-content" className="classroom-entry-main">
        <section className="classroom-story" aria-labelledby="course-heading">
          <div className="classroom-course-label">
            <span>{info.mark}</span>
            <strong>{info.name}</strong>
            <i />
            {placement?.grade ?? info.grade}
          </div>
          <h1 id="course-heading">{info.title}</h1>
          <p>{info.description}</p>
          <div className="classroom-code" aria-label="Код ба үр дүнгийн жишээ">
            <div className="classroom-code-file">
              <Code2 size={15} />
              <span>{info.file}</span>
              <span>Жишээ</span>
            </div>
            <pre>{info.code}</pre>
            <div className="classroom-code-output">
              <span>ҮР ДҮН</span>
              <pre>{info.output}</pre>
              <Check size={18} />
            </div>
          </div>
          <ul className="classroom-features">
            {(features ?? info.features).map((feature) => (
              <li key={feature}>
                <Check size={15} />
                {feature}
              </li>
            ))}
          </ul>
        </section>
        <section
          className="classroom-entry-card"
          aria-labelledby="entry-heading"
        >
          <div className="classroom-entry-icon">
            <UserRound size={23} />
          </div>
          <p className="classroom-eyebrow">ТАНЫ СУРАЛЦАХ ОРОН ЗАЙ</p>
          <h2 id="entry-heading">Хичээлдээ тавтай морил.</h2>
          <p className="classroom-entry-description">
            {teacher
              ? "Бүртгэлтэй нэр болон нууц үгээ оруулна уу."
              : "Сургуулийн ID-гаа оруулаад хичээлээ үргэлжлүүлээрэй."}
          </p>
          <form
            aria-busy={busy}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              setError("");
              setExamActive(false);
              try {
                await enterLesson(
                  id,
                  teacher ? credential : undefined,
                  onLogin,
                );
                setCredential("");
              } catch (error) {
                setExamActive(
                  error instanceof Error &&
                    "status" in error &&
                    error.status === 423,
                );
                const message =
                  error instanceof Error
                    ? error.message
                    : "Холболтоо шалгаад дахин оролдоорой.";
                setError(
                  message === "Invalid student ID"
                    ? "Үсэг, тоо, цэг, зураас эсвэл доогуур зураас ашиглаарай."
                    : message,
                );
                input.current?.focus();
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="student-id">
              {teacher ? "Багшийн нэвтрэх нэр эсвэл бүтэн нэр" : "Сурагчийн ID"}
            </label>
            <input
              ref={input}
              id="student-id"
              name="studentId"
              value={id}
              required
              maxLength={MAX_TEACHER_NAME_LENGTH}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={teacher ? undefined : `Жишээ: ${info.placeholder}`}
              readOnly={busy}
              aria-invalid={!!error}
              aria-describedby="entry-error"
              onChange={(event) => {
                setId(event.target.value.normalize("NFKC"));
                setError("");
                setExamActive(false);
              }}
            />
            {teacher && (
              <>
                <label htmlFor="lesson-credential">Багшийн нууц үг</label>
                <input
                  id="lesson-credential"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={1024}
                  value={credential}
                  readOnly={busy}
                  onChange={(event) => {
                    setCredential(event.target.value);
                    setError("");
                  }}
                />
              </>
            )}
            <p id="entry-error" role="alert" className="classroom-entry-error">
              {error}
              {examActive && (
                <>
                  {" "}
                  <Link href="/exam" prefetch={false}>
                    Шалгалтаа үргэлжлүүлэх →
                  </Link>
                </>
              )}
            </p>
            <button type="submit" className="classroom-enter" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={18} className="classroom-spinner" /> Ахиц
                  ачаалж байна…
                </>
              ) : (
                <>
                  Хичээлд орох <ArrowRight size={18} />
                </>
              )}
            </button>
            <button
              type="button"
              className="classroom-login-mode"
              disabled={busy}
              onClick={() => {
                setTeacher(!teacher);
                setId("");
                setCredential("");
                setError("");
                setExamActive(false);
                input.current?.focus();
              }}
            >
              {teacher ? "Сурагчаар нэвтрэх" : "Багшаар нэвтрэх"}
            </button>
          </form>
          <div className="classroom-save-note">
            <Cloud size={21} />
            <div>
              <strong>Эхэлсэн газраасаа үргэлжлүүлнэ</strong>
              <p>
                Код, ахиц тань хадгалагдана. Өөр компьютер дээр ч өөрийн
                бүртгэлээр ороорой.
              </p>
            </div>
          </div>
          <p className="classroom-id-note">
            Зөвхөн өөрийн ID эсвэл нэрийг ашиглаарай.
          </p>
        </section>
      </main>
      <footer className="classroom-entry-footer">
        <span>Кодоо бич. Турш. Дахин оролд.</span>
        <span>КодЛаб · {info.name}</span>
      </footer>
    </div>
  );
}
