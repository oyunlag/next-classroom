"use client";

import TeacherGuidance from "@/components/student/TeacherGuidance";
import ProgressSaveButton from "@/components/student/ProgressSaveButton";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Flag,
  FlaskConical,
  GitBranch,
  Info,
  Lightbulb,
  LogOut,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  allExercises,
  exercises,
  findExercise,
  modules,
} from "@/lib/python/course";
import {
  grade10Exercises,
  grade10ExerciseGroups,
  grade10Topics,
} from "@/lib/python/grade-10-practice";
import {
  getServerState,
  getState,
  logout,
  savePythonProgress,
  subscribe,
  updateProgress,
} from "@/lib/python/state";
import type {
  CourseModule,
  PythonExercise,
  RunResult,
  StudentProgress,
} from "@/lib/python/types";
import { recoverCloudProgress } from "@/lib/python/state";
import CodeWorkspace, { downloadFile } from "./CodeWorkspace";
import Dialog from "./Dialog";
import Quiz from "./Quiz";
import Brand from "./Brand";
import StudentLogin from "./StudentLogin";
import { isFlowMode } from "@/lib/python/flow";

const FlowVisualizer = dynamic(() => import("./FlowVisualizer"));

const topicGroups = modules.map((module, index) => ({
  ...module,
  items: exercises.filter((exercise) => exercise.module === index),
}));
const mainGroups = [
  ...grade10ExerciseGroups.map((group) => ({
    ...group,
    title: `10-р анги · ${group.title}`,
  })),
  ...topicGroups,
];

