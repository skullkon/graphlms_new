"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import styles from "./reading.module.css";

export interface BookChapterItem { slug: string; title: string; minutes: number | null }

export function BookIndexView({ chapters, basePath = "/go/book", title = "Конкурентность Go", description = "Сквозные главы-основы по конкурентности Go. Читаются линейно — от горутин и модели памяти до планировщика и боевых паттернов. Каждая связана с задачами тренажёра.", sectionLabel = "Основы", emptyHref = "/go/practice", emptyLabel = "топики и тренажёр" }: {
  chapters: BookChapterItem[]; basePath?: string; title?: string; description?: string; sectionLabel?: string; emptyHref?: string; emptyLabel?: string;
}) {
  const minutes = chapters.reduce((sum, chapter) => sum + (chapter.minutes ?? 0), 0);
  return <div className={styles.index}>
    <div className={styles.eyebrow}><BookOpen size={15} /> Учебник</div>
    <header className={styles.indexHeader}>
      <h1>{title}</h1><p>{description}</p>
      <div className={styles.meta}><span>{chapters.length} глав</span>{minutes > 0 && <span><Clock3 size={14} /> {minutes} мин чтения</span>}<span>Теория и практика</span></div>
      {chapters[0] && <Link className={styles.primary} href={`${basePath}/${chapters[0].slug}`}>Начать читать <ArrowRight size={17} /></Link>}
    </header>
    {chapters.length ? <section className={styles.chapterList}>
      <div className={styles.sectionHeading}><h2>Содержание</h2><span>{sectionLabel}</span></div>
      <ol>{chapters.map((chapter, index) => <li key={chapter.slug}><Link href={`${basePath}/${chapter.slug}`} className={styles.chapterRow}>
        <span className={styles.chapterNumber}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.chapterTitle}>{chapter.title}</span>
        {chapter.minutes != null && chapter.minutes > 0 && <span className={styles.duration}>{chapter.minutes} мин</span>}<ArrowRight className={styles.rowArrow} size={18} />
      </Link></li>)}</ol>
    </section> : <div className={styles.empty}><BookOpen size={28} /><h2>Учебник скоро появится</h2><p>Главы ещё готовятся. А пока доступны <Link href={emptyHref}>{emptyLabel}</Link>.</p></div>}
  </div>;
}
