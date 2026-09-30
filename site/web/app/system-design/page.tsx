import Link from "next/link";
import { PracticeProgress } from "@/components/system-design/PracticeProgress";
import { getBookChapters } from "@/lib/content";
import { CourseProgress } from "@/components/system-design/CourseProgress";
import { getHardParts } from "@/lib/system-design/hardParts";
import styles from "@/components/system-design/course.module.css";
export const metadata = { title: "Проектирование систем — курс с практикой", description: "От первого HTTP-запроса до распределённых систем. Объяснения, архитектурные проекты и подготовка к собеседованию." };
export default function Page() {
  const chapters = getBookChapters("system-design");
  const hardParts = getHardParts();
  return <div className={styles.wrap}>
    <Link href="/learn">← Все курсы</Link><p>System Design · Бесплатный курс</p>
    <h1>Как спроектировать систему, которая справится с работой</h1>
    <p>Начнём с сайта для записи на школьные мероприятия. Разберём, куда уходит запрос, где хранятся данные и почему два человека могут занять последнее место. Затем добавим нагрузку, чат, видео и несколько регионов.</p>
    <p>В каждой главе есть объяснение, задания и разбор. Для начала достаточно браузера; код, SQL и расчёты появляются постепенно. Углублённый маршрут ведёт через сети и устройство хранения к распределённым гарантиям и архитектурной защите. Все материалы и локальные лаборатории бесплатны.</p>
    <div className={styles.links}>{chapters[0]&&<Link href={`/system-design/book/${chapters[0].slug}`}>Читать учебник</Link>}<Link href="/system-design/practice">8 проектов для практики</Link><Link href="/system-design/hard-parts">Hard Parts: сложные темы</Link><Link href="/system-design/labs">Эксперименты с нагрузкой</Link></div>
    <CourseProgress chapters={chapters.map(c=>({slug:c.slug,title:c.title}))} />
    <PracticeProgress />
    <section className={styles.panel}><h2>Как пройти курс</h2><p>Сначала пройдите {chapters.length} основных глав и развивайте свой «Клуб». Затем — {hardParts.length} инженерных блоков по указанным предварительным знаниям. Если база уже знакома, начните с проверки нужной темы и переходите к её углублённому разбору.</p><p>Результат обучения — требования, схема, расчёты, история отказа и проверка решения при новом условии. Проверочный вопрос помогает найти ошибку; он не заменяет защиту архитектуры.</p><div className={styles.links}><a href="/downloads/system-design-labs.zip" download>Скачать бесплатные лаборатории</a><Link href="/system-design/hard-parts/architecture-cases">Финальные архитектурные кейсы</Link></div><p>Локальные модели требуют Python 3.9 или новее; SQL-лаборатория отдельно требует PostgreSQL. Платные API и облако для завершения маршрута не нужны.</p></section>
    <h2>Основной маршрут</h2><p>{chapters.length} глав: основы, масштабирование, сбои и защита решения на собеседовании. Лучше проходить по порядку: задания опираются на предыдущие главы.</p>
    <ol className={styles.list}>{chapters.map(c=><li key={c.slug}><Link href={`/system-design/book/${c.slug}`}><span>{String(c.order).padStart(2,"0")}</span><strong>{c.title}</strong><small>Открыть главу →</small></Link></li>)}</ol>
    <section aria-labelledby="hard-parts-title">
      <h2 id="hard-parts-title">Инженерный маршрут · {hardParts.length} углублённых блоков</h2>
      <p>База понятна, но в решении остаются неудобные вопросы? Здесь разбираем их отдельно: что гарантирует кворум, где заканчивается «ровно один раз», как переключить регион и не потерять новые записи.</p>
      <div className={styles.links}><Link href="/system-design/hard-parts">Все углублённые блоки →</Link></div>
      <ul className={styles.list}>{hardParts.map(part => <li key={part.slug}><Link href={`/system-design/hard-parts/${part.slug}`}><strong>{part.title}</strong><small>Разобрать →</small></Link></li>)}</ul>
    </section>
    <p>Тематические ориентиры: <a href="https://dataintensive.net/">DDIA</a>, <a href="https://github.com/alex-xu-system/bytebytego/blob/main/system_design_links.md">Alex Xu / ByteByteGo</a>, <a href="https://www.educative.io/courses/grokking-the-system-design-interview/course-structure-for-modern-system-design">Educative</a>, университетские программы и официальные инженерные документы. Объяснения, условия задач и лаборатории написаны для этого курса.</p>
    <p><Link href="/system-design/pilot">Как проверяется учебный маршрут →</Link></p>
    <h2>Как работать с заданиями</h2><p>Сначала запишите своё решение, потом читайте разбор. Меняйте условия и проверяйте, выдерживает ли их ваша схема. Проекты сохраняются в рабочей тетради; оценивать архитектуру нужно по критериям задания. Правильный ответ на один вопрос не заменяет эту работу.</p>
  </div>;
}
