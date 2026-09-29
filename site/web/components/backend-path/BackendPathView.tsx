"use client";
import { useMemo } from "react";
import Link from "next/link";
import type { BackendStage } from "@/lib/backend-path/content";
import { backendStageComplete } from "@/lib/backend-path/progress";
import { useBackendProgress } from "./useBackendProgress";
import styles from "./path.module.css";
export function BackendPathView({ stages }: { stages: Omit<BackendStage, "body">[] }) {
  const criteria = useMemo(() => Object.fromEntries(stages.map(s => [s.slug, s.checkpoint.length])), [stages]);
  const { progress, error, ready, exportReport } = useBackendProgress(criteria);
  const done = stages.filter(s => backendStageComplete(progress, s.slug)).length;
  const next = stages.find(s => !backendStageComplete(progress, s.slug)) ?? stages[stages.length - 1];
  return <div className={styles.wrap}>
    <span className={styles.eyebrow}>БЕСПЛАТНЫЙ УЧЕБНЫЙ ПУТЬ · 8 ЭТАПОВ</span>
    <h1>От первой программы до backend-проекта на Go</h1>
    <p>Изучите основы Go, затем соберите сервис обработки заданий: HTTP, очередь, воркеры, восстановление после перезапуска и защита архитектуры. Каждый этап заканчивается работающим кодом и проверкой.</p>
    <p>Главы, задания, тесты и эталон доступны бесплатно, без регистрации. Нужны компьютер, редактор и Go 1.25 или новее. Если вы только начали программировать, первый этап проведёт вас через курс основ.</p>
    <div className={styles.actions}>{next && <Link className={styles.button} href={`/backend-path/book/${next.slug}`}>{done ? "Продолжить путь" : "Начать обучение"}</Link>}<Link className={styles.secondary} href="/learn">Все материалы</Link></div>
    <section className={`${styles.panel} ${styles.downloads}`}>
      <h2>Один проект на весь путь</h2>
      <p>Скачайте заготовку, распакуйте архив и откройте README.md. Сервер и проверки работают локально на стандартной библиотеке Go. Платные API и облачные сервисы не нужны.</p>
      <div className={styles.actions}><a className={styles.button} href="/downloads/backend-path-starter.zip" download>Скачать заготовку с тестами</a></div>
      <details><summary>Эталон и разбор решения</summary><p>Сначала попробуйте реализовать этап самостоятельно. Затем сравните код и объясните различия. Все файлы эталона и тесты открыты.</p><a href="/downloads/backend-path-reference.zip" download>Скачать рабочий эталон</a></details>
    </section>
    <h2>Ваш маршрут</h2>
    <p role="status">{ready ? `${done} из ${stages.length} этапов отмечено по вашей самопроверке.` : "Загружаем отметки…"} Открытие главы не завершает этап.</p>
    <ol className={styles.list}>{stages.map(s => <li key={s.slug}><Link className={styles.stage} href={`/backend-path/book/${s.slug}`}><span className={styles.number}>{String(s.order).padStart(2, "0")}</span><div><h2>{s.title}</h2><p>{s.summary}</p></div><span className={styles.status}>{backendStageComplete(progress, s.slug) ? "Самопроверка выполнена" : "Открыть этап →"}</span></Link></li>)}</ol>
    <section className={styles.panel}><h2>Сохраните результат</h2><p>В главах отмечайте выполненные критерии и записывайте, как проверили работу. Отметки хранятся только в этом браузере. Экспортируйте их перед очисткой данных или переходом на другой компьютер. Это ваша самопроверка, без независимой аттестации.</p>{error && <p role="alert">{error}</p>}<button className={styles.secondary} onClick={exportReport}>Экспортировать отметки</button></section>
    <p>Путь завершён, когда вы проверили сервис, описали его ограничения и самостоятельно добавили изменение из последнего этапа. После этого переходите к <Link href="/system-design/book">проектированию систем</Link> и <Link href="/projects">инженерным проектам</Link>.</p>
  </div>;
}
