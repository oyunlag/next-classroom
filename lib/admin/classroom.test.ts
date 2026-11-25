import assert from "node:assert/strict";
import test from "node:test";
import {
  exercises as js,
  playgroundStarter,
} from "../../apps/kodlab/src/content.js";
import { exercises as next } from "../course/lessons";
import { allExercises as python } from "../python/course";
import { emptyProgress } from "../python/storage";
import { attendance, isSchoolDay, schoolDay } from "../student/classroom";
import { exercises as web } from "../web-lab/lessons";
import { initialProgress } from "../web-lab/progress";
import { hasWorkChange } from "./progress";

test("participation requires entry and work in the same school day", () => {
  const before = new Date("2026-11-23T15:59:59.999Z");
  const after = new Date("2026-11-23T16:00:00.000Z");
  assert.equal(schoolDay(before), "2026-11-23");
  assert.equal(schoolDay(after), "2026-11-24");
  assert.equal(isSchoolDay("2026-02-30"), false);
  assert.equal(isSchoolDay("2026-11-24"), true);

  const work = {
    savedAt: after.toISOString(),
    completed: 2,
    attempted: 3,
    assisted: 1,
  };
  assert.equal(
    attendance({ enteredAt: after.toISOString(), work }),
    "participated",
  );
  assert.equal(attendance({ enteredAt: before.toISOString() }), "entered");
  assert.equal(attendance({ work }), "saved");
  assert.equal(attendance(undefined), "unrecorded");
});

test("starting a course or clicking between exercises does not count as work", () => {
  const initial = emptyProgress();
  const exercise = python[1];
  assert.equal(hasWorkChange("python", {}, initial), false);
  assert.equal(
    hasWorkChange("python", initial, {
      ...initial,
      active: exercise.id,
      grade10Active: exercise.id,
      drafts: {
        [exercise.id]: {
          code: exercise.starter,
          inputs: exercise.inputs?.join("\n") ?? "",
          solutionViewed: false,
        },
      },
      quizAttempts: { all: { answers: {}, submitted: false } },
    }),
    false,
  );
  assert.equal(
    hasWorkChange(
      "javascript",
      {},
      {
        active: js[0].id,
        play: playgroundStarter,
        drafts: { [js[0].id]: js[0].starter },
        attempt: { id: "quiz", index: 1, started: Date.now(), answers: {} },
      },
    ),
    false,
  );
  assert.equal(
    hasWorkChange(
      "nextjs",
      {},
      {
        active: next[0].id,
        drafts: {
          [next[0].id]: {
            files: next[0].starter,
            answers: {},
            viewedSolution: false,
          },
        },
      },
    ),
    false,
  );
  assert.equal(
    hasWorkChange(
      "htmlcss",
      {},
      {
        ...initialProgress,
        drafts: {
          [web[0].id]: { files: web[0].starter, viewedSolution: false },
        },
      },
    ),
    false,
  );
});

test("edits, completion and quiz answers count even when the lesson remains the same", () => {
  const initial = emptyProgress();
  const exercise = python[0];
  assert.equal(
    hasWorkChange("python", initial, {
      ...initial,
      drafts: { [exercise.id]: { code: "print(1)" } },
    }),
    true,
  );
  assert.equal(
    hasWorkChange("python", initial, {
      ...initial,
      completed: [exercise.id],
    }),
    true,
  );
  assert.equal(
    hasWorkChange("python", initial, {
      ...initial,
      quizAttempts: { all: { answers: { q1: 1 }, submitted: false } },
    }),
    true,
  );
  assert.equal(
    hasWorkChange(
      "javascript",
      {},
      { drafts: { [js[0].id]: "console.log(1)" } },
    ),
    true,
  );
  assert.equal(
    hasWorkChange(
      "nextjs",
      {},
      {
        drafts: {
          [next[0].id]: {
            files: next[0].starter,
            answers: { question: "Answer" },
          },
        },
      },
    ),
    true,
  );
  assert.equal(
    hasWorkChange("htmlcss", initialProgress, {
      ...initialProgress,
      drafts: {
        [web[0].id]: {
          files: { ...web[0].starter, "index.html": "<h1>Миний карт</h1>" },
        },
      },
    }),
    true,
  );
  assert.equal(
    hasWorkChange(
      "python",
      { completed: [python[0].id, python[1].id] },
      {
        completed: [python[1].id, python[0].id],
        active: python[1].id,
      },
    ),
    false,
  );
});
