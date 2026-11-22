import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { allExercises, exercises, findExercise, modules } from "./course";
import {
  grade10ExerciseGroups,
  grade10Exercises,
  grade10Topics,
} from "./grade-10-practice";
import { questions } from "./questions";
import {
  emptyProgress,
  normalizeStudent,
  restoreProgress,
  storageKey,
  validStudent,
} from "./storage";

const harness = readFileSync(
  new URL("../../public/python/harness.py", import.meta.url),
  "utf8",
);
function python(requests: object[]) {
  const source = `${harness}\nimport sys\nrequests = json.load(sys.stdin)\nprint(json.dumps([run_request(request) for request in requests], ensure_ascii=False))`;
  const directory = mkdtempSync(join(tmpdir(), "kodlab-python-"));
  try {
    const result = spawnSync("python3", ["-c", source], {
      cwd: directory,
      input: JSON.stringify(requests),
      encoding: "utf8",
      timeout: 15000,
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout) as {
      output: string;
      error?: string;
      checks: { label: string; passed: boolean }[];
    }[];
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("the course has 28 unique exercises across seven modules and a quiz per module", () => {
  assert.equal(exercises.length, 28);
  assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 28);
  assert.equal(questions.length, 21);
  for (const [index] of modules.entries()) {
    assert(exercises.some((exercise) => exercise.module === index));
    assert.equal(
      questions.filter((question) => question.module === index).length,
      3,
    );
  }
  for (const exercise of exercises) {
    assert(exercise.tests.length > 0);
    assert(exercise.requirements.length > 0);
    assert(exercise.hints.length > 0);
  }
});

test("every Python solution passes all structure and behavior checks", () => {
  const results = python(
    allExercises.map((exercise) => ({
      mode: "check",
      code: exercise.solution,
      tests: exercise.tests,
      requirements: exercise.requirements,
    })),
  );
  results.forEach((result, index) => {
    assert(!result.error, `${allExercises[index].id}: ${result.error}`);
    assert(result.checks.length > 0);
    assert.deepEqual(
      result.checks.filter((check) => !check.passed),
      [],
      allExercises[index].id,
    );
  });
});

test("every sample runs with its supplied input and produces the stated output", () => {
  const results = python(
    allExercises.map((exercise) => ({
      code: exercise.solution,
      inputs: exercise.inputs ?? [],
    })),
  );
  results.forEach((result, index) => {
    assert(!result.error, `${allExercises[index].id}: ${result.error}`);
    assert.equal(
      result.output,
      allExercises[index].expected,
      allExercises[index].id,
    );
  });
});

test("Grade 10 has 30 additional problems ordered by difficulty across its Python topics", () => {
  assert.equal(grade10Exercises.length, 30);
  assert.equal(
    new Set(allExercises.map(({ id }) => id)).size,
    allExercises.length,
  );
  assert.deepEqual(
    grade10ExerciseGroups.map(({ title }) => title),
    ["Эхлэл", "Дадлага", "Сорилт"],
  );
  assert.deepEqual(
    grade10ExerciseGroups.map(({ items }) => items.length),
    [10, 10, 10],
  );
  for (const { title, items } of grade10ExerciseGroups) {
    assert(
      items.every(({ level, tests }) => level === title && tests.length >= 3),
    );
    assert(new Set(items.map(({ module }) => module)).size > 1);
  }
  assert.deepEqual(
    new Set(grade10Exercises.map(({ module }) => module)),
    new Set(grade10Topics.keys()),
  );
});

test("restoring Python progress keeps the saved position and completion in both banks", () => {
  const restored = restoreProgress(
    JSON.stringify({
      ...emptyProgress(),
      active: "battery",
      grade10Active: "g10-warm-streak",
      completed: ["battery", "g10-warm-streak"],
      drafts: {
        "g10-warm-streak": {
          code: "print(2)",
          inputs: "15\n18 16",
          solutionViewed: false,
        },
      },
    }),
  );
  assert.equal(restored.active, "battery");
  assert.equal(restored.grade10Active, "g10-warm-streak");
  assert.deepEqual(restored.completed, ["battery", "g10-warm-streak"]);
  assert.equal(restored.drafts["g10-warm-streak"].code, "print(2)");
  assert.equal(
    restoreProgress(JSON.stringify({ ...restored, active: "g10-warm-streak" }))
      .active,
    "g10-warm-streak",
  );
});

test("the replaced exercise preserves past work separately and opens its metric replacement", () => {
  const retiredId = "g10-temperature-converter";
  const replacementId = "g10-field-trip-distance";
  const draft = { code: "print(68)", inputs: "20", solutionViewed: false };
  const restored = restoreProgress(
    JSON.stringify({
      ...emptyProgress(),
      active: retiredId,
      grade10Active: retiredId,
      completed: [retiredId],
      drafts: { [retiredId]: draft },
    }),
  );
  assert.equal(findExercise(retiredId)?.id, replacementId);
  assert.equal(restored.active, replacementId);
  assert.equal(restored.grade10Active, replacementId);
  assert.deepEqual(restored.drafts[retiredId], draft);
  assert.equal(restored.drafts[replacementId], undefined);
  assert.deepEqual(restored.completed, [retiredId]);
});

test("hard-coded output and a wrong boundary cannot pass the battery exercise", () => {
  const exercise = exercises.find((exercise) => exercise.id === "battery")!;
  const results = python([
    {
      mode: "check",
      code: 'battery = 15\n# if\nprint("Батерейгаа цэнэглээрэй.")',
      tests: exercise.tests,
      requirements: exercise.requirements,
    },
    {
      mode: "check",
      code: exercise.solution.replace("<= 20", "< 20"),
      tests: exercise.tests,
      requirements: exercise.requirements,
    },
  ]);
  assert(
    results[0].checks.some(
      (check) => !check.passed && check.label.includes("if"),
    ),
  );
  assert(
    results[0].checks.some(
      (check) => !check.passed && check.label.includes("21"),
    ),
  );
  assert(
    results[1].checks.some(
      (check) => !check.passed && check.label.includes("20"),
    ),
  );
});

test("requirement detection uses syntax and ignores comments and strings", () => {
  const [result] = python([
    {
      mode: "check",
      code: '# for input()\nprint("while break continue")',
      requirements: [
        { kind: "node", name: "For", label: "for" },
        { kind: "call", name: "input", label: "input" },
      ],
    },
  ]);
  assert(result.checks.every((check) => !check.passed));
});

test("input errors, syntax errors and output limits return useful feedback", () => {
  const results = python([
    { code: "a = int(input())\nb = int(input())", inputs: ["2"] },
    { code: "if True\n    print(1)" },
    { code: 'for i in range(100000):\n    print("hello")' },
    { code: 'print(int("hello"))' },
  ]);
  assert(results[0].error?.includes("Оролт хүрэлцэхгүй"));
  assert(results[1].error?.includes("мөр 1"));
  assert(results[2].error?.includes("хэт урт"));
  assert(results[3].error?.includes("ValueError"));
});

test("each testcase starts with a fresh namespace and only the initial test value changes", () => {
  const [result] = python([
    {
      mode: "check",
      code: "nas = 15\nnas = nas + 1\nprint(nas)",
      tests: [
        { label: "1", variables: { nas: 20 }, expected: "21" },
        { label: "2", variables: { nas: 8 }, expected: "9" },
      ],
    },
  ]);
  assert(result.checks.every((check) => check.passed));
});

test("progress restore tolerates corrupt storage and filters unknown or solution-assisted completions", () => {
  assert.deepEqual(restoreProgress("invalid"), emptyProgress());
  assert.deepEqual(restoreProgress('{"version":99}'), emptyProgress());
  const restored = restoreProgress(
    JSON.stringify({
      version: 1,
      active: "unknown",
      completed: ["battery", "battery", "unknown", "hello"],
      drafts: {
        hello: { code: "print(1)", solutionViewed: true },
        battery: { code: "# draft", inputs: "20" },
        unknown: { code: "x" },
      },
      quizAttempts: {
        all: { answers: { "input-type": 1, bad: 99 }, submitted: false },
      },
    }),
  );
  assert.equal(restored.active, "hello");
  assert.deepEqual(restored.completed, ["battery"]);
  assert.equal(restored.drafts.battery.code, "# draft");
  assert.equal(restored.drafts.unknown, undefined);
  assert.deepEqual(restored.quizAttempts.all.answers, { "input-type": 1 });
});

test("student IDs normalize consistently and are kept in separate storage keys", () => {
  assert.equal(normalizeStudent(" 10a-01 "), "10A-01");
  assert(validStudent("10А-01"));
  assert(validStudent("САРУУЛ"));
  assert(validStudent(normalizeStudent("orgilsaikhan.ch")));
  assert(validStudent("A".repeat(40)));
  assert(!validStudent("A".repeat(41)));
  assert(!validStudent("a"));
  assert(!validStudent("has space"));
  assert.notEqual(storageKey("10A-01"), storageKey("10A-02"));
});

test("Python ID entry rejects values the shared server cannot accept", () => {
  for (const id of ["--", "_A", "-01"]) assert.equal(validStudent(id), false);
});
