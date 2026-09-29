import Link from "next/link";
import { FailureSimulator } from "@/components/system-design/FailureSimulator";
import { Experiments } from "@/components/system-design/Experiments";
import styles from "@/components/system-design/course.module.css";
export const metadata={title:"Сбои, нагрузка и очередь — эксперименты System Design"};
export default function Page(){return <div className={styles.wrap}><Link href="/system-design">← К курсу</Link><h1>Проверьте предположение</h1><p>Сначала предскажите результат, потом измените параметры. Эти модели показывают отдельные зависимости; производительность реального сервера нужно измерять отдельно.</p><FailureSimulator/><Experiments kind="capacity"/><Experiments kind="queue"/></div>;}
