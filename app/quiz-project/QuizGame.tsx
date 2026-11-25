"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock, Play, RotateCcw, X } from "lucide-react";
import {
  answerLength,
  demoQuestions,
  rarityLevels,
  type QuizGrade,
  type QuizQuestion,
  type RarityPoints,
} from "@/lib/curriculum/quiz-project";
import { expectedScore, runScores } from "@/lib/curriculum/quiz-project-code";
import styles from "./project.module.css";

const roundSeconds = 30;
type Game = { questions: QuizQuestion[] } & (
  { kind: "demo" } | { kind: "project"; grade: QuizGrade; code: string }
);
type RoundResult =
  | { kind: "timeout"; points: 0 }
  | { kind: "answer"; guess: string; points: 0 | RarityPoints };

export default function QuizGame({
  grade,
  code,
  questions,
  codeReady,
  questionsReady,
  onEdit,
}: {
  grade: QuizGrade;
  code: string;
  questions: QuizQuestion[];
  codeReady: boolean;
  questionsReady: boolean;
  onEdit: () => void;
}) {
  const [timed, setTimed] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  if (game)
    return (
      <QuizPlayer game={game} timed={timed} onLeave={() => setGame(null)} />
    );

  return (
    <div>
      <div className={styles.setupIntro}>
        <h2>Тоглоомоо турших</h2>
        <label className={styles.timerOption}>
          <input
            type="checkbox"
            checked={timed}
            onChange={(event) => setTimed(event.target.checked)}
          />
          <Clock size={16} aria-hidden="true" /> Асуулт бүр {roundSeconds}{" "}
          секунд
        </label>
      </div>
      <div className={styles.gameChoices}>
        <section
          className={styles.demoChoice}
          aria-labelledby="demo-choice-title"
        >
          <h3 id="demo-choice-title">Жишээ тоглоом</h3>
          <p>
            Гурван асуултад тус бүр нэг хариулт бичиж, ховор зөв хариултаар илүү
            оноо аваарай.
          </p>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setGame({ kind: "demo", questions: demoQuestions })}
          >
            <Play size={16} aria-hidden="true" /> Жишээгээр тоглох
          </button>
        </section>
        <section
          className={styles.ownChoice}
          aria-labelledby="own-choice-title"
        >
          <h3 id="own-choice-title">Миний тоглоом</h3>
          <p>
            {!codeReady
              ? "Онооны кодоо шалгаад бүх шалгалтад тэнцээрэй."
              : !questionsReady
                ? "Асуултуудаа гүйцээгээд тоглоорой."
                : `Өөрийн бичсэн код, ${questions.length} асуултаар тоглоно.`}
          </p>
          {codeReady && questionsReady ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() =>
                setGame({ kind: "project", grade, code, questions })
              }
            >
              <Play size={16} aria-hidden="true" /> Миний тоглоомыг эхлэх
            </button>
          ) : (
            <button type="button" className={styles.secondary} onClick={onEdit}>
              {codeReady ? "Асуултаа гүйцээх" : "Код руу очих"}{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function QuizPlayer({
  game,
  timed,
  onLeave,
}: {
  game: Game;
  timed: boolean;
  onLeave: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const points = results.reduce((total, result) => total + result.points, 0);
  const question = game.questions[index];
  const result = results[index];
  const finishHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!question) finishHeading.current?.focus();
  }, [question]);

  return (
    <section
      className={styles.player}
      aria-label={game.kind === "demo" ? "Жишээ тоглоом" : "Миний тоглоом"}
    >
      <div className={styles.playerBar}>
        <div className={styles.gamePosition}>
          <span>
            {game.kind === "demo" ? "Жишээ тоглоом" : "Миний тоглоом"}
          </span>
          <strong>
            {question
              ? `Асуулт ${index + 1} / ${game.questions.length}`
              : "Дүн"}
          </strong>
        </div>
        <div className={styles.playerActions}>
          <span className={styles.scoreTotal}>
            <strong>{points}</strong> оноо
          </span>
          <button type="button" className={styles.leaveGame} onClick={onLeave}>
            <X size={18} aria-hidden="true" />
            <span>Гарах</span>
          </button>
        </div>
      </div>
      {question ? (
        <QuizRound
          key={index}
          game={game}
          question={question}
          timed={timed}
          result={result}
          onResult={(outcome) =>
            setResults((previous) =>
              previous.length === index ? [...previous, outcome] : previous,
            )
          }
          onNext={() => setIndex(index + 1)}
          final={index === game.questions.length - 1}
        />
      ) : (
        <div className={styles.roundContent}>
          <h2 ref={finishHeading} tabIndex={-1}>
            Тоглоом дууслаа
          </h2>
          <p className={styles.finishScore}>
            <strong>{points}</strong> /{" "}
            {game.questions.length * rarityLevels[2].points} оноо
          </p>
          <ol className={styles.roundReview}>
            {results.map((outcome, i) => (
              <li key={i}>
                <div>
                  <strong>{game.questions[i].prompt}</strong>
                  <span>
                    {outcome.kind === "timeout"
                      ? "Хугацаа дууссан"
                      : outcome.guess}
                  </span>
                </div>
                <b>{outcome.points}</b>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className={styles.gameButton}
            onClick={() => {
              setResults([]);
              setIndex(0);
            }}
          >
            <RotateCcw size={16} aria-hidden="true" /> Дахин тоглох
          </button>
        </div>
      )}
    </section>
  );
}

function QuizRound({
  game,
  question,
  timed,
  result,
  onResult,
  onNext,
  final,
}: {
  game: Game;
  question: QuizQuestion;
  timed: boolean;
  result?: RoundResult;
  onResult: (result: RoundResult) => void;
  onNext: () => void;
  final: boolean;
}) {
  const [deadline] = useState(() =>
    timed ? Date.now() + roundSeconds * 1000 : null,
  );
  const [remaining, setRemaining] = useState(roundSeconds);
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitted = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    if (result) next.current?.focus();
  }, [result]);

  useEffect(() => {
    if (deadline === null || result || busy || error) return;
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds && !submitted.current) {
        submitted.current = true;
        onResult({ kind: "timeout", points: 0 });
      }
    }, 150);
    return () => window.clearInterval(interval);
  }, [deadline, result, busy, error, onResult]);

  async function submit() {
    if (submitted.current || !guess.trim()) return;
    submitted.current = true;
    if (deadline !== null && Date.now() >= deadline) {
      setRemaining(0);
      onResult({ kind: "timeout", points: 0 });
      return;
    }
    const scoreInput = { guess, answers: question.answers };
    if (game.kind === "demo") {
      onResult({
        kind: "answer",
        guess: guess.trim(),
        points: expectedScore(scoreInput),
      });
      return;
    }
    setBusy(true);
    const run = await runScores(game.grade, game.code, [scoreInput]);
    setBusy(false);
    if (run.kind === "error") {
      setError(run.message);
      return;
    }
    const score = run.scores[0];
    const level = rarityLevels.find(({ points }) => points === score);
    if (score !== 0 && !level) {
      setError("Оноо нь 0, 10, 20, 30-ын аль нэг байх ёстой.");
      return;
    }
    onResult({
      kind: "answer",
      guess: guess.trim(),
      points: level?.points ?? 0,
    });
  }

  return (
    <div className={styles.roundContent}>
      {timed && !result && (
        <div className={styles.countdown}>
          <progress
            aria-label="Асуултын үлдсэн хугацаа"
            max={roundSeconds}
            value={remaining}
          />
          <span role="timer">
            <Clock size={15} aria-hidden="true" /> {remaining} сек
          </span>
        </div>
      )}
      <h2>{question.prompt.trim()}</h2>
      {result ? (
        <div className={styles.roundResult}>
          <h3>
            {result.kind === "timeout"
              ? "Хугацаа дууслаа"
              : result.points > 0
                ? `+${result.points} оноо`
                : "Энэ хариулт 0 оноо"}
          </h3>
          {result.kind === "answer" && <p>Таны хариулт · {result.guess}</p>}
          <ul aria-label="Зөв хариултууд">
            {question.answers.map(({ text, points }) => (
              <li key={text}>
                {text.trim()} <b>{points}</b>
              </li>
            ))}
          </ul>
          <button
            ref={next}
            type="button"
            className={styles.gameButton}
            onClick={onNext}
          >
            {final ? "Дүн харах" : "Дараагийн асуулт"}{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      ) : error ? (
        <div className={styles.gameError} role="alert">
          <p>{error}</p>
          <p>Онооны кодоо засаж дахин тоглоорой.</p>
        </div>
      ) : (
        <form
          className={styles.guessForm}
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className={styles.field}>
            Таны хариулт
            <input
              ref={input}
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              maxLength={answerLength + 12}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
          </label>
          <button
            type="submit"
            className={styles.gameButton}
            disabled={busy || !guess.trim()}
          >
            {busy ? "Оноо бодож байна…" : "Хариулах"}{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
