"use client";

import { useState } from "react";
import { ArrowRight, Check, Plus, Trash2, X } from "lucide-react";
import {
  answerLength,
  answerLimit,
  blankQuestion,
  promptLength,
  questionIssue,
  questionLimit,
  rarityLevels,
  type QuizAnswer,
  type QuizGrade,
  type QuizQuestion,
} from "@/lib/curriculum/quiz-project";
import styles from "./project.module.css";

export default function QuestionEditor({
  grade,
  questions,
  onChange,
  onPlay,
}: {
  grade: QuizGrade;
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  onPlay: () => void;
}) {
  const [index, setIndex] = useState(0);
  const question = questions[index] ?? questions[0];
  const issue = questionIssue(question);
  const ready = questions.filter((item) => !questionIssue(item)).length;

  function update(next: QuizQuestion) {
    onChange(questions.map((item, i) => (i === index ? next : item)));
  }

  function updateAnswer(answerIndex: number, answer: QuizAnswer) {
    update({
      ...question,
      answers: question.answers.map((item, i) =>
        i === answerIndex ? answer : item,
      ),
    });
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.notes} aria-labelledby="questions-heading">
        <h2 id="questions-heading">Миний асуултууд</h2>
        <p className={styles.muted} role="status">
          {ready} / {questions.length} тоглоход бэлэн
        </p>
        <div className={styles.questionList}>
          {questions.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-current={index === i ? "true" : undefined}
              onClick={() => setIndex(i)}
            >
              <span>{i + 1}</span>
              <strong>{item.prompt.trim() || `Асуулт ${i + 1}`}</strong>
              {!questionIssue(item) && <Check size={15} aria-label="Бэлэн" />}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.secondary}
          disabled={questions.length >= questionLimit}
          onClick={() => {
            onChange([...questions, blankQuestion()]);
            setIndex(questions.length);
          }}
        >
          <Plus size={16} aria-hidden="true" /> Асуулт нэмэх
        </button>
        {questions.length === questionLimit && (
          <p className={styles.muted}>Дээд тал нь {questionLimit} асуулт.</p>
        )}
      </aside>
      <section className={styles.formPanel} aria-labelledby="question-heading">
        <div className={styles.panelTitle}>
          <h2 id="question-heading">Асуулт {index + 1}</h2>
          {questions.length > 1 && (
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                setIndex(Math.max(0, index - 1));
                onChange(questions.filter((_, i) => i !== index));
              }}
            >
              <Trash2 size={16} aria-hidden="true" /> Асуулт хасах
            </button>
          )}
        </div>
        <label className={styles.field}>
          Асуултын өгүүлбэр
          <input
            value={question.prompt}
            maxLength={promptLength}
            onChange={(event) =>
              update({ ...question, prompt: event.target.value })
            }
            placeholder="Олон зөв хариулттай асуулт бичээрэй"
          />
        </label>
        <fieldset className={styles.answerFields}>
          <legend>Зөв хариултууд</legend>
          <p className={styles.muted}>
            Олоход хамгийн хэцүү зөв хариултдаа 30 оноо өг. Түвшин тус бүрд
            нэгээс доошгүй хариулт оруул.
          </p>
          {question.answers.map((answer, i) => {
            const level = rarityLevels.find(
              ({ points }) => points === answer.points,
            );
            return (
              <div className={styles.answerRow} key={i}>
                <input
                  aria-label={
                    grade === 6
                      ? `${level?.label} хариулт`
                      : `Зөв хариулт ${i + 1}`
                  }
                  placeholder="Зөв хариулт"
                  value={answer.text}
                  maxLength={answerLength}
                  onChange={(event) =>
                    updateAnswer(i, { ...answer, text: event.target.value })
                  }
                />
                {grade === 6 ? (
                  <span className={styles.rarityLabel}>
                    {level?.label} · {answer.points}
                  </span>
                ) : (
                  <select
                    aria-label={`Хариулт ${i + 1} · түвшин`}
                    value={answer.points}
                    onChange={(event) => {
                      const selected = rarityLevels.find(
                        ({ points }) => String(points) === event.target.value,
                      );
                      if (selected)
                        updateAnswer(i, { ...answer, points: selected.points });
                    }}
                  >
                    {rarityLevels.map(({ points, label }) => (
                      <option key={points} value={points}>
                        {label} · {points}
                      </option>
                    ))}
                  </select>
                )}
                {grade !== 6 &&
                  question.answers.length > rarityLevels.length && (
                    <button
                      type="button"
                      className={styles.removeAnswer}
                      aria-label={`${i + 1}-р хариултыг хасах`}
                      onClick={() =>
                        update({
                          ...question,
                          answers: question.answers.filter((_, j) => i !== j),
                        })
                      }
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
              </div>
            );
          })}
        </fieldset>
        {grade !== 6 && question.answers.length < answerLimit && (
          <button
            type="button"
            className={styles.textButton}
            onClick={() =>
              update({
                ...question,
                answers: [...question.answers, { text: "", points: 10 }],
              })
            }
          >
            <Plus size={16} aria-hidden="true" /> Хариулт нэмэх
          </button>
        )}
        <div className={styles.formActions}>
          <p className={issue ? styles.muted : styles.valid}>
            {issue || "Асуулт тоглоход бэлэн."}
          </p>
          <button type="button" className={styles.primary} onClick={onPlay}>
            Тоглох хэсэг <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
