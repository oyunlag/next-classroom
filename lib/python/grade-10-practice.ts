import type { CourseModule, PythonExercise, Requirement } from "./types";

const basics = 0;
const branches = 1;
const loops = 2;
const sequences = 3;
const records = 4;
const functions = 5;
const files = 6;

export const grade10Topics: CourseModule[] = [
  {
    title: "Оролт ба тооцоолол",
    description: "input, int, float",
    symbol: "in",
    color: "blue",
    explanation:
      "input() мөр уншина. int() бүхэл, float() бутархай тоо болгоно. // нь бүхэл хуваалт, % нь үлдэгдэл олно.",
    example: "n = int(input())\nprint(n // 12, n % 12)",
  },
  {
    title: "Нөхцөл ба логик",
    description: "if, elif, else, and, or",
    symbol: "if",
    color: "teal",
    explanation:
      "if, elif, else нь шалгуур бүрийг дарааллаар шалгана. and үед хоёр нөхцөл, or үед ядаж нэг нөхцөл үнэн байна.",
    example: 'if 0 <= score <= 100 and submitted:\n    print("Бүртгэв")',
  },
  {
    title: "Давталт ба хуримтлал",
    description: "for, while, break, continue",
    symbol: "for",
    color: "blue",
    explanation:
      "Нийлбэр болон тоолуурыг давталтын өмнө эхлүүл. continue нэг алхмыг алгасаж, break давталтыг зогсооно.",
    example:
      "total = 0\nfor n in values:\n    if n < 0:\n        continue\n    total += n",
  },
  {
    title: "Мөр ба жагсаалт",
    description: "Хэсэглэх, эрэмбэлэх, нэгтгэх",
    symbol: "[ ]",
    color: "amber",
    explanation:
      "Жагсаалт ба мөрийн индекс 0-ээс эхэлнэ. split() нь мөрийг задална. join() нь мөрийн жагсаалтыг нэгтгэнэ. sorted() шинэ жагсаалт буцаана.",
    example: 'words = "улаан шар ногоон".split()\nprint("-".join(words[:2]))',
  },
  {
    title: "Толь бичиг ба бүртгэл",
    description: "Түлхүүр, утга ба давтамж",
    symbol: "{ }",
    color: "violet",
    explanation:
      "Толь бичиг түлхүүр бүрд утга хадгална. get(key, default) нь түлхүүр байхгүй үед өгсөн анхны утгыг буцаана.",
    example:
      "counts = {}\nfor name in names:\n    counts[name] = counts.get(name, 0) + 1",
  },
  {
    title: "Функц, алдаа ба модуль",
    description: "def, return, try, import",
    symbol: "def",
    color: "teal",
    explanation:
      "Функц параметрээр өгөгдөл аваад return-оор үр дүн буцаана. try / except нь тодорхой алдааг барина. import нь бэлэн модуль ашиглана.",
    example: "import math\n\ndef squares(n):\n    return math.isqrt(n)",
  },
  {
    title: "Файл ба тайлан",
    description: "Унших, боловсруулах, хадгалах",
    symbol: ".txt",
    color: "amber",
    explanation:
      'with open() файлтай ажиллаж дуусахад автоматаар хаана. "r" уншина, "w" шинээр бичнэ. Кирилл бичвэрт encoding="utf-8" хэрэглээрэй.',
    example:
      'with open("report.txt", "r", encoding="utf-8") as report:\n    for line in report:\n        print(line.strip())',
  },
];

type InputCase = [inputs: string[], expected: string];
type Problem = {
  id: string;
  title: string;
  module: number;
  prompt: string;
  format: string;
  hint: string;
  starter?: string;
  solution: string;
  requirements?: Requirement[];
  cases: [InputCase, ...InputCase[]];
};

const node = (name: string, label: string): Requirement => ({
  kind: "node",
  name,
  label,
});
const call = (name: string): Requirement => ({
  kind: "call",
  name,
  label: `${name}() ашигласан`,
});

function problems(
  level: PythonExercise["level"],
  minutes: number,
  entries: Problem[],
): PythonExercise[] {
  return entries.map(
    ({
      id,
      title,
      module,
      prompt,
      format,
      hint,
      starter,
      solution,
      requirements,
      cases,
    }) => {
      const [inputs, expected] = cases[0];
      return {
        id: `g10-${id}`,
        title,
        module,
        level,
        minutes,
        steps: [prompt, format],
        starter: starter ?? "# Кодоо энд бичээрэй.\n",
        solution,
        inputs,
        exampleInput: inputs.join("\n"),
        expected,
        hints: [hint],
        requirements: requirements ?? [],
        tests: cases.map(([testInputs, result]) => ({
          label: `Оролт: ${testInputs.map((line) => line || "(хоосон)").join(" / ")}`,
          inputs: testInputs,
          expected: result,
        })),
      };
    },
  );
}

