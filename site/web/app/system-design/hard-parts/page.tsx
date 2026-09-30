import Link from "next/link";
import { getHardParts, getHardPartPrerequisite } from "@/lib/system-design/hardParts";
import { HardPartProgress } from "@/components/system-design/HardPartProgress";
import styles from "@/components/system-design/course.module.css";

export const metadata = { title: "Сложные вопросы System Design — углублённые блоки", description: "Согласованность, консенсус, транзакции, доставка событий, перегрузка и миграции: разборы механизмов и границ гарантий." };

export default function Page() {
  const parts = getHardParts();
  return <div className={styles.wrap}>
    <Link href="/system-design">← К курсу</Link>
    <h1>Инженерный маршрут: от сетей до защиты архитектуры</h1>
    <p>Здесь можно отдельно изучить механизм, который вызвал вопросы в основном курсе. Каждый блок начинается с конкретной ситуации и разбирает, что система может гарантировать при конкурирующих запросах, задержках или сбоях.</p>
    <p>Выберите нужную тему. Если термины пока незнакомы, сначала прочитайте указанные базовые главы. Правильный ответ на проверочный вопрос не заменяет самостоятельного разбора архитектуры.</p>
    <HardPartProgress parts={parts.map(({ slug, title }) => ({ slug, title }))} />
    {parts.map(part => <section key={part.slug} className={styles.panel}>
      <h2><Link href={`/system-design/hard-parts/${part.slug}`}>{part.order}. {part.title}</Link></h2>
      <p>{part.summary}</p>
      <p>Перед разбором:</p>
      <ul>{part.prerequisites.map(slug => { const prerequisite = getHardPartPrerequisite(slug); return prerequisite ? <li key={slug}><Link href={prerequisite.href}>{prerequisite.title}</Link></li> : null; })}</ul>
      <Link href={`/system-design/hard-parts/${part.slug}`}>Открыть разбор →</Link>
    </section>)}
  </div>;
}
