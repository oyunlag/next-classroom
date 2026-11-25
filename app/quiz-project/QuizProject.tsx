"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Download,
  Play,
} from "lucide-react";
import WebEditor from "@/app/web-lab/WebEditor";
import { useSessionDraft } from "@/lib/curriculum/practice/use-session-draft";
import {
  blankQuizProject,
  questionIssue,
  quizGrades,
  quizLessons,
  rarityLevels,
  readQuizDraft,
  type QuizGrade,
  type QuizProjectDraft,
} from "@/lib/curriculum/quiz-project";
import {
  expectedScore,
  projectSource,
  runScores,
  scoreExamples,
  type ScoreInput,
} from "@/lib/curriculum/quiz-project-code";
import QuestionEditor from "./QuestionEditor";
import QuizGame from "./QuizGame";
import styles from "./project.module.css";

const steps = [
  { id: "code", label: "Код бичих" },
  { id: "questions", label: "Асуулт зохиох" },
  { id: "play", label: "Тоглох" },
] as const;
type Step = (typeof steps)[number]["id"];
type CheckCase = { input: ScoreInput; expected: number; actual: number | null };
type CodeCheck =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "error"; message: string }
  | { kind: "results"; cases: CheckCase[] };

function downloadProject(grade: QuizGrade, draft: QuizProjectDraft) {
  const url = URL.createObjectURL(
    new Blob([projectSource(grade, draft)], {
      type: "text/javascript;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `khovor-khariult-${grade}.js`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function QuizProject({ grade }: { grade: QuizGrade }) {
  const initial = useMemo(() => blankQuizProject(grade), [grade]);
  const restore = useCallback(
    (raw: unknown) => readQuizDraft(raw, grade),
    [grade],
  );
  const [draft, updateDraft, warning] = useSessionDraft(
    `kodlab:quiz-project:v1:${grade}`,
    initial,
    restore,
  );
  const [step, setStep] = useState<Step>("code");
  const [check, setCheck] = useState<CodeCheck>({ kind: "idle" });
  const checkSequence = useRef(0);
  const stepHeading = useRef<HTMLDivElement>(null);
  const lesson = quizLessons[grade];
  const readyQuestions = draft.questions.filter(
    (question) => !questionIssue(question),
  ).length;
  const questionsReady = readyQuestions === draft.questions.length;
  const codeReady =
    check.kind === "results" &&
    check.cases.every((item) => item.actual === item.expected);

  function goTo(next: Step) {
    setStep(next);
    stepHeading.current?.focus({ preventScroll: true });
    stepHeading.current?.scrollIntoView({ block: "nearest" });
  }

  function editCode(code: string) {
    checkSequence.current++;
    setCheck({ kind: "idle" });
    updateDraft({ ...draft, code });
  }

  async function checkCode() {
    if (check.kind === "running") return;
    const sequence = ++checkSequence.current;
    setCheck({ kind: "running" });
    const inputs = scoreExamples(grade);
    const result = await runScores(grade, draft.code, inputs);
    if (sequence !== checkSequence.current) return;
    setCheck(
      result.kind === "error"
        ? result
        : {
            kind: "results",
            cases: inputs.map((input, i) => ({
              input,
              expected: expectedScore(input),
              actual: result.scores[i],
            })),
          },
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className="classroom-wordmark" prefetch={false}>
            <span className="classroom-logo">
              <Code2 size={22} aria-hidden="true" />
            </span>
            <span>
              Oyunlag <span>code</span>
            </span>
          </Link>
          <a href="/kodlab/index.html" className={styles.back}>
            <ArrowLeft size={16} aria-hidden="true" /> JavaScript дасгалууд
          </a>
        </div>
      </header>
      <main id="main-content" className={styles.main}>
        <div className={styles.intro}>
          <div>
            <p className={styles.category}>JavaScript төсөл</p>
            <h1>Ховор хариулт</h1>
            <p>
              Ховор зөв хариулт илүү оноотой. Оноо бодох кодоо бичээд, өөрийн
              зохиосон асуултаар тоглоорой.
            </p>
          </div>
          <nav className={styles.grades} aria-label="Анги сонгох">
            {quizGrades.map((value) => (
              <Link
                key={value}
                href={`/quiz-project?grade=${value}`}
                aria-current={value === grade ? "page" : undefined}
                prefetch={false}
              >
                {value}-р анги
              </Link>
            ))}
          </nav>
        </div>
        <div ref={stepHeading} tabIndex={-1} className={styles.projectNav}>
          <nav aria-label="Төслийн алхмууд">
            {steps.map(({ id, label }, i) => (
              <button
                key={id}
                type="button"
                aria-current={step === id ? "step" : undefined}
                onClick={() => setStep(id)}
              >
                <span aria-hidden="true">{i + 1}</span> {label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => downloadProject(grade, draft)}
          >
            <Download size={16} aria-hidden="true" /> Код татах
          </button>
        </div>
        {step === "code" && (
          <div className={styles.workspace}>
            <section className={styles.notes} aria-labelledby="code-heading">
              <h2 id="code-heading">Оноо бодох</h2>
              <p className={styles.muted}>{lesson.topics}</p>
              <ol>
                {lesson.steps.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
              <div className={styles.rarity} aria-label="Онооны дүрэм">
                {rarityLevels.map(({ points, label }) => (
                  <span key={points}>
                    <b>{points}</b> {label}
                  </span>
                ))}
              </div>
              <details className={styles.hint}>
                <summary>Санамж</summary>
                <p>{lesson.hint}</p>
              </details>
              <a className={styles.reviewLink} href={lesson.review.href}>
                {lesson.review.label}{" "}
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </section>
            <section className={styles.editor} aria-labelledby="file-heading">
              <div className={styles.editorTitle}>
                <h2 id="file-heading">
                  <Code2 size={16} aria-hidden="true" /> answer.js
                </h2>
                <span>JavaScript</span>
              </div>
              <WebEditor
                file="answer.js"
                code={draft.code}
                onChange={editCode}
                onRun={() => void checkCode()}
              />
              <div className={styles.editorActions}>
                <button
                  className={styles.primary}
                  type="button"
                  onClick={() => void checkCode()}
                  disabled={check.kind === "running"}
                >
                  <Play size={16} aria-hidden="true" />{" "}
                  {check.kind === "running" ? "Шалгаж байна…" : "Кодоо шалгах"}
                </button>
                {codeReady && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => goTo("questions")}
                  >
                    Асуултаа зохиох <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              <CheckFeedback check={check} />
            </section>
          </div>
        )}
        {step === "questions" && (
          <QuestionEditor
            grade={grade}
            questions={draft.questions}
            onChange={(questions) => updateDraft({ ...draft, questions })}
            onPlay={() => goTo("play")}
          />
        )}
        {step === "play" && (
          <QuizGame
            grade={grade}
            code={draft.code}
            questions={draft.questions}
            codeReady={codeReady}
            questionsReady={questionsReady}
            onEdit={() => goTo(codeReady ? "questions" : "code")}
          />
        )}
        <p className={styles.saveNote} role="status">
          {warning ||
            "Ноорог энэ табд хадгалагдана. Асуулт, кодоо хамтад нь JS файлаар татаж болно."}
        </p>
      </main>
    </div>
  );
}

function CheckFeedback({ check }: { check: CodeCheck }) {
  if (check.kind === "idle" || check.kind === "running") return null;
  if (check.kind === "error")
    return (
      <pre className={styles.error} role="alert">
        {check.message}
      </pre>
    );
  const passed = check.cases.filter(
    ({ actual, expected }) => actual === expected,
  ).length;
  return (
    <div className={styles.feedback}>
      <p role="status">
        {passed === check.cases.length && (
          <Check size={17} aria-hidden="true" />
        )}
        {passed} / {check.cases.length} шалгалт зөв
      </p>
      <details open={passed !== check.cases.length}>
        <summary>Шалгалтын үр дүн</summary>
        <ul>
          {check.cases.map(({ input, expected, actual }) => (
            <li key={input.guess} data-passed={actual === expected}>
              <span>
                {input.answers.length
                  ? input.guess.trim()
                    ? `“${input.guess}”`
                    : "Хоосон хариулт"
                  : "Хоосон массив"}
              </span>
              <span>
                {actual === null ? "Тоон оноо алга" : `Гарсан ${actual}`} ·
                Хүлээсэн {expected}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