const easy = problems("Эхлэл", 5, [
  {
    id: "field-trip-distance",
    title: "Аяллын замын урт",
    module: basics,
    prompt:
      "Ангийн аяллаар алхсан замын уртыг километрээр нэг мөрөнд өгнө. Утга бутархай байж болно. Замын уртыг метрт шилжүүл.",
    format:
      "Метрийн утгыг бутархайн нэг оронтой хэвлэ. Нэгжийн тэмдэг бичихгүй.",
    hint: "Нэг километр 1000 метртэй тэнцэнэ. f-string дотор :.1f хэрэглэ.",
    solution:
      'kilometres = float(input())\nprint(f"{kilometres * 1000:.1f}")\n',
    cases: [
      [["1.75"], "1750.0"],
      [["0"], "0.0"],
      [["0.0325"], "32.5"],
    ],
  },
  {
    id: "tile-boxes",
    title: "Хэдэн хайрцаг хавтан хэрэгтэй вэ?",
    module: basics,
    prompt:
      "Хэрэгтэй хавтангийн тоо, нэг хайрцагт багтах эерэг тоо, нэг хайрцгийн нийт үнийг тус тус нэг мөрөөр ав.",
    format:
      "Хэрэгтэй бүтэн хайрцгийн тоо, нийт үнийг нэг мөрөнд зайгаар тусгаарлан хэвлэ.",
    hint: "Хавтан үлдвэл дахиад нэг хайрцаг авна. // ба % ашигла.",
    solution: `tiles = int(input())
size = int(input())
price = int(input())
boxes = tiles // size + int(tiles % size != 0)
print(boxes, boxes * price)
`,
    cases: [
      [["25", "12", "9000"], "3 27000"],
      [["24", "12", "5000"], "2 10000"],
      [["0", "6", "1000"], "0 0"],
    ],
  },
  {
    id: "parcel-band",
    title: "Илгээмжийн ангилал",
    module: branches,
    prompt:
      "Илгээмжийн эерэг жинг граммаар ав. 500 хүртэл Жижиг, 2000 хүртэл Дунд, 2000-аас их бол Том.",
    format: "Ангиллын нэрийг дангаар нь хэвлэ.",
    hint: "if-д 500 хүртэлх утгыг, elif-д 2000 хүртэлх утгыг шалга.",
    solution: `grams = int(input())
if grams <= 500:
    print("Жижиг")
elif grams <= 2000:
    print("Дунд")
else:
    print("Том")
`,
    cases: [
      [["500"], "Жижиг"],
      [["501"], "Дунд"],
      [["2000"], "Дунд"],
      [["2001"], "Том"],
    ],
  },
  {
    id: "lab-access",
    title: "Лабораторийн зөвшөөрөл",
    module: branches,
    prompt:
      "Нэгдүгээр мөрөнд анги, хоёрдугаарт карттай эсэх (1 эсвэл 0), гуравдугаарт багш дагалдсан эсэх (1 эсвэл 0) өгнө. 10 ба түүнээс дээш ангийн карттай сурагч эсвэл багш дагалдсан сурагч орж болно.",
    format: 'Эрхтэй бол "Орно", бусад үед "Хүлээнэ" гэж хэвлэ.',
    hint: "(анги >= 10 and карттай) гэсэн шалгалтыг багштай эсэхтэй or-оор холбо.",
    solution: `grade = int(input())
card = input() == "1"
teacher = input() == "1"
print("Орно" if (grade >= 10 and card) or teacher else "Хүлээнэ")
`,
    cases: [
      [["10", "1", "0"], "Орно"],
      [["9", "1", "0"], "Хүлээнэ"],
      [["8", "0", "1"], "Орно"],
      [["11", "0", "0"], "Хүлээнэ"],
    ],
  },
  {
    id: "shelf-code",
    title: "Номын тавиурын код",
    module: sequences,
    prompt:
      "Нэг мөрөнд хоёр үсэг, дараа нь гурван цифрээс бүтсэн тавиурын код ав.",
    format:
      "Эхний хоёр үсгийг томоор, дугаарыг эхний тэгүүдгүйгээр нэг мөрөнд зайтай хэвлэ.",
    hint: "code[:2].upper() ба int(code[2:])-ыг ашиглаж болно.",
    solution:
      "code = input().strip()\nprint(code[:2].upper(), int(code[2:]))\n",
    cases: [
      [["ab007"], "AB 7"],
      [["mn123"], "MN 123"],
      [["xY000"], "XY 0"],
    ],
  },
  {
    id: "team-initials",
    title: "Багийн нэрийн товчлол",
    module: sequences,
    prompt:
      "Нэг мөрөнд нэг буюу хэд хэдэн үгтэй багийн нэр ав. Үг бүрийн эхний үсгийг том болгож ав.",
    format: "Эхний үсгүүдийг цэгээр тусгаарлан хэвлэ. Төгсгөлд цэг тавихгүй.",
    hint: "split() олон зайг алгасна. Тэмдэгтүүдээ '.'.join(...) гэж нэгтгэ.",
    solution:
      'words = input().split()\nprint(".".join(word[0].upper() for word in words))\n',
    cases: [
      [["ногоон хот"], "Н.Х"],
      [["  Арван   хоёр  од "], "А.Х.О"],
      [["python"], "P"],
    ],
  },
  {
    id: "practice-laps",
    title: "Спортын өдөрлөгийн бэлтгэл",
    module: loops,
    prompt:
      "Сургуулийн спортын өдөрлөгт бэлтгэж байна. Бэлтгэл хийх өдрийн тоо n ба эхний өдөр гүйх тойргийн тоог тус тус нэг мөрөөр ав. Өдөр бүр өмнөхөөс 2 тойргоор илүү гүйнэ.",
    format:
      "for давталтаар n өдрийн тойргийн тоог тус тусад нь мөр бүрд хэвлэ.",
    hint: "range(n)-ийн эхний индекс 0 тул эхний өдрийн тойрог нэмэгдэлгүй.",
    solution: `days = int(input())
first = int(input())
for day in range(days):
    print(first + 2 * day)
`,
    requirements: [node("For", "for давталт ашигласан")],
    cases: [
      [["3", "4"], "4\n6\n8"],
      [["1", "7"], "7"],
      [["0", "10"], ""],
    ],
  },
  {
    id: "savings-goal",
    title: "Хадгаламжийн зорилго",
    module: loops,
    prompt:
      "Одоогийн хадгаламж, долоо хоног бүр нэмэх эерэг мөнгө, зорилтот дүнг тус тус нэг мөрөөр ав.",
    format:
      "while ашиглан зорилгод хүрэх хүртэл хэдэн долоо хоног шаардагдахыг хэвлэ.",
    hint: "Хадгаламж зорилгоос бага байх бүрд мөнгө ба тоолуураа нэм.",
    solution: `saved = int(input())
weekly = int(input())
goal = int(input())
weeks = 0
while saved < goal:
    saved += weekly
    weeks += 1
print(weeks)
`,
    requirements: [node("While", "while давталт ашигласан")],
    cases: [
      [["1000", "500", "2200"], "3"],
      [["2000", "300", "2000"], "0"],
      [["0", "200", "400"], "2"],
    ],
  },
  {
    id: "queue-rotation",
    title: "Дарааллын эхэнд шилжье",
    module: sequences,
    prompt:
      "Нэг мөрөнд зайгаар тусгаарласан нэг буюу түүнээс олон нэр ав. Сүүлийн нэрийг хамгийн эхэнд шилжүүл. Бусад нэрийн дараалал хэвээр байна.",
    format: "Шинэ дарааллыг нэг мөрөнд зайгаар тусгаарлан хэвлэ.",
    hint: "Сүүлийн утга names[-1], үлдсэн хэсэг names[:-1].",
    solution: "names = input().split()\nprint(names[-1], *names[:-1])\n",
    cases: [
      [["Ану Бат Сондор"], "Сондор Ану Бат"],
      [["Номин"], "Номин"],
      [["a b c d"], "d a b c"],
    ],
  },
  {
    id: "inventory-lookup",
    title: "Хэрэгслийн нөөц асууя",
    module: records,
    prompt:
      "Толь бичигт pen: 12, ruler: 5, eraser: 0 гэж хадгал. Нэг мөрөнд хэрэгслийн нэр ав. Том, жижиг үсэг болон захын зайг үл тооц.",
    format:
      'Хэрэгслийн тоог хэвлэ. Түлхүүр байхгүй бол "Бүртгэлгүй" гэж хэвлэ.',
    hint: 'Нэрийг strip().lower()-оор цэвэрлээд get(name, "Бүртгэлгүй") ашигла.',
    solution:
      'stock = {"pen": 12, "ruler": 5, "eraser": 0}\nprint(stock.get(input().strip().lower(), "Бүртгэлгүй"))\n',
    cases: [
      [["  RULER "], "5"],
      [["eraser"], "0"],
      [["paper"], "Бүртгэлгүй"],
    ],
  },
]);

