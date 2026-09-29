"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadCode, saveCode } from "@/lib/progress";
import { learningCycles } from "@/lib/system-design/learningCycle";
import { emptyReviews, firstReviewDue, parseReviews, readCycleCompletion, REVIEW_KEY, reviewStoreProblem, scheduleReview, type ReviewRating } from "@/lib/system-design/reviews";
import styles from "./course.module.css";

export function ReviewPractice() {
  const [store, setStore] = useState(emptyReviews);
  const draftBase = useRef<Record<string, string | null>>({});
  const [draftBlocked, setDraftBlocked] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [rawStore, setRawStore] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => {
      const raw = loadCode(REVIEW_KEY, "system-design"); setRawStore(raw); setProblem(reviewStoreProblem(raw));
      setStore(parseReviews(raw));
      const found: Record<string, number> = {};
      learningCycles.forEach(c => { const at = readCycleCompletion(loadCode(`cycle-${c.chapterSlug}`, "system-design"), c.answer); if (at !== null) found[c.chapterSlug] = at; });
      setCompleted(found); setNow(Date.now()); setReady(true);
    };
    sync(); window.addEventListener("storage", sync); window.addEventListener("goconc:solved-changed", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("goconc:solved-changed", sync); };
  }, []);
  const eligible = learningCycles.filter(c => completed[c.chapterSlug] !== undefined);
  const sorted = [...eligible].sort((a,b) => (store.records[a.chapterSlug]?.dueAt ?? firstReviewDue(completed[a.chapterSlug])) - (store.records[b.chapterSlug]?.dueAt ?? firstReviewDue(completed[b.chapterSlug])));
  const exercise = learningCycles.find(c => c.chapterSlug === selected);
  const draft = answers[selected] ?? "";
  function saveDraft() {
    const key = `review-draft-${selected}`;
    if (draftBlocked[selected] || loadCode(key, "system-design") !== draftBase.current[selected]) {
      setDraftBlocked(b => ({...b, [selected]: true}));
      setStatus("Черновик изменился в другом окне. Ваш текст оставлен на экране; сохранённая запись не заменена.");
      return;
    }
    saveCode(key, draft, "system-design");
    const saved = loadCode(key, "system-design") === draft;
    if (saved) draftBase.current[selected] = draft;
    setStatus(saved ? "Черновик сохранён." : "Не удалось сохранить черновик. Скопируйте текст перед уходом.");
  }
  function rate(rating: ReviewRating) {
    if (!exercise || !revealed || draft.trim().length < 40) return;
    const raw = loadCode(REVIEW_KEY, "system-design"); const error = reviewStoreProblem(raw);
    if (error) { setProblem(error); setRawStore(raw); return; }
    const current = parseReviews(raw);
    const record = scheduleReview(current.records[selected], selected, draft, rating, Date.now());
    const next = { ...current, records: { ...current.records, [selected]: record } };
    const serialized = JSON.stringify(next); saveCode(REVIEW_KEY, serialized, "system-design");
    if (loadCode(REVIEW_KEY, "system-design") !== serialized) { setStatus("Не удалось сохранить. Скопируйте ответ перед уходом."); return; }
    setStore(next); setRevealed(false); setAnswers(a => ({...a,[selected]:""})); if(loadCode(`review-draft-${selected}`,"system-design")===draftBase.current[selected]) { saveCode(`review-draft-${selected}`, "", "system-design"); draftBase.current[selected]=""; } setStatus(`Самооценка сохранена. Следующее повторение: ${new Date(record.dueAt).toLocaleDateString("ru-RU")}.`);
  }
  return <>
    <p>Вернитесь к задаче без учебника, объясните решение и сравните его с разбором. Расписание основано на вашей самооценке: 1, 3, 7, 14 и 30 дней. Оно помогает организовать практику и не измеряет владение темой автоматически.</p>
    {!ready ? <p role="status">Загружаем расписание…</p> : problem ? <section className={styles.panel}><p role="alert">{problem}</p><button className={styles.button} onClick={() => { const url=URL.createObjectURL(new Blob([rawStore ?? ""],{type:"application/json"})); const a=document.createElement("a");a.href=url;a.download="review-recovery.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }}>Скачать исходные данные</button></section> : <>
      {sorted.length === 0 && <section className={styles.panel}><h2>Начните с самостоятельного сценария</h2><p>После успешной попытки в главе здесь появится задача с изменёнными условиями. Первое повторение назначается через день.</p><Link href="/system-design/book/01-foundations#learning-cycle">Открыть первую задачу →</Link></section>}
      <ul className={styles.list}>{sorted.map(c => {
        const due = store.records[c.chapterSlug]?.dueAt ?? firstReviewDue(completed[c.chapterSlug]);
        return <li key={c.chapterSlug}><div className={styles.actions}><button className={styles.button} onClick={() => { if(!(c.chapterSlug in draftBase.current)) draftBase.current[c.chapterSlug]=loadCode(`review-draft-${c.chapterSlug}`,"system-design"); setSelected(c.chapterSlug); setAnswers(a => ({...a,[c.chapterSlug]:a[c.chapterSlug] ?? loadCode(`review-draft-${c.chapterSlug}`, "system-design") ?? ""})); setRevealed(false); setStatus(""); }}>{c.title}</button><span>{due <= now ? "Пора повторить" : `Повторение ${new Date(due).toLocaleDateString("ru-RU")}`}</span></div></li>;
      })}</ul>
      {exercise && <section className={styles.panel} aria-label="Задача на перенос знаний"><h2>{exercise.title}: другое условие</h2><p>{exercise.transfer.prompt}</p><label htmlFor="recall-answer">Объясните решение без подсказки</label><textarea id="recall-answer" rows={8} value={draft} onChange={e => { setAnswers(a => ({...a,[selected]:e.target.value})); setRevealed(false); setStatus("Ответ ещё не сохранён. Сравните его и выберите самооценку."); }} /><p>Сначала запишите хотя бы несколько предложений (от 40 символов). Объём нужен только для начала попытки, а не для оценки её качества.</p><button className={styles.button} onClick={saveDraft} disabled={!!draftBlocked[selected]}>Сохранить черновик</button> <button className={styles.button} disabled={draft.trim().length < 40} onClick={() => setRevealed(true)}>Сравнить с разбором</button>
      {revealed && <><h3>Разбор</h3><p>{exercise.transfer.answer}</p><p>Сравните механизм, условия и поведение при сбое. Совпадение формулировок не требуется.</p><div className={styles.actions}><button className={styles.button} onClick={() => rate("again")}>Есть пробел — повторить завтра</button><button className={styles.button} onClick={() => rate("good")}>Объяснил самостоятельно</button></div></>}
      <p role="status">{status}</p>{draftBlocked[selected] && <div className={styles.actions}><a download="review-draft.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(draft)}`}>Скачать свой черновик</a><button className={styles.button} onClick={() => {const value=loadCode(`review-draft-${selected}`,"system-design");draftBase.current[selected]=value;setAnswers(a=>({...a,[selected]:value??""}));setDraftBlocked(b=>({...b,[selected]:false}));setRevealed(false);setStatus("Загружен сохранённый черновик.");}}>Загрузить сохранённый черновик</button></div>}<Link href={`/system-design/book/${selected}`}>Вернуться к объяснению темы</Link></section>}
    </>}
  </>;
}
