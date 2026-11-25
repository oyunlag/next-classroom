"use client";

import { useState } from "react";
import { ArrowDown, Play } from "lucide-react";
import {
  answerLength,
  normalizeGuess,
  type QuizGrade,
  type QuizAnswer,
} from "@/lib/curriculum/quiz-project";
import {
  expectedScore,
  runScores,
  scorePracticeQuestion,
} from "@/lib/curriculum/quiz-project-code";
import styles from "./project.module.css";

const spacedGuess = "  ТЭМЭЭ  ";
const beginnerNames = ["common", "uncommon", "rare"];

function branch(index: number) {
  return index < 0
    ? "else"
    : `${index === 0 ? "if" : "else if"} (guess === ${beginnerNames[index]})`;
}

export default function ScorePlayground({
  grade,
  code,
}: {
  grade: QuizGrade;
  code: string;
}) {
  const question = scorePracticeQuestion(grade);
  const picks = [
    ...question.answers.map(({ text }) => ({ label: text, value: text })),
    { label: "Бүргэд", value: "Бүргэд" },
    ...(grade === 8 ? [{ label: "Том үсэг, зайтай", value: spacedGuess }] : []),
  ];
  const [guess, setGuess] = useState(grade === 8 ? spacedGuess : "Тэмээ");
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<{
    code: string;
    guess: string;
    result: Awaited<ReturnType<typeof runScores>>;
  } | null>(null);
  const input = { guess, answers: question.answers };
  const expected = expectedScore(input);
  const result =
    last?.code === code && last.guess === guess ? last.result : null;
  const actual = result?.kind === "scores" ? result.scores[0] : null;

  async function run() {
    if (running) return;
    setRunning(true);
    const result = await runScores(grade, code, [input]);
    setLast({ code, guess, result });
    setRunning(false);
  }

  return (
    <section className={styles.practice} aria-labelledby="practice-heading">
      <div className={styles.practiceControls}>
        <h2 id="practice-heading">Жишээгээр турших</h2>
        <p>{question.prompt}</p>
        <div
          className={styles.practicePicks}
          role="group"
          aria-label="Жишээ хариулт сонгох"
        >
          {picks.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              aria-pressed={guess === value}
              onClick={() => setGuess(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          className={styles.practiceForm}
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <label className={styles.field}>
            Турших хариулт
            <input
              value={guess}
              maxLength={answerLength + 12}
              onChange={(event) => setGuess(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="submit" className={styles.secondary} disabled={running}>
            <Play size={15} aria-hidden="true" />{" "}
            {running ? "Ажиллаж байна…" : "Кодоо ажиллуулах"}
          </button>
        </form>
        <a href="#answer-code" className={styles.reviewLink}>
          Код бичих талбар <ArrowDown size={14} aria-hidden="true" />
        </a>
      </div>
      <div className={styles.practiceResult}>
        <div className={styles.expectedScore} aria-live="polite">
          <span>Хүлээх оноо</span>
          <strong>{expected}</strong>
        </div>
        <ScoreTrace
          grade={grade}
          guess={guess}
          answers={question.answers}
          points={expected}
        />
        {result?.kind === "error" && (
          <p role="alert" className={styles.trialError}>
            {result.message}
          </p>
        )}
        {result?.kind === "scores" && (
          <p
            role="status"
            className={styles.trialResult}
            data-passed={actual === expected}
          >
            {actual === null
              ? "Таны код тоон оноо гаргасангүй."
              : `Таны код ${actual} оноо гаргалаа.`}
            {actual === expected
              ? " Хүлээсэн үр дүнтэй таарлаа."
              : " Дүрмийн оноотой харьцуулаад кодоо шалгаарай."}
          </p>
        )}
      </div>
    </section>
  );
}

function ScoreTrace({
  grade,
  guess,
  answers,
  points,
}: {
  grade: QuizGrade;
  guess: string;
  answers: QuizAnswer[];
  points: number;
}) {
  const normalized = normalizeGuess(guess);
  const match = answers.findIndex(
    ({ text }) => normalizeGuess(text) === normalized,
  );
  const key =
    grade === 6
      ? branch(match)
      : match < 0
        ? "Таарсан элемент алга"
        : `answers[${match}].points`;
  const outcome = grade === 8 ? `return ${points}` : `points = ${points}`;

  return (
    <>
      <p>
        <code>guess</code> ={" "}
        <code className={styles.literal}>
          {JSON.stringify(grade === 8 ? guess : normalized)}
        </code>
      </p>
      {grade === 8 && (
        <p>
          <code>trim().toLowerCase()</code> →{" "}
          <code className={styles.literal}>{JSON.stringify(normalized)}</code>
        </p>
      )}
      <p className={styles.scorePath}>
        {grade === 6 || match >= 0 ? (
          <code data-keyword={grade === 6}>{key}</code>
        ) : (
          key
        )}
        <span aria-hidden="true"> → </span>
        <code>{outcome}</code>
      </p>
      <details className={styles.trace}>
        <summary>
          {grade === 6 ? "Нөхцөл бүрийг харах" : "Массивын элементүүдийг харах"}
        </summary>
        <ol>
          {answers.map(({ text, points }, i) => (
            <li key={text} data-match={i === match}>
              <code>{grade === 6 ? branch(i) : `answers[${i}]`}</code>
              <span>
                <code>
                  {JSON.stringify(grade === 8 ? text : normalizeGuess(text))}
                </code>{" "}
                · {points} оноо
              </span>
              <b>
                {i === match
                  ? "Таарлаа"
                  : grade !== 7 && match >= 0 && i > match
                    ? "Алгасав"
                    : "Таараагүй"}
              </b>
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}
