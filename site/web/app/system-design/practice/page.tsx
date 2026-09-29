import Link from "next/link";
import { getAllTaskMeta } from "@/lib/content";
import styles from "@/components/system-design/course.module.css";
export const metadata={title:"Практика System Design — 8 архитектурных проектов"};
export default function Page(){return <div className={styles.wrap}><Link href="/system-design">← К курсу</Link><h1>Спроектируйте и проверьте</h1><p>У каждого проекта есть ограничения и критерии. Запишите решение до чтения подсказки, затем проверьте его на предложенном усложнении. Здесь нет единственной правильной схемы и автоматической оценки архитектуры.</p><ol className={styles.list}>{getAllTaskMeta("system-design").map(t=><li key={t.id}><Link href={`/system-design/tasks/${t.slug}`}><span>{t.id}</span><strong>{t.title}</strong><small>Открыть задание →</small></Link></li>)}</ol></div>;}
