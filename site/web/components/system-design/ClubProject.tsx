"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { loadCode, saveCode } from "@/lib/progress";
import { contradictions, controls, emptyProject, exportProject, fields, inheritPrevious, MAX_FIELD, parseProject, PROJECT_KEY, saveVersion, stages, updateDraft, type Control, type Project } from "@/lib/system-design/clubProject";
import styles from "./course.module.css";

function download(text: string, extension: string) {
  const url = URL.createObjectURL(new Blob([text], {type: extension === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8"}));
  const a = document.createElement("a"); a.href = url; a.download = `club-project.${extension}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ClubProject({ initialStage }: { initialStage?: number }) {
  const lastSaved = useRef<string | null>(null);
  const conflict = useRef(false);
  const [project, setProject] = useState<Project>(emptyProject);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [raw, setRaw] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      // loadCode deliberately swallows storage exceptions; detect denied reads separately.
      void window.localStorage.length;
      const saved = loadCode(PROJECT_KEY, "system-design");
      lastSaved.current = saved;
      if(saved !== null) setRaw(saved);
      const loaded = saved !== null ? parseProject(saved) : emptyProject();
      setProject(initialStage ? {...loaded, selected: initialStage} : loaded);
      setStatus(saved === null ? "Новый проект. Черновики сохраняются при изменении." : "Проект загружен из этого браузера.");
    } catch(e) {setBlocked(true); setError(e instanceof Error ? e.message : "Не удалось прочитать хранилище. Сохранённые данные не заменены.");}
    setReady(true);
  }, [initialStage]);
  function persist(next: Project) {
    setProject(next); setStatus(""); setError("");
    try {
      if(conflict.current || loadCode(PROJECT_KEY, "system-design") !== lastSaved.current) {
        conflict.current = true;
        throw new Error("Проект изменён в другой вкладке или при синхронизации. Запись остановлена: экспортируйте текущую работу, затем перезагрузите страницу для загрузки внешней версии. Экспорт не заменяет данные в хранилище.");
      }
      const serialized = JSON.stringify(next); parseProject(serialized);
      saveCode(PROJECT_KEY, serialized, "system-design");
      if(loadCode(PROJECT_KEY, "system-design") !== serialized) throw new Error("Не удалось сохранить проект в браузере. Текущий черновик остаётся на странице: экспортируйте его перед закрытием или повторите сохранение.");
      lastSaved.current = serialized;
      setStatus("Все черновики и версии сохранены в этом браузере.");
    } catch(e) {setError(e instanceof Error ? e.message : "Ошибка сохранения. Экспортируйте проект перед закрытием страницы.");}
  }
  if(!ready) return <p role="status">Загружаем проект…</p>;
  if(blocked) return <section className={styles.panel}><p role="alert">{error}</p><p>Редактирование приостановлено, чтобы не заменить прежнюю работу. Сохраните исходный файл для восстановления; если браузер запретил хранилище, разрешите доступ и перезагрузите страницу.</p>{raw !== null && <button className={styles.button} onClick={() => download(raw, "json")}>Скачать исходные данные</button>}</section>;
  const stage = stages[project.selected-1];
  const draft = project.drafts[project.selected-1];
  const feedback = contradictions(draft.controls);
  const missing = Object.entries(fields).filter(([key]) => !draft.fields[key as keyof typeof fields].trim()).map(([,label]) => label);
  const chapter = ["01-foundations", "02-http", "03-data", "04-capacity", "05-load", "06-cache", "07-replication", "08-partitioning", "09-events", "10-realtime", "11-media", "12-security", "13-reliability", "14-evolution", "15-design-review", "16-interviews"][stage.id - 1];
  return <>
    <section className={styles.panel}>
      <label htmlFor="club-stage">Этап проекта </label>
      <select id="club-stage" value={project.selected} onChange={e => persist({...project, selected: Number(e.target.value)})}>{stages.map(s => <option key={s.id} value={s.id}>{s.id}. {s.title}</option>)}</select>
      <h2>{stage.id}. {stage.title}</h2><Link href={`/system-design/book/${chapter}`}>Вернуться к главе этапа</Link><p>{stage.task}</p><p><strong>Артефакт:</strong> {stage.artifact}</p><p><strong>Критерий самопроверки:</strong> {stage.criteria}</p><p><strong>Новое условие:</strong> {stage.change} Дополните решение: что меняется и почему?</p>
      <p>Каждый этап хранит свой черновик. Смена этапа сохраняет введённое. Версия — отдельный снимок текущего этапа; дальнейшее редактирование его не изменяет. Данные сохраняются в этом браузере; после входа они участвуют в общей синхронизации аккаунта. Экспорт служит резервной копией.</p>
      {stage.id > 1 && <p><button className={styles.button} disabled={Object.values(draft.fields).some(v => v.length > 0) || Object.values(draft.controls).some(Boolean) || draft.score !== null} onClick={() => persist(inheritPrevious(project))}>Взять решение предыдущего этапа</button> Затем дополните его с учётом задачи и нового условия. Перенос доступен только в пустой этап; самооценка не переносится.</p>}
      {Object.entries(fields).map(([key,label]) => <p key={key}><label htmlFor={`club-${key}`}>{label}</label><textarea id={`club-${key}`} rows={5} maxLength={MAX_FIELD} value={draft.fields[key as keyof typeof fields]} onChange={e => persist(updateDraft(project, stage.id, {...draft, fields: {...draft.fields, [key]: e.target.value}}))}/><small>{draft.fields[key as keyof typeof fields].length} / {MAX_FIELD} знаков</small></p>)}
      <fieldset className={styles.checkpoint}><legend>Укажите гарантии и механизмы вашего решения</legend><p>Отмечайте только утверждения, которые действительно входят в вашу модель. Пустой флажок не означает, что механизм проверен или не нужен. На ранних этапах оставьте незнакомые свойства неотмеченными: регионы, кэш и внешние платежи будут разобраны в следующих главах.</p>{Object.entries(controls).map(([key,label]) => <label className={styles.option} key={key}><input type="checkbox" checked={draft.controls[key as Control]} onChange={e => persist(updateDraft(project, stage.id, {...draft, controls: {...draft.controls, [key]: e.target.checked}}))}/>{label}</label>)}</fieldset>
      <section aria-label="Проверка модели" aria-live="polite"><h3>Что осталось описать</h3><p>{missing.length ? `Пока не описано: ${missing.join("; ")}.` : "Все пять полей заполнены."} Это проверка полноты формы, а не качества решения. Сверьте объяснение с критерием этапа и новым условием.</p><h3>Проверка выбранных утверждений</h3>{feedback.length ? <ul>{feedback.map(f => <li key={f}>{f}</li>)}</ul> : <p>Среди четырёх проверяемых сочетаний противоречий не найдено. Это не подтверждает правильность архитектуры: неотмеченные свойства и открытые ответы автомат не проверяет.</p>}<p>Открытые ответы: экспертная проверка не выполнена. Их содержание не оценивается по ключевым словам.</p></section>
      <p>Рубрика для человека: 0 — тема отсутствует; 1 — механизм назван; 2 — объяснён путь и граница гарантии; 3 — решение проверено на изменённом условии с объяснением цены.</p>
      <label htmlFor="club-score">Самооценка этапа (необязательно) </label><select id="club-score" value={draft.score ?? ""} onChange={e => persist(updateDraft(project, stage.id, {...draft, score: e.target.value === "" ? null : Number(e.target.value)}))}><option value="">Не выставлена</option>{[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}</select>
      <div className={styles.actions}><button className={styles.button} disabled={missing.length === 5} onClick={() => {try {persist(saveVersion(project));} catch(e) {setError((e as Error).message);setStatus("");}}}>Сохранить версию этапа</button><button className={styles.button} onClick={() => persist(project)}>Повторить сохранение</button></div>
      <p role="status">{status}</p>{error && <p role="alert">{error}</p>}
    </section>
    <section className={styles.panel}><h2>История и экспорт</h2><p>Сохранено {project.history.length} из 64 версий. При достижении предела новые снимки не добавляются; прежние не удаляются. Общий предел хранения — 2 МБ. Экспорт включает все черновики, снимки, выбранную модель и самооценку; Markdown также содержит задания и критерии.</p><div className={styles.actions}><button className={styles.button} onClick={() => download(exportProject(project, "json"), "json")}>Скачать JSON</button><button className={styles.button} onClick={() => download(exportProject(project, "md"), "md")}>Скачать Markdown</button></div>
      {project.history.length === 0 ? <p>Версий пока нет. Сохраните первый снимок после описания решения.</p> : <ol>{project.history.map((v,i) => <li key={i}><details><summary>Версия {i+1} · этап {v.stage} · {new Date(v.at).toLocaleString("ru-RU")}</summary>{Object.entries(fields).map(([key,label]) => <div key={key}><h3>{label}</h3><p style={{whiteSpace:"pre-wrap"}}>{v.draft.fields[key as keyof typeof fields] || "Не заполнено"}</p></div>)}<p>Самооценка: {v.draft.score ?? "не выставлена"}. Экспертная проверка не выполнена.</p><ul>{Object.entries(controls).filter(([k]) => v.draft.controls[k as Control]).map(([k,label]) => <li key={k}>{label}</li>)}</ul></details></li>)}</ol>}
    </section>
  </>;
}
