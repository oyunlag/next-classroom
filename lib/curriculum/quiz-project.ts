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

type QuizLesson = {
  topics: string;
  starter: string;
  variables: { name: string; type: string; description: string }[];
  steps: { title: string; detail: string }[];
  example: { title: string; code: string };
  hint: string;
  review: { href: string; label: string };
};

export const quizLessons = {
  6: {
    topics: "Хувьсагч ба `if / else`",
    starter: `let points = 0;

// Тоглоом guess, common, uncommon, rare утгыг өгнө.
// if, else if, else ашиглан points-ийн утгыг өөрчлөөрэй.
`,
    variables: [
      {
        name: "guess",
        type: "string",
        description:
          "Тоглогчийн бичсэн хариулт. Тоглоом том үсгийг жижиг болгож, захын зайг арилгаад өгнө.",
      },
      {
        name: "common",
        type: "string",
        description: "Түгээмэл зөв хариулт. Таарвал 10 оноо.",
      },
      {
        name: "uncommon",
        type: "string",
        description: "Ховордуу зөв хариулт. Таарвал 20 оноо.",
      },
      {
        name: "rare",
        type: "string",
        description: "Ховор зөв хариулт. Таарвал 30 оноо.",
      },
      {
        name: "points",
        type: "number",
        description:
          "Таны бодох нэг хариултын оноо. Тоглоом энэ утгыг нийт оноонд нэмнэ.",
      },
    ],
    steps: [
      {
        title: "Оноог 0-ээс эхлүүл",
        detail:
          "Эхний мөрийн `let points = 0` нь хариулт бүрийн оноог 0-ээс эхлүүлнэ.",
      },
      {
        title: "Түгээмэл хариултыг шалга",
        detail:
          "`if` дотор `guess === common` гэж хоёр текстийг харьцуул. Үнэн бол `points = 10` гэж 10 оноо өг.",
      },
      {
        title: "Ховордуу, ховор хариултыг шалга",
        detail:
          "Эхний нөхцөл худал бол `else if`-ээр `uncommon` болон `rare`-ыг дарааллаар нь шалгаж 20 эсвэл 30 оноо өг.",
      },
      {
        title: "Буруу хариултыг тооц",
        detail:
          "Гурвуулаа таарахгүй бол `else` ажиллана. Энэ үед `points` 0 байна.",
      },
    ],
    example: {
      title: "Эхний нөхцөлийн жишээ",
      code: "if (guess === common) {\n  points = 10;\n}",
    },
    hint: "`===` хоёр утга тэнцүү эсэхийг шалгана. `=` хувьсагчид утга онооно. Дараагийн нөхцөлөө эхний хаалтын араас `else if` гэж үргэлжлүүлээрэй.",
    review: {
      href: "/kodlab/index.html#/exercises/adventure",
      label: "Нөхцөл шалгах дасгал",
    },
  },
  7: {
    topics: "Давталт ба объект",
    starter: `let points = 0;

// Тоглоом guess болон answers массивыг өгнө.
// for давталтаар таарсан элементийг олж points утгыг ав.
`,
    variables: [
      {
        name: "guess",
        type: "string",
        description:
          "Тоглогчийн хариулт. Тоглоом захын зайг арилгаж, жижиг үсгээр өгнө.",
      },
      {
        name: "answers",
        type: "array",
        description:
          "Зөв хариултуудын массив. Объект бүр `text` болон `points` талбартай. `text` нь жижиг үсгээр ирнэ.",
      },
      {
        name: "i",
        type: "number",
        description:
          "Таны давталтын тоолуур. `answers[0]` эхний хариултыг, `answers[i]` тухайн ээлжийн хариултыг заана.",
      },
      {
        name: "points",
        type: "number",
        description:
          "Таны бодох оноо. Таарсан объектын `points` утгыг энд хадгална.",
      },
    ],
    steps: [
      {
        title: "Бүх элементийг гүйлгэ",
        detail:
          "`for` давталтын `i`-г 0-ээс эхлүүл. `i < answers.length` нөхцөл үнэн үед тухайн элементийг шалгаад `i++`-ээр дараагийнх руу шилж.",
      },
      {
        title: "Текстийг харьцуул",
        detail:
          "Давталт дотор `if` ашигла. `answers[i].text === guess` үнэн бол тоглогчийн хариулт зөв байна.",
      },
      {
        title: "Объектоос оноог ав",
        detail:
          "Таарсан үед `points = answers[i].points` гэж оноог ав. Асуулт бүрийн хариултын дараалал өөр байж болно. Объект бүр өөрийн оноотой.",
      },
      {
        title: "Таарахгүй тохиолдлыг турш",
        detail:
          "Ямар ч элемент таарахгүй бол `let points = 0`-ийн анхны утга хэвээр үлдэнэ. Эхний, сүүлийн болон буруу хариултаар турш.",
      },
    ],
    example: {
      title: "Нэг элементийн бүтэц",
      code: '{ text: "тэмээ", points: 30 }',
    },
    hint: "`answers.length` нь элементийн тоо. Хэрэв урт 5 бол хамгийн сүүлийн индекс 4 байна. Давталтаа `i < answers.length` нөхцөлөөр хязгаарлаарай.",
    review: { href: "/curriculum/7/for-loops", label: "for давталтын хичээл" },
  },
  8: {
    topics: "Функц, массив ба оролт",
    starter: `function scoreAnswer(guess, answers) {
  // guess болон answers доторх text-ийг ижил хэлбэрт оруул.
  // Таарсан элементийн points утгыг return ашиглан буцаа.
  return 0;
}
`,
    variables: [
      {
        name: "guess",
        type: "string",
        description:
          "Тоглогчийн бичсэн эх текст. Том үсэг, эхлэл болон төгсгөлийн зайтай байж болно.",
      },
      {
        name: "answers",
        type: "array",
        description:
          "Зөв хариултын объектууд. Объект бүр эх `text` болон тоон `points` утгатай.",
      },
      {
        name: "cleanGuess",
        type: "string",
        description:
          "Оролтыг цэвэрлээд хадгалах хувьсагчийн жишээ. Зөв хариултын текстэд мөн ижил үйлдэл хийнэ.",
      },
      {
        name: "scoreAnswer",
        type: "function",
        description:
          "Таны гүйцээх функц. `return`-ээр буцаасан тоог тоглоом нийт оноонд нэмнэ.",
      },
    ],
    steps: [
      {
        title: "Функцийн нэр, параметрийг ашигла",
        detail:
          "Тоглоом ээлж бүрд `scoreAnswer(guess, answers)` гэж таны функцийг дуудна. Функц дотор параметрүүдийг ашиглан нэг оноо бод.",
      },
      {
        title: "Хоёр текстийг ижил хэлбэрт оруул",
        detail:
          "`trim()` захын зайг арилгаж, `toLowerCase()` жижиг үсэгт шилжүүлнэ. `guess` болон шалгаж буй объектын `text` дээр хоёуланд нь хэрэглэ.",
      },
      {
        title: "Таарсан оноог буцаа",
        detail:
          "`for` ашиглан массиваар яв. Цэвэрлэсэн хоёр текст `===` бол тухайн объектын `points`-ийг `return`-ээр буцаа.",
      },
      {
        title: "Олдохгүй үед 0 буцаа",
        detail:
          "Давталт дууссаны дараа `return 0` ажиллана. Хоосон массив, хоосон хариулт, том үсэг ба зайтай хариултаар шалга.",
      },
    ],
    example: {
      title: "Тоглогчийн оролтыг цэвэрлэх",
      code: "const cleanGuess = guess.trim().toLowerCase();",
    },
    hint: "`return` ажиллахад функц шууд дуусна. Эхний элемент таарахгүй үед 0 буцаавал дараагийн элементүүдийг шалгахгүй. `return 0`-ийг давталтын дараа бичээрэй.",
    review: {
      href: "/curriculum/8/game-testing",
      label: "Массивтай тоглоомын хичээл",
    },
  },
} satisfies Record<QuizGrade, QuizLesson>;

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
