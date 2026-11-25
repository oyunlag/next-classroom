export const quizGrades = [6, 7, 8] as const;
export type QuizGrade = (typeof quizGrades)[number];

export const rarityLevels = [
  { points: 10, label: "Түгээмэл" },
  { points: 20, label: "Ховордуу" },
  { points: 30, label: "Ховор" },
] as const;

export type RarityPoints = (typeof rarityLevels)[number]["points"];
export type QuizAnswer = { text: string; points: RarityPoints };
export type QuizQuestion = { prompt: string; answers: QuizAnswer[] };
export type QuizProjectDraft = { code: string; questions: QuizQuestion[] };

export const questionLimit = 7;
export const answerLimit = 8;
export const promptLength = 180;
export const answerLength = 80;

export const quizLessons = {
  6: {
    topics: "Хувьсагч ба if / else",
    starter: `let points = 0;

// guess-ийн утгыг common, uncommon, rare-тай харьцуулаарай.
// Таарсан хариултын оноог points-д хадгалаарай.
`,
    steps: [
      "guess нь тоглогчийн бичсэн хариулт. common, uncommon, rare нь гурван зөв хариулт.",
      "if / else if / else ашиглан guess аль хариулттай тэнцүүг шалга. Түгээмэл бол 10, ховордуу бол 20, ховор бол 30 оноог points-д хадгал.",
      "Таарах хариулт байхгүй бол points 0 байна. Тоглоом эцэст нь points-ийн утгыг уншина.",
    ],
    hint: "Нөхцөлд === ашиглаарай. Жишээ нь guess === common үнэн бол points = 10; гэж онооно.",
    review: {
      href: "/kodlab/index.html#/exercises/adventure",
      label: "Нөхцөл шалгах дасгал",
    },
  },
  7: {
    topics: "Давталт ба объект",
    starter: `let points = 0;

// answers массиваар давтаарай.
// Таарсан элементийн points утгыг хадгалаарай.
`,
    steps: [
      "guess нь тоглогчийн хариулт. answers массивын элемент бүр text ба points талбартай.",
      "Давталтаар answers-ийн элемент бүрийг шалга. text нь guess-тэй тэнцүү бол тухайн элементийн points утгыг ав.",
      "Массивын урт, хариултын дараалал өөрчлөгдөж болно. Таарахгүй бол points 0 байна.",
    ],
    hint: "for давталтад i-г 0-ээс эхлүүлж, i < answers.length үед давт. answers[i].text нь i дугаартай хариултын текст.",
    review: { href: "/curriculum/7/for-loops", label: "for давталтын хичээл" },
  },
  8: {
    topics: "Функц, массив ба оролт",
    starter: `function scoreAnswer(guess, answers) {
  // guess болон хариултын текстийг ижил хэлбэрт оруулаарай.
  // Таарсан хариултын оноог return ашиглан буцаагаарай.
  return 0;
}
`,
    steps: [
      "scoreAnswer(guess, answers) функцийг гүйцээ. answers массивын элемент бүр text ба points талбартай.",
      "guess болон хариултын text-ийг захын зайгүй, жижиг үсэгтэй болгож харьцуул. Таарсан хариултын points утгыг буцаа.",
      "Хоосон, буруу хариулт болон өөр урттай массивыг турш. Таарахгүй бол 0 буцаа.",
    ],
    hint: "trim() нь захын зайг арилгана. toLowerCase() жижиг үсэгт шилжүүлнэ. Хоёр текстэд ижил аргыг хэрэглэ.",
    review: {
      href: "/curriculum/8/game-testing",
      label: "Массивтай тоглоомын хичээл",
    },
  },
} satisfies Record<
  QuizGrade,
  {
    topics: string;
    starter: string;
    steps: string[];
    hint: string;
    review: { href: string; label: string };
  }
>;

export function blankQuestion(): QuizQuestion {
  return {
    prompt: "",
    answers: rarityLevels.map(({ points }) => ({ text: "", points })),
  };
}

