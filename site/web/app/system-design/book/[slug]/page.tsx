import { notFound } from "next/navigation";
import { LearningCycle } from "@/components/system-design/LearningCycle";
import Link from "next/link";
import { getBookChapter, getBookChapters, getAllTaskMeta } from "@/lib/content";
import { BookChapterView } from "@/components/book/BookChapterView";
import { Mdx } from "@/components/Mdx";
import { extractToc } from "@/lib/toc";
import { Notebook } from "@/components/system-design/Notebook";
import { Experiments } from "@/components/system-design/Experiments";
import { checkpoints } from "@/lib/system-design/checkpoints";
const course="system-design";
export function generateStaticParams(){return getBookChapters(course).map(c=>({slug:c.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:`${getBookChapter(slug,course)?.chapter.title??"Глава не найдена"} — System Design`};}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const data=getBookChapter(slug,course);if(!data)notFound();
  const {chapter,prev,next}=data;
  const practice=getAllTaskMeta(course).find(t=>t.chapterSlug===slug);
  return <BookChapterView slug={slug} title={chapter.title} order={chapter.order} minutes={chapter.minutes??null} toc={[...extractToc(chapter.body), {depth:2,text:"Самостоятельный сценарий",slug:"learning-cycle"}]} chapters={getBookChapters(course).map(c=>({slug:c.slug,title:c.title,index:c.order}))} prev={prev} next={next} basePath="/system-design/book" sectionLabel="Проектирование систем" relatedPractice={practice?{href:`/system-design/tasks/${practice.slug}`,title:practice.title}:null}>
    <Mdx source={chapter.body}/>
    {chapter.order===4&&<Experiments kind="capacity"/>}{chapter.order===5&&<Experiments kind="queue"/>}
    <section id="learning-cycle"><LearningCycle key={`cycle-${slug}`} chapterSlug={slug}/><p><Link href={`/system-design/project?stage=${chapter.order}`}>Применить тему в проекте Клуба →</Link> · <Link href="/system-design/review">Повторение</Link></p></section>
    <Notebook key={slug} id={slug} checkpoint={checkpoints[chapter.order-1]}/>
  </BookChapterView>;
}
