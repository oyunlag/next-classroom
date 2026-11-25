import { execute } from "@/apps/kodlab/src/runtime";
import {
  demoQuestions,
  normalizeGuess,
  rarityLevels,
  type QuizAnswer,
  type QuizGrade,
  type QuizProjectDraft,
  type QuizQuestion,
  type RarityPoints,
} from "./quiz-project";

export type ScoreInput = { guess: string; answers: readonly QuizAnswer[] };
const maxCodeLength = 12_000;

export function expectedScore({
  guess,
  answers,
}: ScoreInput): 0 | RarityPoints {
  const normalized = normalizeGuess(guess);
  return normalized
    ? (answers.find(({ text }) => normalizeGuess(text) === normalized)
        ?.points ?? 0)
    : 0;
}

const animals: QuizAnswer[] = [
  { text: "Морь", points: 10 },
  { text: "Үхэр", points: 20 },
  { text: "Тэмээ", points: 30 },
];
const planets: QuizAnswer[] = [
  { text: "Санчир", points: 30 },
  { text: "Ангараг", points: 20 },
  { text: "Дэлхий", points: 10 },
  { text: "Буд", points: 30 },
];

export function scorePracticeQuestion(grade: QuizGrade): QuizQuestion {
  const question = demoQuestions[0];
  return grade === 6 ? { ...question, answers: animals } : question;
}

export function scoreExamples(grade: QuizGrade): ScoreInput[] {
  const secondBank = grade === 6 ? planets.slice(0, 3) : planets;
  return [
    { guess: "морь", answers: animals },
    { guess: "  ҮХЭР  ", answers: animals },
    { guess: "тэмээ", answers: animals },
    { guess: "бүргэд", answers: animals },
    { guess: "   ", answers: animals },
    { guess: "анГАРАГ", answers: secondBank },
    {
      guess: grade === 6 ? "санчир" : "буд",
      answers: secondBank,
    },
    ...(grade === 8 ? [{ guess: "Дэлхий", answers: [] }] : []),
  ];
}

function scoringFunction(grade: QuizGrade, code: string) {
  if (grade === 8) return code;
  const params =
    grade === 6 ? "guess, common, uncommon, rare" : "guess, answers";
  return `function scoreAnswer(${params}) {\n${code}\nreturn points;\n}`;
}

export function scoreProgram(
  grade: QuizGrade,
  code: string,
  cases: readonly ScoreInput[],
) {
  const args = cases.map(({ guess, answers }) => {
    if (grade === 8) return [guess, answers];
    if (grade === 7)
      return [
        normalizeGuess(guess),
        answers.map(({ text, points }) => ({
          text: normalizeGuess(text),
          points,
        })),
      ];
    return [
      normalizeGuess(guess),
      ...rarityLevels.map(({ points }) =>
        normalizeGuess(
          answers.find((answer) => answer.points === points)?.text ?? "",
        ),
      ),
    ];
  });
  return `const kodlabCases = ${JSON.stringify(args)};
const kodlabScores = kodlabCases.map((args) => {
  const run = () => {
${scoringFunction(grade, code)}
    return scoreAnswer;
  };
  const value = run()(...args);
  return Number.isSafeInteger(value) ? value : null;
});
console.log(JSON.stringify(kodlabScores));`;
}

type RunResult =
  | { kind: "scores"; scores: (number | null)[] }
  | { kind: "error"; message: string };

export async function runScores(
  grade: QuizGrade,
  code: string,
  cases: readonly ScoreInput[],
): Promise<RunResult> {
  if (code.length > maxCodeLength)
    return { kind: "error", message: "Кодоо 12 000 тэмдэгтэд багтаагаарай." };
  try {
    const { logs, error } = await execute(scoreProgram(grade, code, cases));
    if (error) return { kind: "error", message: error };
    const scores: unknown = JSON.parse(logs.at(-1)?.text ?? "null");
    if (
      Array.isArray(scores) &&
      scores.length === cases.length &&
      scores.every(
        (score) =>
          score === null ||
          (typeof score === "number" && Number.isSafeInteger(score)),
      )
    )
      return { kind: "scores", scores };
  } catch {
    // A missing or malformed report is a failed run.
  }
  return {
    kind: "error",
    message: "Оноог уншиж чадсангүй. Кодоо шалгаад дахин ажиллуулаарай.",
  };
}

export function projectSource(grade: QuizGrade, draft: QuizProjectDraft) {
  return `// Ховор хариулт · ${grade}-р анги
// Асуултууд ба оноо бодох код
const questions = ${JSON.stringify(draft.questions, null, 2)};

const scoreAnswer = (() => {
${scoringFunction(grade, draft.code)}
return scoreAnswer;
})();\n`;
}
