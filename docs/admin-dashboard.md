# КодЛаб · Багшийн орчин

Production: https://kodlab-two.vercel.app/admin

## Хичээлийн хяналт

- **Хичээлийн хяналт** хэсгээс анги, хичээл, өдрөө сонгоно. Улаанбаатарын цагаар нэг өдөрт тухайн хичээлд ID болон хичээлийн кодоор нэвтэрч, ажлын өөрчлөлтөө серверт хадгалбал **Оролцсон** гэж харагдана. Зөвхөн нэвтэрсэн, зөвхөн ажил хадгалсан болон бүртгэлгүй сурагчдыг тусад нь харуулна. Хуудас солих, өөрчлөлтгүй эх загвар хадгалах нь ажлын өөрчлөлтөд орохгүй.
- Өдөр тутмын бүртгэл энэ боломжийг ашиглаж эхэлснээс хойш үүснэ. Өмнөх хадгалсан ажил одоогийн ахицад орно. Бүртгэлгүй өдөр нь цахим оролцооны баримт байхгүйг илэрхийлнэ. Сонгосон өдрийн оролцооны тайланг CSV-ээр татаж болно. Анги солиход өмнөх өдрийн бүртгэл тухайн үеийн ангид үлдэнэ. Шинэчлэлээс өмнөх бүртгэлд тухайн үед хадгалсан ангийн мэдээлэл дутуу байж болно.
- **Ангийн ахицын зорилт** хэсэгт одоогоор хэдэн дасгалыг бие дааж бодсон байхыг заана. **Дэмжлэг шаардлагатай** шүүлт зорилтод хүрээгүй сурагчдыг харуулна. Зорилтоо арилгахдаа 0 хадгална. Зорилт нь багш, анги, хичээл бүрээр хадгалагдана.
- **Дэмжлэг** хэсэгт өгсөн арга хэмжээ, хувийн тэмдэглэл, сурагчид хүргэх нэмэлт зааврыг бичнэ. Сурагч зааврыг тухайн хичээл доторх **Багшийн заавар** хэсгээс уншина. Хувийн тэмдэглэл сурагчид харагдахгүй.
- Дэмжлэгийн түүхэнд тухайн үед бие даан бодсон дасгалын тоо хадгалагдана. Ахицын түүхэнд сүүлийн 30 ажилласан өдрийн гүйцэтгэл харагдана. **Хадгалсан ажил** хэсгээс код, дасгал, сорилын үр дүнг шалгаж болно. Эдгээр нь ажиглалтын маягтын A2–A4, 8–10-р асуултад ашиглах баримт болно.

## Сургуулийн бүртгэл

- **Сургуулийн бүртгэл** хэсгийг серверийн `ADMIN_SCHOOL_ROSTER_USERS` тохиргоонд нэрлэсэн ажилтны бүртгэлээр нээнэ. Олон нэвтрэх нэрийг таслалаар тусгаарлана. Энд сургуулийн хэмжээнд КодЛабт идэвхтэй бүртгэлтэй сурагчдын анги, хувийн багшийн хуваарилалт, хичээлийн ахицыг уншина.
- Анги сонгоход тухайн ангийн бүх бүртгэлтэй сурагч, ангийн багш нар харагдана. **Анги оноогоогүй** болон **Идэвхтэй багш оноогоогүй** шүүлтээр бүртгэлийн дутуу хуваарилалтыг шалгана. Дундаж ахиц сонгосон хичээлийн бүх дасгал болон шүүлтэд багтсан бүх сурагчийг тооцно.
- Сурагч хичээл доторх **Ахиц хадгалах** товчийг дарж шинэ өөрчлөлтийг серверт шууд хадгалуулна. **Серверт хадгалагдсан** төлөв нь хамгийн сүүлийн хадгалалтыг сервер баталгаажуулсныг харуулна.

Багш нар хэсэгт нэр, сургуулийн имэйл, заадаг ангиуд болон тухайн багшийн сурагчдын тоо харагдана. Багш бүр зөвхөн JSON жагсаалтад өөрт нь хуваарилсан сурагч, анги, өөрийн багшийн мэдээллийг харна. Ижил 7А ангид заадаг ч бусад багшийн сурагчид харагдахгүй. Сервер жагсаалт, дэлгэрэнгүй, өөрчлөлт бүр дээр эрхийг шалгана.

