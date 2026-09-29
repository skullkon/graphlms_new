"use client";
import Link from "next/link";
import { loadCode, useLearningEvents } from "@/lib/progress";
import { useEffect, useState } from "react";
export function CourseProgress({chapters}:{chapters:{slug:string;title:string}[]}) {
  const events=useLearningEvents();
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  const completed=new Set(events.filter(e=>e.type==="completed"&&e.courseId==="system-design").map(e=>e.itemId));
  if(ready) for(const chapter of chapters) if(loadCode(`check-${chapter.slug}`,"system-design")==="passed") completed.add(`system-design:chapter:${chapter.slug}`);
  const count=chapters.filter(c=>completed.has(`system-design:chapter:${c.slug}`)).length;
  const next=chapters.find(c=>!completed.has(`system-design:chapter:${c.slug}`));
  return <div><p>Пройдено проверочных вопросов: {count} из {chapters.length}.</p>{next&&<Link href={`/system-design/book/${next.slug}`}>{count?"Продолжить":"Начать"}: {next.title} →</Link>}</div>;
}
