import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import {
  blankQuizProject,
  demoQuestions,
  questionIssue,
  quizGrades,
  readQuizDraft,
  type QuizGrade,
} from "./quiz-project";
import {
  expectedScore,
  projectSource,
  scoreExamples,
  scoreProgram,
  type ScoreInput,
} from "./quiz-project-code";

const solutions: Record<QuizGrade, string> = {
  6: `let points = 0;
if (guess === common) points = 10;
else if (guess === uncommon) points = 20;
else if (guess === rare) points = 30;`,
  7: `let points = 0;
for (let i = 0; i < answers.length; i++) {
  if (answers[i].text === guess) points = answers[i].points;
}`,
  8: `function scoreAnswer(guess, answers) {
  const text = guess.trim().toLowerCase();
  for (const answer of answers) {
    if (answer.text.trim().toLowerCase() === text) return answer.points;
  }
  return 0;
}`,
};

function scores(grade: QuizGrade, code: string, inputs = scoreExamples(grade)) {
  let output = "";
  runInNewContext(
    scoreProgram(grade, code, inputs),
    {
      console: { log: (value: string) => (output = value) },
    },
    { timeout: 1000 },
  );
  return JSON.parse(output);
}

for (const grade of quizGrades) {
  test(`Grade ${grade} starter needs student code and the completed code scores unseen inputs`, () => {
    const examples = scoreExamples(grade);
    const expected = examples.map(expectedScore);
    assert.notDeepEqual(scores(grade, blankQuizProject(grade).code), expected);
    assert.deepEqual(scores(grade, solutions[grade]), expected);

    const input: ScoreInput = {
      guess: "  ӨЛГИЙ  ",
      answers: [
        { text: "Өлгий", points: 30 },
        { text: "Дархан", points: 10 },
        { text: "Хархорин", points: 20 },
      ],
    };
    assert.deepEqual(scores(grade, solutions[grade], [input]), [30]);
    assert.deepEqual(
      scores(grade, solutions[grade], [{ ...input, guess: "Эрдэнэт" }]),
      [0],
    );
  });
}

test("question validation rejects blank and case-insensitive duplicate answers", () => {
  const [question] = demoQuestions;
  assert.equal(questionIssue(question), "");
  assert.ok(questionIssue({ ...question, prompt: " " }));
  assert.ok(
    questionIssue({
      ...question,
      answers: [...question.answers, { text: "  ", points: 30 }],
    }),
  );
  assert.ok(
    questionIssue({
      ...question,
      answers: [...question.answers, { text: "  МОРЬ ", points: 30 }],
    }),
  );
  assert.ok(
    questionIssue({
      ...question,
      answers: question.answers.filter(({ points }) => points !== 30),
    }),
  );
});

test("draft restore preserves unfinished work and validates grade-specific question shapes", () => {
  const draft = blankQuizProject(6);
  assert.deepEqual(readQuizDraft(JSON.parse(JSON.stringify(draft)), 6), draft);
  assert.equal(readQuizDraft({ ...draft, questions: [] }, 6), null);
  assert.equal(readQuizDraft({ ...draft, questions: demoQuestions }, 6), null);
  assert.deepEqual(readQuizDraft({ ...draft, questions: demoQuestions }, 7), {
    ...draft,
    questions: demoQuestions,
  });
  assert.equal(
    readQuizDraft(
      {
        ...draft,
        questions: [{ prompt: "Асуулт", answers: [null, null, null] }],
      },
      8,
    ),
    null,
  );
});

test("source download carries student questions and compiles with the scoring scaffold", () => {
  const draft = {
    code: solutions[6],
    questions: [
      {
        prompt: 'Текст "хашилттай"',
        answers: [0, 2, 4].map((index) => demoQuestions[0].answers[index]),
      },
    ],
  };
  const source = projectSource(6, draft);
  const result = runInNewContext(
    `${source}\n[questions[0].prompt, scoreAnswer("морь", "морь", "ямаа", "тэмээ")];`,
  );
  assert.equal(result[0], draft.questions[0].prompt);
  assert.equal(result[1], 10);
});
