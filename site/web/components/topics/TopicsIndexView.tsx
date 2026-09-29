"use client";

import Link from "next/link";
import { Search, Code2 } from "lucide-react";
import styles from "../book/reading.module.css";
import { useEffect, useMemo, useState } from "react";
import type { TaskMeta } from "@/lib/content";
import { TaskCard } from "@/components/TaskCard";
import { TopicProgress } from "@/components/TopicProgress";
import { ProgressStat } from "@/components/ProgressStat";
import { useLearningEvents, useProgress } from "@/lib/progress";
import { apiRequest } from "@/lib/auth";

interface TopicItem {
  num: number;
  label: string;
  tasks: TaskMeta[];
}

export function TopicsIndexView({
  topics,
  total,
}: {
  topics: TopicItem[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const { isSolved } = useProgress(total, "go");
  const events = useLearningEvents();
  const inProgress = useMemo(() => new Set(events.filter((event) => event.type === "started" || event.type === "run").map((event) => event.itemId)), [events]);
  const allTasks = useMemo(() => topics.flatMap((t) => t.tasks.map((task) => ({ ...task, topicNum: t.num, topicLabel: t.label }))), [topics]);
  const tags = useMemo(() => [...new Set(allTasks.flatMap((task) => task.tags ?? []))].sort(), [allTasks]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allTasks.filter((task) => {
      const matchesQuery = !needle || [task.title, task.topicLabel, task.topic, ...(task.tags ?? [])].join(" ").toLowerCase().includes(needle);
      const matchesTopic = topic === "all" || String(task.topicNum) === topic;
      const matchesDifficulty = difficulty === "all" || (task.difficulty ?? "").toLowerCase() === difficulty;
      const solved = isSolved(task.id, task.courseId);
      const matchesStatus = status === "all" || (status === "solved" ? solved : status === "in-progress" ? inProgress.has(task.id) && !solved : !solved && !inProgress.has(task.id));
      return matchesQuery && matchesTopic && matchesDifficulty && matchesStatus;
    });
  }, [allTasks, difficulty, inProgress, isSolved, query, status, topic]);
  const grouped = useMemo(() => new Map(topics.map((t) => [t.num, filtered.filter((task) => task.topicNum === t.num)])), [filtered, topics]);
  return <div className={styles.index}>
    <div className={styles.eyebrow}><Code2 size={15} /> Практика</div>
    <header className={styles.indexHeader}><h1>Практика Go</h1><p>Задачи по конкурентности: каналы, синхронизация, контекст и worker pool. Решения проверяются тестами.</p><div className={styles.meta}><span>{topics.length} тем</span><span>{total} задач</span><span>Проверка решений</span></div></header>
    <div className={styles.topicProgress}><ProgressStat total={total} /></div>
    <div className={styles.filters}>
      <label><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти задачу или навык" aria-label="Поиск по задачам и навыкам" /></label>
      <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Фильтр по теме"><option value="all">Все темы</option>{topics.map((t) => <option key={t.num} value={t.num}>{String(t.num).padStart(2, "0")} · {t.label}</option>)}</select>
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Фильтр по сложности"><option value="all">Любая сложность</option><option value="easy">Лёгкая</option><option value="medium">Средняя</option><option value="hard">Сложная</option></select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Фильтр по статусу"><option value="all">Любой статус</option><option value="todo">Не начато</option><option value="in-progress">В процессе</option><option value="solved">Решено</option></select>
    </div>
    {tags.length > 0 && <div className={styles.tags}>{tags.slice(0, 12).map((tag) => <button key={tag} type="button" onClick={() => setQuery(tag)} aria-pressed={query === tag}>{tag}</button>)}</div>}
    <div className={styles.topicSections}>{topics.map((t) => { const matching = grouped.get(t.num) ?? []; return matching.length ? <TopicSection key={t.num} topic={{ ...t, tasks: matching }} /> : null; })}
    {filtered.length === 0 && <div className={styles.empty}><h2>Задачи не найдены</h2><p>Попробуй другой запрос или сбрось фильтры.</p><button type="button" onClick={() => { setQuery(""); setTopic("all"); setDifficulty("all"); setStatus("all"); }}>Сбросить фильтры</button></div>}</div>
    <div style={{ marginTop: 40 }}><LeaderboardPanel /></div>
  </div>;
}

interface LeaderboardEntry {
  rank: number;
  alias: string;
  feedback: number;
  passed: number;
  passRate: number;
  solvedTasks: number;
}

function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ participants: number; entries: LeaderboardEntry[] }>("/leaderboard?courseId=go")
      .then((payload) => {
        if (cancelled) return;
        setParticipants(payload.participants);
        setEntries(payload.entries.slice(0, 5));
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "unavailable") return null;
  return (
    <section aria-label="Рейтинг качества решений" style={{ marginBottom: 36, padding: "16px 18px", border: "1px solid var(--border-default)", borderRadius: 2, background: "var(--bg-elevated)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
        <div><span style={{ display: "block", color: "var(--accent-text)", font: "11px var(--font-mono)", letterSpacing: ".08em" }}>QUALITY BOARD</span><h2 style={{ margin: "6px 0 0", color: "var(--text-primary)", fontSize: 17 }}>Стабильность решений</h2></div>
        <span style={{ color: "var(--text-tertiary)", font: "11px var(--font-mono)" }}>{state === "loading" ? "загрузка" : `${participants} участников`}</span>
      </div>
      {state === "loading" ? <div style={{ height: 42, color: "var(--text-tertiary)", fontSize: 13 }}>Получаем обезличенную статистику...</div> : entries.length === 0 ? <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Рейтинг появится после трёх проверок у первых участников.</div> : <div style={{ display: "grid", gap: 4 }}>
        {entries.map((entry) => <div key={entry.alias} style={{ display: "grid", gridTemplateColumns: "30px minmax(0,1fr) 100px 74px", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--border-subtle)", fontSize: 12 }}><span style={{ color: "var(--text-tertiary)", font: "11px var(--font-mono)" }}>{String(entry.rank).padStart(2, "0")}</span><strong style={{ overflow: "hidden", color: "var(--text-primary)", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{entry.alias}</strong><span style={{ color: "var(--text-secondary)", textAlign: "right" }}>{entry.passed}/{entry.feedback} PASS</span><span style={{ color: "var(--success-fg)", font: "11px var(--font-mono)", textAlign: "right" }}>{entry.passRate}%</span></div>)}
      </div>}
      <p style={{ margin: "12px 0 0", color: "var(--text-tertiary)", fontSize: 11 }}>Только качество и устойчивость обратной связи, без скорости и раскрытия профиля.</p>
      <style>{`@media(max-width:520px){[aria-label="Рейтинг качества решений"] div[style*="grid-template-columns"]{grid-template-columns:24px minmax(0,1fr) 62px!important}[aria-label="Рейтинг качества решений"] div[style*="grid-template-columns"]>span:last-child{display:none}}`}</style>
    </section>
  );
}

function TopicSection({ topic }: { topic: TopicItem }) {
  return <section><div className={styles.topicSectionHeading}>
    <Link href={`/go/topics/${topic.num}`}>{String(topic.num).padStart(2, "0")}</Link>
    <Link href={`/go/topics/${topic.num}`}>{topic.label}</Link><TopicProgress tasks={topic.tasks} />
    <Link href={`/go/topics/${topic.num}`}>Обзор темы →</Link>
  </div><div className={styles.taskGrid}>{topic.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div></section>;
}
