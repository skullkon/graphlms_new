"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLearningEvents, useProgress } from "@/lib/progress";
import { findLearningResume, type ResumeItem } from "@/lib/learningResume";
import styles from "./LearningReturn.module.css";

export default function LearningReturn({
  items,
  taskCount,
}: {
  items: ResumeItem[];
  taskCount: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const events = useLearningEvents();
  const { isSolved } = useProgress(taskCount);
  if (!mounted) return null;

  const resume = findLearningResume(events, items);
  const solved = new Set(
    items
      .filter(
        (item) => item.kind === "task" && isSolved(item.id, item.courseId),
      )
      .map((item) => `${item.courseId}:${item.id}`),
  ).size;

  if (!resume && solved === 0) return null;

  return (
    <aside className={styles.card} aria-label="Продолжить обучение">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Ваше обучение</span>
        <h2>{resume ? "Продолжим?" : "Ваши решения сохранены"}</h2>
        <p>
          {resume
            ? resume.title
            : "Вернитесь к своему прогрессу и выберите следующий шаг."}
        </p>
      </div>
      <div className={styles.actions}>
        {solved > 0 && (
          <span className={styles.count}>
            Решено задач: <strong>{solved}</strong>
            {taskCount > 0 ? ` из ${taskCount}` : ""}
          </span>
        )}
        {resume && (
          <Link className={styles.resume} href={resume.href}>
            Продолжить <span aria-hidden="true">↗</span>
          </Link>
        )}
        <Link className={styles.account} href="/account">
          Мой прогресс <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  );
}