export function blankQuizProject(grade: QuizGrade): QuizProjectDraft {
  return { code: quizLessons[grade].starter, questions: [blankQuestion()] };
}

export const normalizeGuess = (text: string) => text.trim().toLowerCase();

export function questionIssue({ prompt, answers }: QuizQuestion) {
  if (!prompt.trim()) return "Асуултын өгүүлбэрээ бичээрэй.";
  const texts = answers.map(({ text }) => normalizeGuess(text));
  if (texts.some((text) => !text)) return "Зөв хариулт бүрийн үгийг бичээрэй.";
  if (new Set(texts).size !== texts.length)
    return "Давхардсан хариултыг өөрчилж эсвэл хасаарай.";
  if (
    rarityLevels.some(
      ({ points }) => !answers.some((answer) => answer.points === points),
    )
  )
    return "Гурван түвшин тус бүрд дор хаяж нэг зөв хариулт оруулаарай.";
  return "";
}

function readAnswer(raw: unknown): QuizAnswer | null {
  if (!raw || typeof raw !== "object" || !("text" in raw) || !("points" in raw))
    return null;
  const level = rarityLevels.find(({ points }) => points === raw.points);
  return level &&
    typeof raw.text === "string" &&
    raw.text.length <= answerLength
    ? { text: raw.text, points: level.points }
    : null;
}

function readQuestion(raw: unknown, grade: QuizGrade): QuizQuestion | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("prompt" in raw) ||
    typeof raw.prompt !== "string" ||
    raw.prompt.length > promptLength ||
    !("answers" in raw) ||
    !Array.isArray(raw.answers) ||
    raw.answers.length < rarityLevels.length ||
    raw.answers.length > answerLimit
  )
    return null;
  const answers = raw.answers.map(readAnswer);
  if (!answers.every((answer) => answer !== null)) return null;
  if (
    grade === 6 &&
    (answers.length !== rarityLevels.length ||
      !rarityLevels.every(({ points }) =>
        answers.some((answer) => answer.points === points),
      ))
  )
    return null;
  return { prompt: raw.prompt, answers };
}

export function readQuizDraft(
  raw: unknown,
  grade: QuizGrade,
): QuizProjectDraft | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("code" in raw) ||
    typeof raw.code !== "string" ||
    !("questions" in raw) ||
    !Array.isArray(raw.questions) ||
    !raw.questions.length ||
    raw.questions.length > questionLimit
  )
    return null;
  const questions = raw.questions.map((question: unknown) =>
    readQuestion(question, grade),
  );
  return questions.every((question) => question !== null)
    ? { code: raw.code, questions }
    : null;
}

export const demoQuestions: QuizQuestion[] = [
  {
    prompt: "Монголын таван хошуу малын нэгийг нэрлээрэй.",
    answers: [
      { text: "Морь", points: 10 },
      { text: "Хонь", points: 10 },
      { text: "Ямаа", points: 20 },
      { text: "Үхэр", points: 20 },
      { text: "Тэмээ", points: 30 },
    ],
  },
  {
    prompt: "Нарны аймгийн нэг гарагийг нэрлээрэй.",
    answers: [
      { text: "Дэлхий", points: 10 },
      { text: "Ангараг", points: 10 },
      { text: "Санчир", points: 20 },
      { text: "Бархасбадь", points: 20 },
      { text: "Сугар", points: 20 },
      { text: "Буд", points: 30 },
      { text: "Тэнгэрийн ван", points: 30 },
      { text: "Далайн ван", points: 30 },
    ],
  },
  {
    prompt: "Хүний таван мэдрэхүйн нэгийг үйл үгээр нэрлээрэй.",
    answers: [
      { text: "Харах", points: 10 },
      { text: "Сонсох", points: 10 },
      { text: "Үнэрлэх", points: 20 },
      { text: "Амтлах", points: 20 },
      { text: "Хүрэлцэх", points: 30 },
    ],
  },
];