- Багш бүр өөрийн нэвтрэх нэр эсвэл сургуулийн имэйл, нууц үгээр нэвтэрнэ. Нэвтрэлт 8 цаг хүчинтэй; «Гарах» товч тухайн нэвтрэлтийг хүчингүй болгоно.
- Сурагч ижил ID-гаар Python, JavaScript, Next.js хичээлд ажиллахад нэг сурагчийн гурван ахиц болж харагдана. ID нь сурагчийг таних түлхүүр; өөр ID-уудыг автоматаар нэгтгэхгүй.
- Идэвхтэй сурагч өөрийн ID болон багшийн олгосон хичээлийн кодоор нэвтэрч, ажлаа уншиж хадгална. Кодыг сурагчийн дэлгэрэнгүй дэх **Хичээлийн шинэ код гаргах** товчоор гаргаж, тухайн сурагчид хувиараа өгнө. Шинэ код гаргахад өмнөх код болон нэвтрэлт хүчингүй болно.
- Идэвхтэй багш HTML & CSS, Python, JavaScript, Next.js хичээлд бүртгэл дэх овог, нэрээ эсвэл `orgilsaikhan.ch` зэрэг нэвтрэх нэрээ хувийн нууц үгийн хамт бичиж орно. Том, жижиг үсэг ялгахгүй. Нэр давхцвал нэвтрэх нэрээ ашиглана. Аль алинаар нь ороход өмнөх дадлагын ахиц хэвээр байна. Хичээлийн нэвтрэлт болон багшийн орчны нэвтрэлт тусдаа. `/admin` хэсэг нууц үгээ шаардана. Шалгалт зөвхөн бүртгэлтэй сурагчдад нээлттэй хэвээр.
- Нэг сурагч нэг ангид харьяалагдана. Өөрийн нэмэлт анги үүсгэх, нэр солих, сурагчдыг олноор нь хуваарилах эсвэл ангийг нь солих боломжтой.
- Сурагчийн дэлгэрэнгүйд нэр, анги, багшийн тэмдэглэлээ хадгална. Тэмдэглэл сурагчдад харагдахгүй. Сурагчийн код, ахицад өөрчлөлт хийхгүй.
- Дасгалын дууссан/жишээ үзсэн/эхэлсэн төлөв, хадгалсан код, Next.js хариултууд, Python ба JavaScript сорилын үр дүн, чөлөөт кодыг харж болно.
- Ахиц нь сурагчийн хадгалсан шалгалтын үр дүн; дахин үнэлсэн эсвэл багшаар баталгаажсан дүн биш. «Сүүлд хадгалсан» нь ажилд гарсан хамгийн сүүлийн хадгалсан өөрчлөлтийн цаг. Хичээл солих болон нэвтрэх үйлдэл энэ цагийг шинэчлэхгүй.
- Жагсаалт харагдаж байх үед минут тутам шинэчлэгдэнэ. CSV нь тухайн хайлт, шүүлтэд таарсан сурагчдыг экспортолно.

## LMS import and accounts

Run `npx tsx scripts/import-lms-roster.ts /absolute/path/roster.json` for a database-backed preview. After reviewing the matching name, class, and LMS record, add `--apply` and one `--link-manual=<student ID>` for each confirmed manual enrollment. The importer validates the entire source first, backs up existing groups/profiles/accounts to an owner-readable ignored `work/` file, merges by stable source IDs/student codes, and preserves exercise progress and teacher notes. Reruns preserve passwords that teachers have chosen. No source JSON or student roster is copied into deployable assets.

Only student codes, display names, class membership, teacher relationships and source IDs are retained for students. Classes retain name, grade and teacher relationships. Teachers retain username, name and school email. Gender, student email, course content, departments, and extra status/enrollment fields are omitted.

Accounts with `setupRequired: true` must use their private setup code and choose a password with at least 12 characters before receiving an admin session. After setup, the code expires and the new password is required.

