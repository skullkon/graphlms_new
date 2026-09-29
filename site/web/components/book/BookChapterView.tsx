"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, ChevronDown, Code2 } from "lucide-react";
import { recordLearningEvent } from "@/lib/progress";
import { RunnableMounter } from "@/components/play/RunnableMounter";
import styles from "./reading.module.css";

interface TocItem { slug: string; text: string; depth: number }
interface NavLink { slug: string; title: string }
interface ChapterRef { slug: string; title: string; index: number }
interface PracticeRef { href: string; title: string }

export function BookChapterView({ slug, progressSlug = slug, title, order, minutes, toc, chapters, prev, next, children, basePath = "/go/book", sectionLabel = "Основы", relatedPractice, version, versionDate }: {
  slug: string; progressSlug?: string; title: string; order: number; minutes: number | null; toc: TocItem[]; chapters: ChapterRef[]; prev: NavLink | null; next: NavLink | null; children: ReactNode; basePath?: string; sectionLabel?: string; relatedPractice?: PracticeRef | null; version?: string; versionDate?: string;
}) {
  const hardParts = basePath.endsWith("/hard-parts");
  const courseId = basePath.split("/")[1] || "go";
  useEffect(() => { recordLearningEvent("started", `${courseId}:chapter:${progressSlug}`, { courseId, eventId: `started:${courseId}:chapter:${progressSlug}` }); }, [courseId, progressSlug]);
  const chapterLinks = <nav aria-label={hardParts ? "Углублённые блоки" : "Главы учебника"} className={styles.chapterNav}>{chapters.map((chapter) => <Link key={chapter.slug} href={`${basePath}/${chapter.slug}`} aria-current={chapter.slug === slug ? "page" : undefined}><span>{String(chapter.index).padStart(2, "0")}</span>{chapter.title}</Link>)}</nav>;
  return <div className={styles.readingLayout}>
    <div className={styles.readingMain}>
      <Link href={basePath} className={styles.back}><ArrowLeft size={15} /> {hardParts ? "Все углублённые блоки" : "Все главы учебника"}</Link>
      <details className={styles.mobileContents}><summary><BookOpen size={16} /> {hardParts ? "Углублённые блоки" : "Содержание учебника"} <ChevronDown size={16} /></summary>{chapterLinks}</details>
      <article className="mdx-host">
        <header className={styles.articleHeader}>
          <div className={styles.eyebrow}>{hardParts ? "Блок" : "Глава"} {String(order).padStart(2, "0")} <span> / </span> {sectionLabel}</div>
          <h1>{title}</h1>
          <div className={styles.meta}>{minutes ? <span><Clock3 size={14} /> {minutes} мин чтения</span> : null}{version && <Link href={`/changelog#v${version}`} title={versionDate ? `Версия контента от ${versionDate}` : "История изменений контента"}>Контент v{version}</Link>}</div>
        </header>
        <div className={`mdx ${styles.prose}`}>{children}</div><RunnableMounter />
        {relatedPractice && <Link href={relatedPractice.href} className={styles.practiceCallout}><Code2 size={24} /><span><small>Закрепи на практике</small><strong>{relatedPractice.title}</strong></span><ArrowRight size={20} /></Link>}
        <nav className={styles.pagination} aria-label="Переход между главами">{prev ? <Link href={`${basePath}/${prev.slug}`}><small><ArrowLeft size={14} /> {hardParts ? "Предыдущий блок" : "Предыдущая глава"}</small><strong>{prev.title}</strong></Link> : <span />}{next ? <Link href={`${basePath}/${next.slug}`} className={styles.next}><small>{hardParts ? "Следующий блок" : "Следующая глава"} <ArrowRight size={14} /></small><strong>{next.title}</strong></Link> : <Link href={basePath} className={styles.next}><small>Учебник <BookOpen size={14} /></small><strong>К содержанию</strong></Link>}</nav>
      </article>
    </div>
    <aside className={styles.readingAside}><div className={styles.asideLabel}>{hardParts ? "Сложные темы" : "В этом учебнике"}</div>{chapterLinks}{toc.length > 0 && <div className={styles.toc}><div className={styles.asideLabel}>На этой странице</div><nav aria-label="Разделы главы">{toc.map((item, index) => <a key={`${item.slug}-${index}`} href={`#${item.slug}`} className={item.depth === 3 ? styles.tocNested : undefined}>{item.text}</a>)}</nav></div>}</aside>
  </div>;
}
