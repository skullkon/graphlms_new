import Link from "next/link";
import { ClubProject } from "@/components/system-design/ClubProject";
import styles from "@/components/system-design/course.module.css";
export const metadata = { title: "Проект Клуба — System Design" };
export default async function Page({ searchParams }: { searchParams: Promise<{ stage?: string }> }) { const query = await searchParams; const stage = Number(query.stage); const initialStage = Number.isInteger(stage) && stage >= 1 && stage <= 16 ? stage : undefined; return <main className={styles.wrap}><Link href="/system-design">← К курсу</Link><h1>Спроектируйте Клуб по шагам</h1><p>После каждой главы дополните решение. В каждом этапе есть задача, артефакт и новое условие, которое проверяет границы выбранного механизма. Сохраняйте версии, чтобы видеть, как меняется архитектура.</p><ClubProject initialStage={initialStage}/></main>; }