The importer also generates an individual one-time setup code for each new teacher and for each existing account whose stored password still equals its email. It writes codes to an owner-readable file in the ignored `work/` directory before updating the corresponding accounts. The import prints the file path. These codes remain usable for setup. Re-importing preserves passwords that teachers have already chosen. On rollout, re-run the importer with the current roster to provision legacy accounts. Earlier admin sessions require a fresh login.

`ADMIN_RATE_LIMIT_KEY` is an independent private environment variable used to hash network addresses in login throttling. Configure it on Vercel from ignored `work/admin-rate-limit-key.txt`. Do not use a NEXT_PUBLIC variable. There is no public account-creation endpoint.

Run `npx tsx scripts/backfill-admin-summaries.ts` for old progress records. It preserves drafts and completion data; future saves update summaries automatically.

## Storage and access

`student_progress` retains learner work and a small server-generated `adminSummary`. `student_profiles` stores names, class IDs, and teacher notes; `student_groups` stores classes. Each admin account has its own password hash. Sessions use cryptographically random opaque cookies; only SHA-256 token digests are stored in `admin_sessions`. Session expiry is enforced on every request. MongoDB TTL indexes clean expired session/rate-limit records. Login is limited to 10 attempts per 15-minute window per network address, stored as a keyed digest, including across Vercel instances.

Admin APIs enforce the database-backed session independently of the page. Cookies are HttpOnly, SameSite Strict, and Secure over HTTPS. Writes validate same-origin requests and bounded JSON. Responses are private/no-store. Student APIs cannot access teacher metadata or session collections. Saved code is rendered as text, never executed in the admin dashboard. CSV cells are escaped against spreadsheet formulas.

The roster currently caps each source collection at 10,001 rows and classes at 500, and shows a warning when the roster limit is reached. Details load one selected exercise at a time. Each student row has a confirmed delete action that archives the profile, hides it and blocks student access while preserving saved work. The notice offers Undo; restore is restricted to the teacher who deleted the profile. Imported class names are maintained through the source import. Unlisted legacy records are reconciled separately with private backups before removal; ambiguous IDs must never be guessed.

## Teacher workspace redesign (2026-10-20)

The roster opens with recently saved work first. Search, class selection, course selection and progress-state tabs use one shared view calculation; choosing a course keeps students with no saved work visible. Counts and CSV exports use the same selected scope. A full roster is paged in groups of 25; per-class totals stay visible.

The sidebar folds into a class menu on phones, and table rows become student cards with all three course summaries. Profile editing is collapsed on smaller screens so the saved work is reached first. Delete uses the dashboard's own named confirmation dialog and provides a Restore action; it does not use a browser confirmation popup.

The existing Vercel project, production domain and server-only environment settings now belong to **orgils-projects-610af89c**. Run `npm run verify:release` with MongoDB installed before deploying. Deploy with `vercel deploy --prod --yes --scope orgils-projects-610af89c` after checking `vercel whoami --format json`. The live hostname stays https://kodlab-two.vercel.app.

## Teacher-managed student enrollment

Teachers can use **Сурагч нэмэх** on `/admin` to enter a student ID, name, and class. The class selector contains only the signed-in teacher's classes and defaults to the current class. After creation, the dashboard shows the new student and a success message.

`POST /api/admin` action `create-student` requires an authenticated teacher and a same-origin request. The server normalizes IDs to uppercase and validates the school format (two digits, Latin S, four digits, such as `20S0452`), a nonempty name up to 80 characters, and ownership of the selected class. New profiles have `sourceId: manual:<ID>`, `manualEnrollment: true`, and only the signed-in teacher in `teacherIds`; caller-supplied teacher IDs are ignored.

Creation does not overwrite or restore existing profiles, progress, or exam attempts. An exact retry for the same teacher's active manual enrollment succeeds without modifying the record. Other duplicate IDs return a conflict. Enrolling a student already assigned to another teacher requires school administrator review.

Verified on 22 October 2026: 165 tests passed without skips, lint and production build passed, and a temporary student was created through the live form. Production checks confirmed class scope, teacher visibility, duplicate handling and lesson access. The test profile was removed afterward.
