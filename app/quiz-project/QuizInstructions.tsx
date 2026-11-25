import { ArrowRight } from "lucide-react";
import { quizLessons, type QuizGrade } from "@/lib/curriculum/quiz-project";
import styles from "./project.module.css";

const keywords = new Set([
  "let",
  "if",
  "else if",
  "else",
  "if / else",
  "for",
  "return",
  "return 0",
  "===",
  "=",
]);

function LessonText({ text }: { text: string }) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 === 0 ? (
      part
    ) : (
      <code key={i} data-keyword={keywords.has(part)}>
        {part}
      </code>
    ),
  );
}

export default function QuizInstructions({ grade }: { grade: QuizGrade }) {
  const lesson = quizLessons[grade];
  return (
    <section
      className={`${styles.notes} ${styles.guide}`}
      aria-labelledby="code-heading"
    >
      <h2 id="code-heading">Оноо бодох</h2>
      <p className={styles.muted}>
        <LessonText text={lesson.topics} />
      </p>
      <p className={styles.guideIntro}>
        Тоглогч нэг асуултад нэг хариулт бичнэ. Таны <code>answer.js</code>{" "}
        тухайн хариултын оноог бодно. Тоглоом үүнийг нийт оноонд нэмээд
        дараагийн асуултыг харуулна.
      </p>

      <h3>Хувьсагч ба утга</h3>
      <dl className={styles.variables}>
        {lesson.variables.map(({ name, type, description }) => (
          <div key={name}>
            <dt>
              <code>{name}</code> <span>{type}</span>
            </dt>
            <dd>
              <LessonText text={description} />
            </dd>
          </div>
        ))}
      </dl>

      <h3>Код бичих алхмууд</h3>
      <ol>
        {lesson.steps.map(({ title, detail }) => (
          <li key={title}>
            <strong>{title}</strong>
            <p>
              <LessonText text={detail} />
            </p>
          </li>
        ))}
      </ol>

      <p className={styles.snippetTitle}>{lesson.example.title}</p>
      <pre className={styles.snippet}>
        <code>{lesson.example.code}</code>
      </pre>
      <details className={styles.hint}>
        <summary>Санамж</summary>
        <p>
          <LessonText text={lesson.hint} />
        </p>
      </details>
      <a className={styles.reviewLink} href={lesson.review.href}>
        <LessonText text={lesson.review.label} />{" "}
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </section>
  );
}