type Route = {
  view: "exercises" | "tests" | "play" | "visualize";
  id?: string;
};
const serverHash = () => "";
function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
const getHash = () => window.location.hash;
function parseRoute(hash: string, grade10Practice: boolean): Route {
  if (!grade10Practice && hash === "#/tests") return { view: "tests" };
  if (hash === "#/play") return { view: "play" };
  if (!grade10Practice && hash.startsWith("#/visualize"))
    return { view: "visualize", id: hash.split("/")[2] };
  return { view: "exercises", id: hash.split("/")[2] };
}
function navigate(view: Route["view"], id?: string) {
  window.location.hash =
    view === "exercises"
      ? `/exercises/${id ?? getState().progress.active}`
      : `/${view}`;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function ExerciseLesson({
  exercise,
  topic,
  showFlow,
  progress,
  onSolution,
  onReview,
}: {
  exercise: PythonExercise;
  topic: CourseModule;
  showFlow: boolean;
  progress: StudentProgress;
  onSolution: () => void;
  onReview: () => void;
}) {
  const [hint, setHint] = useState(0);
  const [review, setReview] = useState(false);
  return (
    <section className="py-task-card" aria-label="Даалгаврын заавар">
      <h2>
        <Flag size={20} /> Даалгавар
      </h2>
      <ol>
        {exercise.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="py-example-box">
        <div>
          <span>ЖИШЭЭ {exercise.inputs ? "ОРОЛТ" : "ӨГӨГДӨЛ"}</span>
          <pre>{exercise.exampleInput}</pre>
        </div>
        <div>
          <span>ХҮЛЭЭГДЭЖ БУЙ ГАРАЛТ</span>
          <pre>{exercise.expected}</pre>
        </div>
      </div>
      <div className="py-info-note">
        <Info size={16} />
        <p>
          <strong>Олон утгаар шалгана.</strong> Хариуг шууд бичихийн оронд
          хувьсагч, нөхцөл, давталтаа ашиглаарай.
        </p>
      </div>
      <div className="py-task-actions">
        <button
          className="py-secondary"
          disabled={hint >= exercise.hints.length}
          onClick={() => setHint((value) => value + 1)}
        >
          <Lightbulb size={16} /> Санамж{" "}
          <small>
            {hint}/{exercise.hints.length}
          </small>
        </button>
        <button
          className="py-text-button"
          onClick={() => setReview(!review)}
          aria-expanded={review}
        >
          Сэдэв давтах <ArrowRight size={15} />
        </button>
      </div>
      {showFlow && exercise.module >= 2 && (
        <a
          className="py-flow-lesson-link"
          href={`#/visualize/${exercise.module < 4 ? "if" : exercise.module === 5 ? "while" : "for"}`}
        >
          <GitBranch size={15} />
          <span>Кодын урсгалыг хөдөлгөөнөөр харах</span>
          <ArrowRight size={14} />
        </a>
      )}
      {hint > 0 && (
        <div className="py-hints" aria-live="polite">
          {exercise.hints.slice(0, hint).map((text, index) => (
            <p key={text}>
              <Lightbulb size={14} />
              <span>
                <strong>{index + 1}.</strong> {text}
              </span>
            </p>
          ))}
        </div>
      )}
      {review && (
        <div className="py-inline-review">
          <h3>{topic.title}</h3>
          <p>{topic.explanation}</p>
          <pre className="py-code-example">{topic.example}</pre>
          <button className="py-text-button" onClick={onReview}>
            <BookOpen size={14} /> Бүх сэдвийн лавлах
          </button>
        </div>
      )}
      <button className="py-solution-link" onClick={onSolution}>
        Жишээ хариу харах
      </button>
      {progress.drafts[exercise.id]?.solutionViewed && (
        <p className="py-solution-note">
          Жишээ хариу үзсэн. Эхнээс нь эхлүүлээд бие даан бодвол ахицад тооцно.
        </p>
      )}
    </section>
  );
}

export default function PythonLab({
  grade10Practice = false,
}: {
  grade10Practice?: boolean;
}) {
  const gradeLabel = grade10Practice ? "10-р анги" : "9, 10-р анги";
  const backLabel = grade10Practice ? gradeLabel : "Хичээл сонгох";
  const groups = grade10Practice ? grade10ExerciseGroups : mainGroups;
  const orderedExercises = grade10Practice ? grade10Exercises : allExercises;
  const activeField = grade10Practice ? "grade10Active" : "active";
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  const hash = useSyncExternalStore(subscribeHash, getHash, serverHash);
  const [sidebar, setSidebar] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [collapsed, setCollapsed] = useState<number[]>([]);
  const [dialog, setDialog] = useState<
    "reference" | "progress" | "solution" | "reset" | "switch" | null
  >(null);
  const route = parseRoute(hash, grade10Practice);
  const { progress } = state;
  const requestedExercise =
    route.view === "exercises" && route.id ? findExercise(route.id) : undefined;
  const exercise =
    (requestedExercise && orderedExercises.includes(requestedExercise)
      ? requestedExercise
      : undefined) ??
    orderedExercises.find(({ id }) => id === progress[activeField]) ??
    orderedExercises[0];
  const isGrade10Exercise = grade10Exercises.includes(exercise);
  const topics = isGrade10Exercise ? grade10Topics : modules;
  const topic = topics[exercise.module];
  const { id: selectedId, starter } = exercise;
  const exerciseId = route.view === "exercises" ? selectedId : undefined;
  const index = orderedExercises.indexOf(exercise);
  const currentGroup = groups.findIndex(({ items }) =>
    items.includes(exercise),
  );
  const draft = progress.drafts[exercise.id] ?? {
    code: exercise.starter,
    inputs: exercise.inputs?.join("\n") ?? "",
    solutionViewed: false,
  };
  const completed = progress.completed.includes(exercise.id);
  const completedCount = orderedExercises.filter(({ id }) =>
    progress.completed.includes(id),
  ).length;
  const percent = Math.round((completedCount / orderedExercises.length) * 100);

  useEffect(() => {
    if (
      state.student &&
      exerciseId &&
      exerciseId !==
        (getState().progress[activeField] ?? orderedExercises[0].id)
    )
      updateProgress((current) => ({
        ...current,
        [activeField]: exerciseId,
        ...(!grade10Practice && isGrade10Exercise
          ? { grade10Active: exerciseId }
          : {}),
      }));
  }, [
    activeField,
    exerciseId,
    grade10Practice,
    isGrade10Exercise,
    orderedExercises,
    state.student,
  ]);

  function select(id: string) {
    const nextGroup = groups.findIndex(({ items }) =>
      items.some((item) => item.id === id),
    );
    if (nextGroup < 0) return;
    setSidebar(false);
    navigate("exercises", id);
    setCollapsed((current) => current.filter((group) => group !== nextGroup));
  }

  function saveDraft(
    code: string,
    inputs = draft.inputs,
    viewed = draft.solutionViewed,
  ) {
    updateProgress((current) => ({
      ...current,
      completed:
        viewed ||
        code !== (current.drafts[exercise.id]?.code ?? exercise.starter)
          ? current.completed.filter((id) => id !== exercise.id)
          : current.completed,
      drafts: {
        ...current.drafts,
        [exercise.id]: { code, inputs, solutionViewed: viewed },
      },
    }));
  }

  function checked(code: string, result: RunResult) {
    const current = getState();
    const currentDraft = current.progress.drafts[selectedId];
    if (
      current.student !== state.student ||
      (currentDraft?.code ?? starter) !== code ||
      currentDraft?.solutionViewed
    )
      return;
    if (
      !result.error &&
      result.checks.length > 0 &&
      result.checks.every((check) => check.passed)
    )
      updateProgress((latest) => ({
        ...latest,
        completed: [...new Set([...latest.completed, selectedId])],
      }));
  }

  if (!state.ready)
    return (
      <div className="py-app py-loading">
        <Brand />
        <p>Хичээлээ бэлдэж байна…</p>
      </div>
    );
  if (!state.student)
    return (
      <div className="py-app">
        <StudentLogin grade10Practice={grade10Practice} />
      </div>
    );

  function resetCode() {
    if (route.view === "play")
      updateProgress((current) => ({
        ...current,
        playground: {
          code: '# Өөрийн санааг Python-оор туршаарай.\nprint("Сайн уу, Python!")\n',
          inputs: "",
        },
      }));
    else saveDraft(exercise.starter, exercise.inputs?.join("\n") ?? "", false);
    setResetCount((current) => current + 1);
    setDialog(null);
  }

  return (
    <div className="py-app">
      <header className="py-header">
        <div className="py-header-brand">
          <button
            className="py-icon py-mobile-menu"
            aria-label="Хичээлийн цэс нээх"
            onClick={() => setSidebar(true)}
          >
            <Menu size={21} />
          </button>
          <a
            href={`#/exercises/${exercise.id}`}
            aria-label="КодЛаб Python нүүр"
          >
            <Brand />
          </a>
          <span className="py-grade">
            {gradeLabel} <span>·</span> Python
          </span>
        </div>
        <nav className="py-header-nav" aria-label="Үндсэн цэс">
          {(
            [
              { view: "exercises", label: "Дасгал", icon: BookOpen },
              { view: "tests", label: "Мэдлэгийн сорил", icon: ClipboardCheck },
              { view: "play", label: "Чөлөөт код", icon: FlaskConical },
              { view: "visualize", label: "Кодын урсгал", icon: GitBranch },
            ] as const
          )
            .filter(
              ({ view }) =>
                !grade10Practice || view === "exercises" || view === "play",
            )
            .map(({ view, label, icon: Icon }) => (
              <a
                key={view}
                className={route.view === view ? "active" : ""}
                href={
                  view === "exercises"
                    ? `#/exercises/${exercise.id}`
                    : `#/${view}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </a>
            ))}
        </nav>
        <div className="py-header-actions">
          <Link
            href={grade10Practice ? "/curriculum/10" : "/"}
            className="py-lesson-chooser"
            prefetch={false}
            aria-label={backLabel}
            title={backLabel}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
          <button
            className="py-student-button"
            title="Сурагч солих"
            onClick={() => setDialog("switch")}
          >
            <UserRound size={15} />
            <span>
              <small>Сурагч</small>
              <strong>{state.student}</strong>
            </span>
            <LogOut size={14} />
          </button>
          <button
            className="py-progress-button"
            onClick={() => setDialog("progress")}
          >
            <BarChart3 size={18} />
            <span>Миний ахиц</span>
            <strong>
              {completedCount}/{orderedExercises.length}
            </strong>
          </button>
        </div>
      </header>
      <div className="classroom-save-actions">
        <ProgressSaveButton onSave={savePythonProgress} />
      </div>
      <TeacherGuidance studentId={state.student} course="python" />
      <div
        role="status"
        className="py-storage-warning"
        data-attention={/хадгалаагүй|боломжгүй|Өөр цонхонд/.test(
          state.cloudStatus,
        )}
      >
        {state.cloudStatus}
        {state.cloudStatus.includes("Өөр цонхонд") && (
          <button onClick={recoverCloudProgress}>
            Ажлаа татаж, серверийн ахицыг ачаалах
          </button>
        )}
      </div>
      {!state.saving && (
        <div role="alert" className="py-storage-warning">
          Браузерт хадгалах боломжгүй байна. Хуудсаа хаахаас өмнө кодоо татаж
          аваарай.
        </div>
      )}
      {sidebar && (
        <button
          className="py-sidebar-backdrop"
          aria-label="Цэс хаах"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside
        className={`py-sidebar ${sidebar ? "open" : ""}`}
        aria-label={grade10Practice ? "Бодлогын түвшин" : "Хичээлийн сэдвүүд"}
      >
        <div className="py-sidebar-heading">
          <span>
            {grade10Practice ? "БОДЛОГЫН ТҮВШИН" : "ХИЧЭЭЛИЙН СЭДВҮҮД"}
          </span>
          <button
            className="py-icon py-mobile-menu"
            aria-label="Цэс хаах"
            onClick={() => setSidebar(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="py-course-links">
          {groups.map(({ title, color, fresh, items }, groupIndex) => {
            const count = items.filter((item) =>
              progress.completed.includes(item.id),
            ).length;
            const isOpen =
              !collapsed.includes(groupIndex) &&
              (groupIndex === currentGroup ||
                collapsed.includes(-groupIndex - 1));
            return (
              <div className="py-module" key={title}>
                <button
                  className="py-module-button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setCollapsed((current) =>
                      isOpen
                        ? [
                            ...current.filter(
                              (value) => value !== -groupIndex - 1,
                            ),
                            groupIndex,
                          ]
                        : [
                            ...current.filter((value) => value !== groupIndex),
                            -groupIndex - 1,
                          ],
                    )
                  }
                >
                  <span className={`py-module-number ${color}`}>
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>
                      {title}
                      {fresh && (
                        <span className="py-new-dot" title="Шинэ сэдэв" />
                      )}
                    </strong>
                    <small>
                      {count}/{items.length} дасгал
                    </small>
                  </span>
                  {isOpen ? (
                    <ChevronDown size={15} />
                  ) : (
                    <ChevronRight size={15} />
                  )}
                </button>
                {isOpen && (
                  <div className="py-exercise-links">
                    {items.map((item) => (
                      <a
                        key={item.id}
                        href={`#/exercises/${item.id}`}
                        aria-current={
                          route.view === "exercises" && item.id === exercise.id
                            ? "page"
                            : undefined
                        }
                        onClick={() => setSidebar(false)}
                      >
                        {progress.completed.includes(item.id) ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <span className="py-lesson-dot" />
                        )}
                        <span>{item.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="py-sidebar-bottom">
          <div>
            <span>Миний гүйцэтгэл</span>
            <strong>{percent}%</strong>
          </div>
          <progress
            max={orderedExercises.length}
            value={completedCount}
            aria-label="Дасгалын гүйцэтгэл"
          />
          <p>
            {completedCount} / {orderedExercises.length} дасгал бие даан бодсон
          </p>
          <button
            className="py-secondary"
            onClick={() => setDialog("reference")}
          >
            <BookOpen size={16} /> Товч лавлах <span>Python 3</span>
          </button>
          <small>
            <ShieldCheck size={13} /> Код, ахиц таны ID-гаар серверт
            хадгалагдана.
          </small>
        </div>
      </aside>
      <div className="py-content">
        {route.view === "visualize" ? (
          <FlowVisualizer
            key={route.id ?? "for"}
            initialMode={isFlowMode(route.id) ? route.id : "for"}
            onExercise={select}
          />
        ) : route.view === "tests" ? (
          <Quiz
            key={state.student}
            progress={progress}
            onReview={(module) =>
              select(exercises.find((item) => item.module === module)!.id)
            }
          />
        ) : route.view === "play" ? (
          <main id="main-content" className="py-main">
            <div className="py-page-title">
              <div>
                <div className="py-eyebrow">ӨӨРИЙН САНААГ ТУРШЪЯ</div>
                <h1>Чөлөөт код</h1>
                <p className="py-subtitle">
                  Асуудал сонго. Код бич. Ажиллуулаад сайжруул.
                </p>
              </div>
              <span className="py-pill">
                <FlaskConical size={15} /> Python лаборатори
              </span>
            </div>
            <div className="py-play-layout">
              <section className="py-task-card">
                <h2>
                  <Sparkles size={20} /> Юу бүтээж болох вэ?
                </h2>
                <div className="py-play-ideas">
                  <h3>Тооны машин</h3>
                  <p>Хоёр тоо, үйлдэл аваад if / elif-ээр үр дүнг тооцоол.</p>
                  <h3>Үржүүлэх хүрд</h3>
                  <p>Хэрэглэгчийн хүссэн тооны хүрдийг for-оор хэвлэ.</p>
                  <h3>Тоо таах тоглоом</h3>
                  <p>while ашиглан зөв таах хүртэл асуугаад оролдлогыг тоол.</p>
                </div>
                <div className="py-info-note">
                  <Info size={16} />
                  <p>
                    Энд зөв, буруу хариу байхгүй. input() хэрэглэх бол оролтын
                    утгуудаа урьдчилан бичээрэй.
                  </p>
                </div>
                <button
                  className="py-text-button"
                  onClick={() => setDialog("reference")}
                >
                  <BookOpen size={15} /> Python товч лавлах
                </button>
              </section>
              <CodeWorkspace
                key={`play-${state.student}-${resetCount}`}
                code={progress.playground.code}
                inputs={progress.playground.inputs}
                saving={state.saving}
                solutionViewed={false}
                onChange={(code) =>
                  updateProgress((current) => ({
                    ...current,
                    playground: { ...current.playground, code },
                  }))
                }
                onInputs={(inputs) =>
                  updateProgress((current) => ({
                    ...current,
                    playground: { ...current.playground, inputs },
                  }))
                }
                onReset={() => setDialog("reset")}
                onChecked={() => {}}
              />
            </div>
          </main>
        ) : (
          <main id="main-content" className="py-main">
            <div className="py-breadcrumb">
              <span>
                {!grade10Practice && isGrade10Exercise && "10-р анги · "}
                {topic.title}
              </span>
              <span>/</span>
              <span>Дасгал {String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="py-page-title">
              <h1 tabIndex={-1}>{exercise.title}</h1>
              <div className="py-lesson-meta">
                {completed ? (
                  <span className="py-completed-pill">
                    <Check size={14} /> Гүйцэтгэсэн
                  </span>
                ) : (
                  <span className="py-pill">{exercise.level}</span>
                )}
                <span>
                  <Clock3 size={15} /> {exercise.minutes} минут
                </span>
              </div>
            </div>
            {!isGrade10Exercise && exercise.module < 4 && (
              <div className="py-next-topic">
                <div>
                  <span className="py-next-symbol">for</span>
                  <span>
                    <strong>Нөхцөлөө мэддэг болсон уу?</strong> Дараагийн алхам
                    — давталт.
                  </span>
                </div>
                <button onClick={() => select("for-intro")}>
                  Шинэ сэдэв эхлэх <ArrowRight size={15} />
                </button>
              </div>
            )}
            <div className="py-exercise-layout">
              <ExerciseLesson
                key={`${exercise.id}-${state.student}`}
                exercise={exercise}
                topic={topic}
                showFlow={!isGrade10Exercise}
                progress={progress}
                onSolution={() => setDialog("solution")}
                onReview={() => setDialog("reference")}
              />
              <CodeWorkspace
                key={`${exercise.id}-${state.student}-${draft.solutionViewed}-${resetCount}`}
                exercise={exercise}
                code={draft.code}
                inputs={draft.inputs}
                saving={state.saving}
                solutionViewed={draft.solutionViewed}
                onChange={(code) => saveDraft(code)}
                onInputs={(inputs) => saveDraft(draft.code, inputs)}
                onReset={() => setDialog("reset")}
                onChecked={checked}
              />
            </div>
            <footer className="py-lesson-footer">
              <button
                className="py-text-button"
                disabled={index === 0}
                onClick={() => select(orderedExercises[index - 1].id)}
              >
                <ArrowLeft size={16} /> Өмнөх дасгал
              </button>
              <span>
                Дасгал <strong>{index + 1}</strong> / {orderedExercises.length}
              </span>
              {index < orderedExercises.length - 1 ? (
                <button
                  className="py-text-button"
                  onClick={() => select(orderedExercises[index + 1].id)}
                >
                  Дараагийн дасгал <ArrowRight size={16} />
                </button>
              ) : grade10Practice ? (
                <Link
                  className="py-text-button"
                  href="/curriculum/10"
                  prefetch={false}
                >
                  10-р ангийн хичээл <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  className="py-text-button"
                  onClick={() => navigate("tests")}
                >
                  Мэдлэгээ шалгах <ArrowRight size={16} />
                </button>
              )}
            </footer>
          </main>
        )}
        <footer className="py-app-bottom">
          <span>Алхам бүр ахиц.</span>
          <span>КодЛаб · {gradeLabel} · Python</span>
        </footer>
      </div>
      {dialog === "reference" && (
        <Dialog title="Python товч лавлах" onClose={() => setDialog(null)} wide>
          <div className="py-reference-grid">
            {topics.map((module) => (
              <section key={module.title}>
                <h3>
                  <span className={`py-module-symbol ${module.color}`}>
                    {module.symbol}
                  </span>
                  {module.title}
                </h3>
                <p>{module.explanation}</p>
                <pre className="py-code-example">{module.example}</pre>
              </section>
            ))}
          </div>
        </Dialog>
      )}
      {dialog === "progress" && (
        <Dialog
          title={
            grade10Practice
              ? "Миний ахиц · 10-р ангийн дадлага"
              : "Миний ахиц · Python бүх дасгал"
          }
          onClose={() => setDialog(null)}
        >
          <div className="py-progress-overview">
            <div
              className="py-progress-circle"
              style={{
                background: `conic-gradient(#2458e6 ${percent}%, #edf1f9 0)`,
              }}
            >
              <span>{percent}%</span>
            </div>
            <div>
              <h3>{state.student}</h3>
              <p>
                {completedCount} / {orderedExercises.length} дасгал бие даан
                бодсон
              </p>
            </div>
          </div>
          <div className="py-progress-modules">
            {groups.map(({ title, items }) => {
              const count = items.filter((item) =>
                progress.completed.includes(item.id),
              ).length;
              return (
                <div key={title}>
                  <span>{title}</span>
                  <strong>
                    {count}/{items.length}
                  </strong>
                  <progress
                    max={items.length}
                    value={count}
                    aria-label={title}
                  />
                </div>
              );
            })}
          </div>
          <p className="py-muted">
            Код, ахиц сурагчийн ID-гаар серверт хадгалагдана. Жишээ хариу үзсэн
            дасгалыг бие даасан гүйцэтгэлд тооцохгүй.
          </p>
          <button
            className="py-secondary"
            onClick={() =>
              downloadFile(
                `python-lab-${state.student}.json`,
                JSON.stringify(
                  { student: state.student, ...progress },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <Download size={16} /> Код, ахицаа татах
          </button>
        </Dialog>
      )}
      {dialog === "solution" && (
        <Dialog title="Жишээ хариу харах уу?" onClose={() => setDialog(null)}>
          <p>
            Жишээ хариуг кодын талбарт оруулна. Одоо бичсэн код солигдох бөгөөд
            энэ дасгал ахицад тооцогдохгүй.
          </p>
          <p className="py-muted">
            Уншиж ойлгосны дараа «Эхнээс нь эхлэх» товчоор дахин бие даан
            бодоорой.
          </p>
          <div className="py-dialog-actions">
            <button className="py-secondary" onClick={() => setDialog(null)}>
              Үргэлжлүүлж бодъё
            </button>
            <button
              className="py-primary"
              onClick={() => {
                saveDraft(
                  exercise.solution,
                  exercise.inputs?.join("\n") ?? "",
                  true,
                );
                setDialog(null);
              }}
            >
              Жишээ хариу харах
            </button>
          </div>
        </Dialog>
      )}
      {dialog === "reset" && (
        <Dialog
          title="Кодыг эхнээс нь эхлэх үү?"
          onClose={() => setDialog(null)}
        >
          <p>
            Энэ {route.view === "play" ? "талбарын" : "дасгалын"} код болон
            оролт эхний төлөвтөө орно.
            {route.view !== "play" && " Гүйцэтгэсэн тэмдэг арилна."}
          </p>
          <div className="py-dialog-actions">
            <button className="py-secondary" onClick={() => setDialog(null)}>
              Болих
            </button>
            <button className="py-primary" onClick={resetCode}>
              <RotateCcw size={16} /> Эхнээс нь эхлэх
            </button>
          </div>
        </Dialog>
      )}
      {dialog === "switch" && (
        <Dialog title="Сурагч солих уу?" onClose={() => setDialog(null)}>
          <p>
            {state.student} ID-гийн серверт хадгалагдсан ажил үлдэнэ. Дараа нь
            ижил ID-гаар үргэлжлүүлж болно.
          </p>
          <div
            role="status"
            className="py-storage-warning"
            data-attention={/хадгалаагүй|боломжгүй|Өөр цонхонд/.test(
              state.cloudStatus,
            )}
          >
            {state.cloudStatus}
            {state.cloudStatus.includes("Өөр цонхонд") && (
              <button onClick={recoverCloudProgress}>
                Ажлаа татаж, серверийн ахицыг ачаалах
              </button>
            )}
          </div>
          {!state.saving && (
            <p className="py-error">
              Одоогоор хадгалалт ажиллахгүй байна. Солихоос өмнө кодоо татаж
              аваарай.
            </p>
          )}
          <div className="py-dialog-actions">
            <button className="py-secondary" onClick={() => setDialog(null)}>
              Болих
            </button>
            <button
              className="py-primary"
              onClick={() => {
                setDialog(null);
                window.location.hash = "";
                logout();
              }}
            >
              <LogOut size={16} /> Сурагч солих
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
