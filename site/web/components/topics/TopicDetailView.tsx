"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ProgressBar } from "@/ds";
import { ArrowLeft, ArrowRight } from "lucide-react";
import styles from "../book/reading.module.css";
import type { TaskMeta } from "@/lib/content";
import { TaskCard } from "@/components/TaskCard";
import { useProgress } from "@/lib/progress";

interface NavTopic {
  num: number;
  label: string;
}

export function TopicDetailView({
  num,
  label,
  tasks,
  hasIntro,
  prev,
  next,
  children,
}: {
  num: number;
  label: string;
  tasks: TaskMeta[];
  hasIntro: boolean;
  prev: NavTopic | null;
  next: NavTopic | null;
  children: ReactNode;
}) {
  const num2 = String(num).padStart(2, "0");
  const firstTask = tasks[0];

  return <div className={styles.index}>
    <Link href="/go/practice" className={styles.back}><ArrowLeft size={15} /> Все темы</Link>
    <header className={styles.topicHeader}><div className={styles.eyebrow} style={{ marginBottom: 16 }}>Тема {num2}</div><h1>{label}</h1><p>Разберись в теме, затем проверь понимание на задачах.</p></header>
    <div className={styles.topicProgress}><TopicProgressHeader tasks={tasks} />{firstTask && <Link href={`/go/tasks/${firstTask.slug}`} className={styles.primary}>К задачам <ArrowRight size={16} /></Link>}</div>
    {hasIntro ? <div className={`mdx ${styles.prose}`} style={{ maxWidth: 720 }}>{children}</div> : <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Вводная глава ещё готовится. Задачи уже доступны ниже.</p>}
    <h2 className={styles.taskHeading}>Задачи темы <span>{tasks.length}</span></h2>
    <div className={styles.taskGrid}>{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>
    <nav className={styles.pagination} aria-label="Переход между темами">{prev ? <Link href={`/go/topics/${prev.num}`}><small><ArrowLeft size={14} /> Тема {String(prev.num).padStart(2, "0")}</small><strong>{prev.label}</strong></Link> : <span />}{next ? <Link href={`/go/topics/${next.num}`} className={styles.next}><small>Тема {String(next.num).padStart(2, "0")} <ArrowRight size={14} /></small><strong>{next.label}</strong></Link> : <span />}</nav>
  </div>;
}

function TopicProgressHeader({ tasks }: { tasks: TaskMeta[] }) {
  const courseId = tasks[0]?.courseId;
  const { isSolved } = useProgress(tasks.length, courseId);
  const done = tasks.filter((t) => isSolved(t.id, t.courseId)).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const tone = done > 0 && done === tasks.length ? "success" : "accent";
  const labelColor = tone === "success" ? "var(--success-fg)" : "var(--accent-text)";

  return (
    <div style={{ flex: 1, maxWidth: 300 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: "var(--text-secondary)",
          }}
        >
          {done}/{tasks.length} решено
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--label-sm)",
            color: labelColor,
          }}
        >
          {pct}%
        </span>
      </div>
      <ProgressBar value={done} max={tasks.length || 1} tone={tone} />
    </div>
  );
}
