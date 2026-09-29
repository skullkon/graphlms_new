"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { loadCode } from "@/lib/progress";
import { learningCycles } from "@/lib/system-design/learningCycle";
import { firstReviewDue, parseReviews, readCycleCompletion, reviewStoreProblem, REVIEW_KEY } from "@/lib/system-design/reviews";
import styles from "./course.module.css";
export function PracticeProgress() {
  const [state, setState] = useState({ready:false,passed:0,due:0,error:false});
  useEffect(() => {
    const sync=()=>{
      const raw=loadCode(REVIEW_KEY,"system-design");const error=reviewStoreProblem(raw)!==null;const reviews=parseReviews(raw);let passed=0,due=0;
      learningCycles.forEach(c=>{const at=readCycleCompletion(loadCode(`cycle-${c.chapterSlug}`,"system-design"), c.answer);if(at!==null){passed++;if((reviews.records[c.chapterSlug]?.dueAt??firstReviewDue(at))<=Date.now())due++;}});
      setState({ready:true,passed,due,error});
    };
    sync();window.addEventListener("storage",sync);window.addEventListener("goconc:solved-changed",sync);
    return()=>{window.removeEventListener("storage",sync);window.removeEventListener("goconc:solved-changed",sync);};
  },[]);
  return <section className={styles.panel} aria-label="Практический маршрут"><h2>От объяснения к собственному решению</h2><p>{state.ready?`Самостоятельные сценарии: ${state.passed} из ${learningCycles.length}. Пора повторить: ${state.due}.`:"Загружаем практический прогресс…"} {state.error && " Расписание требует восстановления на странице повторения."} Это отдельные результаты: проверочные вопросы и прежние заметки сохранены.</p><div className={styles.links}><Link href="/system-design/project">Развивать свой Клуб</Link><Link href="/system-design/review">Повторить темы</Link><Link href="/system-design/interview">Тренировочное интервью</Link><Link href="/system-design/labs">Разобрать сбой по шагам</Link></div><p>После каждой главы решите самостоятельный сценарий, затем обновите соответствующий этап проекта. Открытый разбор или сохранённый текст сами по себе не означают, что архитектура проверена.</p></section>;
}
