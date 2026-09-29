import Link from "next/link";
import { DesignInterview } from "@/components/system-design/DesignInterview";
import styles from "@/components/system-design/course.module.css";
export const metadata = { title: "Тренировочное интервью по System Design", description: "Три задачи, этапы на 45 минут, изменённое условие и отчёт с самооценкой." };
export default function Page() {
  return <div className={styles.wrap}><Link href="/system-design">← К курсу</Link><h1>Объясните и защитите решение</h1><p>Выберите задачу, уточните требования и предложите архитектуру. Затем изменится одно условие. Наблюдайте, какие части решения придётся пересмотреть. Работайте самостоятельно или обсуждайте ответ с рецензентом.</p><DesignInterview /></div>;
}