const practice = problems("Дадлага", 8, [
  {
    id: "meter-readings",
    title: "Мэдрэгчийн уншилтууд",
    module: loops,
    prompt:
      "Нэг мөрөнд зайгаар тусгаарласан бүхэл уншилтууд өгнө. Сөрөг уншилтыг continue-ээр алгас. 0 таармагц break-ээр зогсоо.",
    format:
      "Зогсохоос өмнөх эерэг уншилтын тоо, нийлбэрийг зайгаар тусгаарлан хэвлэ.",
    hint: "Тоолуур ба нийлбэрийг зөвхөн хоёр шалгалтыг давсан уншилтаар нэм.",
    solution: `count = total = 0
for value in map(int, input().split()):
    if value == 0:
        break
    if value < 0:
        continue
    count += 1
    total += value
print(count, total)
`,
    requirements: [
      node("Break", "break ашигласан"),
      node("Continue", "continue ашигласан"),
    ],
    cases: [
      [["4 -1 6 0 10"], "2 10"],
      [["0 4"], "0 0"],
      [["-2 5 5"], "2 10"],
    ],
  },
  {
    id: "score-spread",
    title: "Онооны тархалт",
    module: sequences,
    prompt:
      "Зайгаар тусгаарласан дор хаяж нэг бүхэл оноо ав. Их ба бага онооны зөрүү, дунджаас өндөр онооны тоог ол.",
    format:
      "Зөрүү ба тоог нэг мөрөнд зайгаар тусгаарлан хэвлэ. Дундажтай тэнцүү оноог тооцохгүй.",
    hint: "Дундаж нь sum(scores) / len(scores). Оноо бүрийг түүнтэй харьцуул.",
    solution:
      "scores = list(map(int, input().split()))\naverage = sum(scores) / len(scores)\nprint(max(scores) - min(scores), sum(score > average for score in scores))\n",
    cases: [
      [["60 80 80 100"], "40 1"],
      [["7"], "0 0"],
      [["4 5 5"], "1 2"],
    ],
  },
  {
    id: "volunteer-list",
    title: "Давхардалгүй сайн дурынхан",
    module: sequences,
    prompt:
      "Зайгаар тусгаарласан нэрсийг жижиг үсэгт хөрвүүл. Давхардсан нэр бүрийг анх таарсан газарт нь ганц удаа үлдээ.",
    format:
      "Нэрсийг анхны дарааллаар нь таслал, зайгаар (', ') тусгаарлан хэвлэ.",
    hint: "Шинэ жагсаалт үүсгээд нэр хараахан байхгүй үед append() ашигла.",
    solution: `unique = []
for name in input().lower().split():
    if name not in unique:
        unique.append(name)
print(", ".join(unique))
`,
    cases: [
      [["Ану бат АНУ Болд бат"], "ану, бат, болд"],
      [["Z a b A z"], "z, a, b"],
      [[""], ""],
    ],
  },
  {
    id: "split-bill",
    title: "Зардлыг хуваах",
    module: basics,
    prompt:
      "Эхний мөрөнд зайгаар тусгаарласан бүхэл зардлууд, дараагийн мөрөнд эерэг хүний тоо өгнө.",
    format:
      "Хүн бүрийн төлөх бүхэл дүн ба үлдэх мөнгийг зайгаар тусгаарла. Нийт төлбөрөөс илүү мөнгө цуглуулахгүй.",
    hint: "Зардлуудаа нийлүүлээд divmod(total, people)-аар бүхэл хуваалт ба үлдэгдлийг зэрэг ол.",
    solution:
      "total = sum(map(int, input().split()))\npeople = int(input())\nprint(*divmod(total, people))\n",
    cases: [
      [["1200 2300 1505", "4"], "1251 1"],
      [["100 200", "3"], "100 0"],
      [["99", "100"], "0 99"],
    ],
  },
  {
    id: "letter-count",
    title: "Үсгийн давтамж",
    module: records,
    prompt:
      "Нэг мөрөнд бичвэр ав. Том, жижиг үсгийг ялгахгүй. Зөвхөн isalpha() үнэн болсон тэмдэгтүүдийг тоол.",
    format:
      "Үсгүүдийг өсөх дарааллаар, үсэг ба тоог зайгаар тусгаарлан тус тус мөрөнд хэвлэ.",
    hint: "counts.get(letter, 0) + 1 гэж шинэчил. sorted(counts) түлхүүрүүдийг эрэмбэлнэ.",
    solution: `counts = {}
for letter in input().lower():
    if letter.isalpha():
        counts[letter] = counts.get(letter, 0) + 1
for letter in sorted(counts):
    print(letter, counts[letter])
`,
    cases: [
      [["БаА! б2"], "а 2\nб 2"],
      [["Zaza 13"], "a 2\nz 2"],
      [["123!"], ""],
    ],
  },
  {
    id: "delivery-fees",
    title: "Хот доторх хүргэлтийн төлбөр",
    module: functions,
    prompt:
      "Улаанбаатар дотор хүргэх захиалга бүрийн зайг бүхэл километрээр нэг мөрөнд зайгаар тусгаарлан өгнө. fee(km) функц бич. Дасгалын тарифаар 0–3 км 2000₮, түүнээс цааш нэмэлт км тутам 500₮.",
    format:
      "Зай бүрийн төлбөрийг оролтын дарааллаар нэг мөрөнд зайтай хэвлэ. fee нь тоон утга буцаана.",
    hint: "2000 + max(0, km - 3) * 500 нь функцийн буцаах утга.",
    solution: `def fee(km):
    return 2000 + max(0, km - 3) * 500

print(*(fee(km) for km in map(int, input().split())))
`,
    requirements: [
      node("FunctionDef", "Функц тодорхойлсон"),
      node("Return", "Утга буцаасан"),
      call("fee"),
    ],
    cases: [
      [["1 3 4 8"], "2000 2000 2500 4500"],
      [["0"], "2000"],
      [["10 2"], "5500 2000"],
    ],
  },
  {
    id: "caption-meter",
    title: "Хоёр тайлбарын үгийн тоо",
    module: functions,
    prompt:
      "Нэг тайлбар бүрийг нэг мөрөөр авна. count_words(text) функц тусгаарлагдсан үгсийг тоолж буцаана. Функцээ хоёр тайлбар дээр тус тус дууд.",
    format:
      "Эхний тайлбарын үгийн тоо, хоёр дахь тайлбарын тоог нэг мөрөнд зайгаар тусгаарла.",
    hint: "Функцийн тоолуур дуудлага бүрд шинээр эхлэх ёстой. len(text.split())-аар шууд тоолж болно.",
    solution: `def count_words(text):
    return len(text.split())

first = input()
second = input()
print(count_words(first), count_words(second))
`,
    requirements: [
      node("FunctionDef", "Функц тодорхойлсон"),
      call("count_words"),
    ],
    cases: [
      [["Сайн уу", "Нэг  хоёр гурван үг"], "2 4"],
      [["", "Сайн"], "0 1"],
      [["a b c", "d e"], "3 2"],
    ],
  },
  {
    id: "safe-division",
    title: "Алдаатай оролтыг зохицуулах",
    module: functions,
    prompt:
      "Хуваагдагч болон хуваагчийг тус тус мөрөөр ав. try / except ашиглан бүтэлгүй хөрвүүлэлт ба тэгээр хуваахыг ялга.",
    format:
      'Зөв бол хариуг 2 бутархай оронтой хэвлэ. Буруу тоонд "Тоон утга биш", тэгээр хуваахад "Тэгээр хуваахгүй" гэж хэвлэ.',
    hint: "float() буруу утгад ValueError, хуваагч 0 үед ZeroDivisionError гаргана.",
    solution: `try:
    amount = float(input())
    divisor = float(input())
    print(f"{amount / divisor:.2f}")
except ValueError:
    print("Тоон утга биш")
except ZeroDivisionError:
    print("Тэгээр хуваахгүй")
`,
    requirements: [node("Try", "try / except ашигласан")],
    cases: [
      [["9", "4"], "2.25"],
      [["7", "0"], "Тэгээр хуваахгүй"],
      [["5", "x"], "Тоон утга биш"],
      [["-1", "8"], "-0.12"],
    ],
  },
  {
    id: "square-mosaic",
    title: "Хамгийн том дөрвөлжин мозайк",
    module: functions,
    prompt:
      "Мозайкны хавтангийн тоо n ≥ 0 өгнө. Болох хамгийн том бүтэн дөрвөлжингийн талын урт ба үлдсэн хавтангийн тоог ол. math модулийг ашигла.",
    format: "Талын урт болон үлдэгдлийг нэг мөрөнд зайгаар тусгаарлан хэвлэ.",
    hint: "math.isqrt(n) нь язгуурын бүхэл хэсгийг олно. Дөрвөлжин тал × тал хавтан хэрэглэнэ.",
    solution: `from math import isqrt

n = int(input())
side = isqrt(n)
print(side, n - side ** 2)
`,
    cases: [
      [["30"], "5 5"],
      [["49"], "7 0"],
      [["0"], "0 0"],
    ],
  },
  {
    id: "read-donations",
    title: "Ангийн номын сангийн хандив",
    module: files,
    prompt:
      "Ангийн номын санд цугларсан хандивын дүнг төгрөгөөр өгнө. Эхлэх код | тэмдэгтээр тусгаарласан дүнг donations.txt файлд тус тусын мөр болгон бичнэ. Файлаа уншиж, хоосон мөрийг алгасаад дүнгүүдийг нэгтгэ.",
    format: "Хандивын тоо ба нийт дүнг нэг мөрөнд зайгаар тусгаарлан хэвлэ.",
    hint: 'Файлыг "r" горимоор нээ. line.strip() хоосон биш бол int(line) болгон нэм.',
    starter:
      'with open("donations.txt", "w", encoding="utf-8") as file:\n    file.write(input().replace("|", "\\n"))\n\n',
    solution: `with open("donations.txt", "w", encoding="utf-8") as file:
    file.write(input().replace("|", "\\n"))

count = total = 0
with open("donations.txt", "r", encoding="utf-8") as file:
    for line in file:
        if line.strip():
            count += 1
            total += int(line)
print(count, total)
`,
    requirements: [call("open"), node("With", "with ашиглан файл нээсэн")],
    cases: [
      [["500|1000||250"], "3 1750"],
      [["|"], "0 0"],
      [[" 30 |20|0| "], "3 50"],
    ],
  },
]);

