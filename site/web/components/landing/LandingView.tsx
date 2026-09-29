"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  Search,
} from "lucide-react";
import {
  recordLearningEvent,
  useLearningEvents,
  useProgress,
} from "@/lib/progress";
import OnboardingDiagnostic from "./OnboardingDiagnostic";
interface TopicProp {
  num: number;
  label: string;
  taskCount: number;
  taskIds: string[];
  diff: { e: number; m: number; h: number };
  isReview: boolean;
}
interface CourseProp {
  id: string;
  slug: string;
  title: string;
  short: string;
  description: string;
  accent: string;
  chapters: number;
  tasks: number;
  href: string;
}
interface Props {
  taskCount: number;
  chapterCount: number;
  firstTaskSlug: string | null;
  topics: TopicProp[];
  chapters: { slug: string; title: string; order: number }[];
  courses: CourseProp[];
}
function plural(n: number, words: [string, string, string]) {
  return words[
    n % 100 >= 11 && n % 100 <= 14
      ? 2
      : n % 10 === 1
        ? 0
        : n % 10 >= 2 && n % 10 <= 4
          ? 1
          : 2
  ];
}
function Cover({ id }: { id: string }) {
  return (
    <div className={`library-cover library-cover-${id}`} aria-hidden="true">
      {id === "go-basics" ? (
        <>
          <strong>Go</strong>
          <code>func main() &#123; &#125;</code>
        </>
      ) : id === "go" ? (
        <>
          <strong>go func()</strong>
          <div className="library-channel">
            <span>goroutine</span>
            <i />
            <span>channel</span>
            <i />
            <span>goroutine</span>
          </div>
        </>
      ) : id === "system-design" ? (
        <>
          <strong>System Design</strong>
          <div className="library-system"><span>API</span><span>Данные</span><span>Нагрузка</span></div>
        </>
      ) : (
        <>
          <strong>OS</strong>
          <div className="library-system">
            <span>CPU</span>
            <span>Memory</span>
            <span>I/O</span>
          </div>
        </>
      )}
    </div>
  );
}
export default function LandingView({
  taskCount,
  firstTaskSlug,
  topics,
  chapters,
  courses,
}: Props) {
  const { count, isSolved } = useProgress(taskCount, "go");
  const events = useLearningEvents();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  useEffect(() => {
    recordLearningEvent("landing_view", "landing", {
      eventId: "landing_view:home",
    });
  }, []);
  const nextTopic =
    topics.find((t) => t.taskIds.some((id) => !isSolved(id, "go"))) ??
    topics[0];
  const nextTask =
    nextTopic?.taskIds.find((id) => !isSolved(id, "go")) ??
    firstTaskSlug ??
    "01";
  const resume = useMemo(() => {
    const e = [...events]
      .filter((e) => e.type === "started" && e.itemId.includes(":chapter:"))
      .sort((a, b) => b.at.localeCompare(a.at))[0];
    if (e) {
      const [course, , slug] = e.itemId.split(":");
      return {
        href: `/${course}/book/${slug}`,
        label: "Продолжить чтение",
        detail:
          chapters.find((c) => c.slug === slug)?.title ?? "Открытая глава",
      };
    }
    return {
      href: `/go/tasks/${nextTask}`,
      label: count ? "Продолжить практику" : "Открыть первую задачу",
      detail: nextTopic?.label ?? "Конкурентность Go",
    };
  }, [events, chapters, nextTask, nextTopic, count]);
  const matches = (s: string) =>
    s.toLowerCase().includes(query.trim().toLowerCase());
  const shownCourses = courses.filter((c) =>
    matches(`${c.title} ${c.description}`),
  );
  const shownTopics = topics.filter((t) => matches(t.label));
  const showCourses = category === "all" || category === "courses";
  const showPractice = category === "all" || category === "practice";
  const showLabs =
    (category === "all" || category === "labs") &&
    matches("Лаборатории Операционные системы память процессы планирование");
  const showInterview =
    category === "all" &&
    matches("Интервью тренировка задачи код автоматическая проверка");
  const empty =
    !(showCourses && shownCourses.length) &&
    !(showPractice && shownTopics.length) &&
    !showLabs &&
    !showInterview;
  return (
    <div className="catalog-page product-library">
      <div className="catalog-intro">
        <div>
          <h1>Курсы и практика</h1>
          <p>
            Go, конкурентность и операционные системы — от исходников до
            работающего кода.
          </p>
        </div>
        <Link href="/account" className="catalog-progress">
          <b>
            {count}
            <span> / {taskCount}</span>
          </b>
          <span>
            задач решено <ArrowUpRight size={13} />
          </span>
        </Link>
      </div>
      <Link href="/learn/backend" className="resume-row"><span className="resume-marker">01</span><span><small>Бесплатный законченный путь</small><strong>От основ Go до собственного backend-проекта · 8 этапов</strong></span><span className="resume-action">Начать <ArrowRight size={16} /></span></Link>
      <div className="catalog-toolbar">
        <div className="catalog-tabs" role="group" aria-label="Тип материалов">
          {[
            ["all", "Все материалы"],
            ["courses", "Курсы"],
            ["practice", "Практика"],
            ["labs", "Лаборатории"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="catalog-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти материал…"
            aria-label="Найти материал"
          />
        </label>
      </div>
      {!query && category === "all" && (
        <Link href={resume.href} className="resume-row">
          <span className="resume-marker">↳</span>
          <span>
            <small>Продолжить обучение</small>
            <strong>{resume.detail}</strong>
          </span>
          <span className="resume-action">
            {resume.label}
            <ArrowRight size={16} />
          </span>
        </Link>
      )}
      {showCourses && shownCourses.length > 0 && (
        <section className="catalog-section" id="courses">
          <header className="catalog-section-title">
            <h2>
              Курсы <span>{shownCourses.length}</span>
            </h2>
            <span>Теория и задачи в одном курсе</span>
          </header>
          <div className="catalog-grid">
            {shownCourses.map((c, i) => (
              <Link href={c.href} className="catalog-item" key={c.id}>
                <Cover id={c.id} />
                <div className="catalog-item-title">
                  <h3>{c.title}</h3>
                  <ArrowUpRight size={18} />
                </div>
                <p>{c.description}</p>
                <div className="catalog-item-meta">
                  <span>
                    {c.chapters}{" "}
                    {plural(c.chapters, ["глава", "главы", "глав"])}
                    {c.tasks > 0 &&
                      ` · ${c.tasks} ${plural(c.tasks, ["задача", "задачи", "задач"])}`}
                  </span>
                  <span>
                    {c.id === "system-design" ? "От основ к архитектуре" : i === 0
                      ? "Начальный"
                      : i === 1
                        ? "Продвинутый"
                        : "Системный"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {showPractice && shownTopics.length > 0 && (
        <section className="catalog-section">
          <header className="catalog-section-title">
            <h2>
              Практика <span>{taskCount}</span>
            </h2>
            <Link href="/go/practice">
              Все задачи <ArrowRight size={14} />
            </Link>
          </header>
          <div className="practice-table">
            <div className="practice-table-head">
              <span>Тема</span>
              <span>Задачи</span>
              <span>Прогресс</span>
              <span />
            </div>
            {shownTopics.map((t) => {
              const solved = t.taskIds.filter((id) =>
                isSolved(id, "go"),
              ).length;
              const task =
                t.taskIds.find((id) => !isSolved(id, "go")) ??
                t.taskIds[0] ??
                nextTask;
              return (
                <Link
                  href={`/go/tasks/${task}`}
                  className="practice-table-row"
                  key={t.num}
                >
                  <span className="practice-topic">
                    <span className="row-number">
                      {String(t.num).padStart(2, "0")}
                    </span>
                    <strong>{t.label}</strong>
                    {t.isReview && <em>Повторение</em>}
                  </span>
                  <span className="table-task-count">
                    {t.taskCount}
                    <span> задач</span>
                  </span>
                  <span className="table-progress">
                    <span className="mini-progress" aria-hidden="true">
                      <i
                        style={{
                          width: `${t.taskCount ? (solved / t.taskCount) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span>
                      {solved}/{t.taskCount}
                    </span>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {(showLabs || showInterview) && (
        <section className="catalog-section">
          <header className="catalog-section-title">
            <h2>Дополнительная практика</h2>
            <span>Интерактивные инструменты</span>
          </header>
          <div className="tool-grid">
            {showLabs && (
              <Link href="/os/labs">
                <span className="tool-index">Лаборатории</span>
                <h3>
                  Системы в действии <ArrowUpRight size={18} />
                </h3>
                <p>
                  Планировщик, память, файловая система. Меняй параметры и
                  наблюдай результат.
                </p>
                <span className="tool-bottom">
                  Открыть лаборатории <ArrowRight size={16} />
                </span>
              </Link>
            )}
            {showInterview && (
              <Link href="/go/interview">
                <span className="tool-index">Интервью</span>
                <h3>
                  Проверка на практике <ArrowUpRight size={18} />
                </h3>
                <p>
                  Задачи в условиях интервью. Ограниченное время, код и
                  автоматическая проверка.
                </p>
                <span className="tool-bottom">
                  Начать тренировку <ArrowRight size={16} />
                </span>
              </Link>
            )}
          </div>
        </section>
      )}
      {empty && (
        <div className="catalog-empty">
          <Search size={24} />
          <h2>Материалы не найдены</h2>
          <p>Попробуй другое название или выбери все материалы.</p>
          <button
            className="ui-button ui-button-outline"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Сбросить поиск
          </button>
        </div>
      )}
      {!query && category === "all" && (
        <OnboardingDiagnostic nextTask={nextTask} />
      )}
      <div className="catalog-footnote">
        <BookOpen size={14} />
        <span>Теория рядом с практикой.</span>
        <Code2 size={14} />
        <span>Код проверяется настоящими тестами.</span>
      </div>
    </div>
  );
}
