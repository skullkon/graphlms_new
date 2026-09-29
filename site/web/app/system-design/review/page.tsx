import Link from "next/link";
import { ReviewPractice } from "@/components/system-design/ReviewPractice";
import styles from "@/components/system-design/course.module.css";
export const metadata = { title: "Повторение и перенос знаний — System Design" };
export default function Page() { return <div className={styles.wrap}><Link href="/system-design">← К курсу</Link><h1>Проверить, что осталось в памяти</h1><ReviewPractice /></div>; }
