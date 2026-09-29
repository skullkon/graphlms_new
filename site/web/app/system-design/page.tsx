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
    <p>В каждой главе есть объяснение, задания и разбор. Для начала достаточно браузера и желания разобраться. Код и SQL появляются постепенно; схемы можно рисовать на бумаге.</p>
    <div className={styles.links}>{chapters[0]&&<Link href={`/system-design/book/${chapters[0].slug}`}>Читать учебник</Link>}<Link href="/system-design/practice">8 проектов для практики</Link><Link href="/system-design/hard-parts">Hard Parts: сложные темы</Link><Link href="/system-design/labs">Эксперименты с нагрузкой</Link></div>
    <CourseProgress chapters={chapters.map(c=>({slug:c.slug,title:c.title}))} />
    <PracticeProgress />
    <h2>Программа курса</h2><p>{chapters.length} глав: основы, масштабирование, сбои и защита решения на собеседовании. Лучше проходить по порядку: задания опираются на предыдущие главы.</p>
    <ol className={styles.list}>{chapters.map(c=><li key={c.slug}><Link href={`/system-design/book/${c.slug}`}><span>{String(c.order).padStart(2,"0")}</span><strong>{c.title}</strong><small>Открыть главу →</small></Link></li>)}</ol>
    <section aria-labelledby="hard-parts-title">
      <h2 id="hard-parts-title">Hard Parts · Сложные вопросы проектирования</h2>
      <p>База понятна, но в решении остаются неудобные вопросы? Здесь разбираем их отдельно: что гарантирует кворум, где заканчивается «ровно один раз», как переключить регион и не потерять новые записи.</p>
      <div className={styles.links}><Link href="/system-design/hard-parts">Все углублённые блоки →</Link></div>
      <ul className={styles.list}>{hardParts.map(part => <li key={part.slug}><Link href={`/system-design/hard-parts/${part.slug}`}><strong>{part.title}</strong><small>Разобрать →</small></Link></li>)}</ul>
    </section>
    <p><Link href="/system-design/pilot">Как проверяется учебный маршрут →</Link></p>
    <h2>Как работать с заданиями</h2><p>Сначала запишите своё решение, потом читайте разбор. Меняйте условия и проверяйте, выдерживает ли их ваша схема. Проекты сохраняются в рабочей тетради; оценивать архитектуру нужно по критериям задания. Правильный ответ на один вопрос не заменяет эту работу.</p>
  </div>;
}
