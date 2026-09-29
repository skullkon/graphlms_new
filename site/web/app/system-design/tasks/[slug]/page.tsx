import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTaskMeta, getTaskContent } from "@/lib/content";
import { Mdx } from "@/components/Mdx";
import { Notebook } from "@/components/system-design/Notebook";
import styles from "@/components/system-design/course.module.css";
export function generateStaticParams(){return getAllTaskMeta("system-design").map(t=>({slug:t.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:`${getTaskContent(slug,"system-design")?.title??"Задание не найдено"} — практика`};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const task=getTaskContent(slug,"system-design");if(!task)notFound();return <div className={styles.wrap}><Link href="/system-design/practice">← Все проекты</Link><h1>{task.title}</h1>{task.chapterSlug&&<p><Link href={`/system-design/book/${task.chapterSlug}`}>Глава перед этим проектом →</Link></p>}<Mdx source={task.problem}/><Notebook key={task.id} id={`project-${task.id}`} project/></div>;}