const challenge = problems("Сорилт", 13, [
  {
    id: "reserved-seats",
    title: "Суудлын зураглал",
    module: loops,
    prompt:
      "Эхний хоёр мөрөнд эерэг мөр, баганын тоо өгнө. Гурав дахь мөрөнд захиалсан суудлын дугаарууд зайгаар тусгаарлагдана. Захиалга байхгүй бол гурав дахь мөр хоосон байна.",
    format:
      'Суудлыг зүүнээс баруун, дээрээс доош 1-ээс дугаарла. Давхар for ашиглан захиалсан суудлыг "X", сул суудлыг "." гэж мөр бүрд нэг зайтай хэвлэ.',
    hint: "0-ээс эхэлсэн мөр, баганын индексээр суудлын дугаар нь row * columns + column + 1.",
    solution: `rows = int(input())
columns = int(input())
reserved = set(map(int, input().split()))
for row in range(rows):
    cells = []
    for column in range(columns):
        number = row * columns + column + 1
        cells.append("X" if number in reserved else ".")
    print(" ".join(cells))
`,
    requirements: [
      { kind: "nested", name: "For", label: "Давхар for ашигласан" },
    ],
    cases: [
      [["2", "3", "2 6"], ". X .\n. . X"],
      [["3", "1", "2"], ".\nX\n."],
      [["1", "3", ""], ". . ."],
    ],
  },
  {
    id: "warm-streak",
    title: "Дараалсан дулаан өдрүүд",
    module: loops,
    prompt:
      "Аймгийн цаг агаарын тэмдэглэлийг ашиглая. Эхний мөрөнд дулаан гэж үзэх доод хэм, хоёр дахь мөрөнд зайгаар тусгаарласан өдрийн хэмүүдийг °C-ээр өгнө. Доод хэмтэй тэнцүү өдөр дулаанд тооцогдоно.",
    format:
      "Хамгийн урт дараалсан дулаан өдрийн тоог хэвлэ. Дулаан өдөр байхгүй бол 0.",
    hint: "Одоогийн дараалал болон хамгийн урт дарааллыг тусад нь хадгал. Сэрүүн өдөр одоогийн тоолуурыг 0 болго.",
    solution: `threshold = int(input())
current = longest = 0
for temperature in map(int, input().split()):
    current = current + 1 if temperature >= threshold else 0
    longest = max(longest, current)
print(longest)
`,
    cases: [
      [["15", "15 18 13 15 16 17"], "3"],
      [["20", "19 18 16"], "0"],
      [["0", "1 2 -1 0"], "2"],
      [["12", ""], "0"],
    ],
  },
  {
    id: "club-totals",
    title: "Клуб бүрийн оноог нэгтгэх",
    module: records,
    prompt:
      "Сургуулийн клубүүд өдөрлөгөөр авсан оноогоо нэгтгэж байна. Эхний мөрөнд бүртгэлийн тоо n. Дараагийн n мөр тус бүр клуб,оноо хэлбэртэй. Ижил клубийн оноог толь бичигт нэмж нэгтгэ.",
    format:
      "Клуб бүрийг нийт оноогоор буурах дарааллаар, оноо тэнцвэл клубийн нэрээр өсөх дарааллаар хэвлэ. Мөр бүр нэр ба дүнг зайгаар тусгаарлана.",
    hint: "sorted(totals, key=lambda name: (-totals[name], name)) хоёр эрэмбийг нэг дор барина.",
    solution: `totals = {}
for _ in range(int(input())):
    name, points = input().split(",")
    totals[name] = totals.get(name, 0) + int(points)
for name in sorted(totals, key=lambda name: (-totals[name], name)):
    print(name, totals[name])
`,
    cases: [
      [
        ["4", "Робот,3", "Шатар,5", "Зураг,5", "Робот,4"],
        "Робот 7\nЗураг 5\nШатар 5",
      ],
      [["2", "Ном,0", "Ном,2"], "Ном 2"],
      [["0"], ""],
    ],
  },
  {
    id: "compress-runs",
    title: "Давталттай бичвэрийг шахах",
    module: sequences,
    prompt:
      "Зөвхөн англи том үсгээс бүтсэн нэг мөр ав. Зэргэлдээ давтагдсан ижил үсэг бүрийг үсэг ба дараалсан тоогоор нь соль.",
    format:
      "Үр дүнг зайгүй нэг мөрөнд хэвлэ. Үсэг ганц удаа гарсан ч 1 гэж бич. Хоосон оролтод хоосон мөр гарна.",
    hint: "Үсэг солигдох бүрд өмнөх үсэг ба тоог хадгал. Давталтын төгсгөлд сүүлийн бүлгээ нэмэхээ сана.",
    solution: `text = input()
previous = ""
count = 0
parts = []
for letter in text:
    if letter != previous and count:
        parts.append(f"{previous}{count}")
        count = 0
    previous = letter
    count += 1
if count:
    parts.append(f"{previous}{count}")
print("".join(parts))
`,
    cases: [
      [["AAABBCA"], "A3B2C1A1"],
      [["AAAAAAAAAAAA"], "A12"],
      [["ABA"], "A1B1A1"],
      [[""], ""],
    ],
  },
  {
    id: "library-desk",
    title: "Номын зээлэлтийн бүртгэл",
    module: records,
    prompt:
      'Эхний мөрөнд үйлдлийн тоо. "borrow" номыг зээлж, "return" буцаана. Дараа нь мөр бүрд үйлдэл ба номын код өгнө. A ном 2, B ном 1 ширхэгээс эхэлнэ. Танихгүй код, үлдэгдэлгүй ном зээлэх, бүх хувь байхад буцаах үйлдлийг хэрэгсэхгүй.',
    format:
      "Эцэст нь А, B номын үлдэгдэл ба хэрэгсэхгүй болгосон үйлдлийн тоог нэг мөрөнд зайгаар хэвлэ.",
    hint: "Эхний нөөц болон одоогийн нөөцийг тусдаа толь бичигт хадгал. Эхний нөөц нь буцаалтын дээд хязгаар.",
    solution: `limits = {"A": 2, "B": 1}
stock = limits.copy()
rejected = 0
for _ in range(int(input())):
    action, book = input().split()
    if book not in stock:
        rejected += 1
    elif action == "borrow" and stock[book] > 0:
        stock[book] -= 1
    elif action == "return" and stock[book] < limits[book]:
        stock[book] += 1
    else:
        rejected += 1
print(stock["A"], stock["B"], rejected)
`,
    cases: [
      [
        ["5", "borrow B", "borrow B", "return A", "return B", "borrow A"],
        "1 1 2",
      ],
      [["2", "borrow C", "borrow A"], "1 1 1"],
      [["0"], "2 1 0"],
    ],
  },
  {
    id: "leaderboard",
    title: "Эх өгөгдлөө хадгалсан эрэмбэ",
    module: functions,
    prompt:
      "Эхний мөрөнд бичлэгийн тоо n, дараагийн n мөрд нэр ба бүхэл оноо өгнө. rank(entries) функц эх жагсаалтыг өөрчлөхгүйгээр оноогоор буурах, оноо тэнцвэл нэрээр өсөх эрэмбэ буцаана.",
    format:
      "Эхний гаралтын мөрөнд эрэмбэлсэн нэрс, хоёр дахь мөрөнд оролтын анхны дарааллын нэрсийг зайгаар тусгаарла.",
    hint: "list.sort() эх жагсаалтыг өөрчилдөг. sorted() шинэ жагсаалт буцаадаг.",
    solution: `def rank(entries):
    return sorted(entries, key=lambda entry: (-entry[1], entry[0]))

entries = []
for _ in range(int(input())):
    name, score = input().split()
    entries.append((name, int(score)))
print(*(name for name, _ in rank(entries)))
print(*(name for name, _ in entries))
`,
    requirements: [node("FunctionDef", "Функц тодорхойлсон"), call("rank")],
    cases: [
      [["3", "B 20", "C 10", "A 20"], "A B C\nB C A"],
      [["2", "Bat 3", "Anu 4"], "Anu Bat\nBat Anu"],
      [["1", "Nomin 5"], "Nomin\nNomin"],
    ],
  },
  {
    id: "reduce-fractions",
    title: "Бутархайг хураах",
    module: functions,
    prompt:
      "Хүртвэр ба хуваарийг тус тус бүхэл тоогоор ав. math модулийн gcd ашиглан бутархайг хураа. Сөрөг тэмдэг байвал зөвхөн хүртвэрт үлдэнэ.",
    format:
      'Хураасан бутархайг хүртвэр/хуваарь хэлбэрээр хэвлэ. Хуваарь 0 бол "Хуваарь 0" гэж хэвлэ.',
    hint: "gcd нь ерөнхий хуваагчийг олно. Хураасны дараа хуваарь сөрөг бол хоёр тэмдгийг соль.",
    solution: `import math

numerator = int(input())
denominator = int(input())
if denominator == 0:
    print("Хуваарь 0")
else:
    divisor = math.gcd(numerator, denominator)
    numerator //= divisor
    denominator //= divisor
    if denominator < 0:
        numerator, denominator = -numerator, -denominator
    print(f"{numerator}/{denominator}")
`,
    cases: [
      [["18", "24"], "3/4"],
      [["4", "-6"], "-2/3"],
      [["0", "-9"], "0/1"],
      [["1", "0"], "Хуваарь 0"],
    ],
  },
  {
    id: "file-overdue-report",
    title: "Файлд хоцролтын тайлан бичих",
    module: files,
    prompt:
      "Эхний мөрөнд бүртгэлийн тоо. Дараагийн мөрүүдэд нэр ба хоцорсон хоног байна. Хоног нь 0-ээс их бүртгэлийг л тайлан.txt файлд оролтын дарааллаар бич.",
    format:
      'Файлд "нэр: хоног" хэлбэрээр тус бүр мөр бич. Дараа нь файлаа дахин нээгээд агуулгыг хэвлэ. Хоцорсон хүн байхгүй үед "Хоцролтгүй" гэж бичиж хэвлэ.',
    hint: 'Тайланг "w" горимоор бичээд хаасны дараа "r" горимоор унш. Кирилл бичвэрээ UTF-8-аар хадгал.',
    solution: `late = []
for _ in range(int(input())):
    name, days = input().split()
    if int(days) > 0:
        late.append(f"{name}: {int(days)}")
with open("тайлан.txt", "w", encoding="utf-8") as report:
    report.write("\\n".join(late) if late else "Хоцролтгүй")
with open("тайлан.txt", "r", encoding="utf-8") as report:
    print(report.read())
`,
    requirements: [call("open")],
    cases: [
      [["4", "Ану 2", "Бат 0", "Сондор 5", "Болд -1"], "Ану: 2\nСондор: 5"],
      [["1", "Номин 0"], "Хоцролтгүй"],
      [["1", "Бат 1"], "Бат: 1"],
    ],
  },
  {
    id: "binary-parity",
    title: "Хоёртын багцын шалгалт",
    module: sequences,
    prompt:
      "Зөвхөн 0, 1-ээс бүрдсэн, дор хаяж хоёр тэмдэгттэй багц ав. Сүүлийн бит нь шалгах бит. Нийт 1-ийн тоо тэгш үед багц зөв.",
    format:
      'Зөв бол шалгах битийн өмнөх хэсгийг аравтын тоонд хөрвүүлж хэвлэ. Буруу бол "Алдаа" гэж хэвлэ.',
    hint: "packet.count('1') % 2 нь тэгш эсэхийг шалгана. int(packet[:-1], 2) хоёртын бичвэрийг хөрвүүлнэ.",
    solution: `packet = input().strip()
if packet.count("1") % 2 == 0:
    print(int(packet[:-1], 2))
else:
    print("Алдаа")
`,
    cases: [
      [["1010"], "5"],
      [["1011"], "Алдаа"],
      [["0011"], "1"],
      [["00"], "0"],
    ],
  },
  {
    id: "weekly-score-report",
    title: "Долоо хоногийн нэгдсэн тайлан",
    module: files,
    prompt:
      "Эхлэх код | тэмдэгтээр тусгаарласан бүртгэлийг scores.txt файлд бичнэ. Мөр бүр нэр,оноо хэлбэртэй. Файлаа унш. Нэр хоосон, таслалын тоо буруу, оноо бүхэл тоо биш эсвэл 0–100-аас гадуур бол мөрийг алгас.",
    format:
      "Зөв бүртгэлийг сурагч бүрээр нэмж нэгтгэ. Нийт оноогоор буурах, тэнцвэл нэрээр өсөх дарааллаар нэр ба дүнг тус тус мөрөнд хэвлэ. parse_record(line) функц бич.",
    hint: "Функц дотор мөрийг split(',')-ээр задал. ValueError-ийг except-оор барьж, буруу мөрөнд None буцаа.",
    starter:
      'with open("scores.txt", "w", encoding="utf-8") as source:\n    source.write(input().replace("|", "\\n"))\n\n',
    solution: `def parse_record(line):
    try:
        name, value = line.strip().split(",")
        score = int(value)
    except ValueError:
        return None
    if name.strip() and 0 <= score <= 100:
        return name.strip(), score
    return None

with open("scores.txt", "w", encoding="utf-8") as source:
    source.write(input().replace("|", "\\n"))

totals = {}
with open("scores.txt", "r", encoding="utf-8") as source:
    for line in source:
        record = parse_record(line)
        if record is None:
            continue
        name, score = record
        totals[name] = totals.get(name, 0) + score
for name in sorted(totals, key=lambda name: (-totals[name], name)):
    print(name, totals[name])
`,
    requirements: [
      call("open"),
      call("parse_record"),
      node("FunctionDef", "Функц тодорхойлсон"),
    ],
    cases: [
      [["Ану,50|Бат,60|Ану,25|Бат,101|Болд,үг|,10"], "Ану 75\nБат 60"],
      [["B,25|A,25| эвдэрсэн |A,0|N,10,20"], "A 25\nB 25"],
      [["B,-1|,10|"], ""],
    ],
  },
]);

export const grade10ExerciseGroups = [
  { title: "Эхлэл", color: "blue", fresh: false, items: easy },
  { title: "Дадлага", color: "teal", fresh: false, items: practice },
  { title: "Сорилт", color: "violet", fresh: false, items: challenge },
];

export const grade10Exercises = grade10ExerciseGroups.flatMap(
  ({ items }) => items,
);
