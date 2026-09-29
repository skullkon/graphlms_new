"use client";
import React, { useEffect, useRef, useState } from "react";
import { loadCode, saveCode } from "@/lib/progress";
import { canRevealConstraint, completeInterview, createInterview, elapsedInterviewMs, interviewCompletionErrors, interviewCriteria, interviewMarkdown, interviewPhase, interviewPhases, interviewReport, interviewScenarios, nextInterviewPhase, parseInterview, pauseInterview, resumeInterview, revealConstraint, totalInterviewMs, type InterviewScenarioId, type InterviewState } from "@/lib/system-design/interview";
import styles from "./course.module.css";
import activity from "./activity.module.css";

const storageKey = (scenario: InterviewScenarioId) => `interview-v1-${scenario}`;
const clock = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
function download(filename: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function DesignInterview() {
  const [selected, setSelected] = useState<InterviewScenarioId>("booking");
  const [state, setState] = useState<InterviewState>(() => createInterview("booking"));
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const dirty = useRef(false);
  const lastStored = useRef<string | null>(null);
  const blocked = useRef(false);
  const [storageProblem, setStorageProblem] = useState<{ kind: "malformed" | "conflict"; raw: string | null } | null>(null);
  const current = useRef(state); current.current = state;
  function persist(value: InterviewState): boolean {
    const serialized = JSON.stringify(value);
    if (blocked.current) { setStatus("Сохранение остановлено: сначала разрешите конфликт или восстановите данные."); return false; }
    const existing = loadCode(storageKey(value.scenario), "system-design");
    if (existing !== lastStored.current && existing !== serialized) {
      blocked.current = true; setStorageProblem({ kind: "conflict", raw: existing });
      setStatus("Сохранение остановлено: обнаружена другая версия. Текущие правки остались в редакторе."); return false;
    }
    saveCode(storageKey(value.scenario), serialized, "system-design");
    const saved = loadCode(storageKey(value.scenario), "system-design") === serialized;
    setStatus(saved ? "Заметки и состояние таймера сохранены в этом браузере. При входе действует синхронизация аккаунта." : "Не удалось сохранить. Скопируйте заметки перед закрытием страницы.");
    dirty.current = !saved;
    if (saved) lastStored.current = serialized;
    return saved;
  }
  useEffect(() => {
    const raw = loadCode(storageKey(selected), "system-design");
    const stored = parseInterview(raw, selected);
    lastStored.current = raw;
    blocked.current = Boolean(raw && !stored); setStorageProblem(raw && !stored ? { kind: "malformed", raw } : null);
    dirty.current = false; setState(stored ?? createInterview(selected)); setNow(Date.now()); setReady(true); setErrors([]);
    setStatus(raw && !stored ? "Сохранённые данные не удалось прочитать. Они не заменяются, пока вы не начнёте новую работу." : stored ? "Восстановлены заметки и состояние таймера." : "Пока нет сохранённой попытки.");
  }, [selected]);
  useEffect(() => {
    if (!ready) return;
    const sync = () => {
      const raw = loadCode(storageKey(selected), "system-design");
      if (raw === lastStored.current) return;
      const stored = parseInterview(raw, selected);
      if (!stored) { blocked.current = true; setStorageProblem({ kind: "conflict", raw }); setStatus("Сохранённое состояние изменилось, но его не удалось прочитать. Текущие заметки оставлены в редакторе."); return; }
      if (dirty.current) { blocked.current = true; setStorageProblem({ kind: "conflict", raw }); setStatus("В другом окне или после синхронизации появились другие заметки. Ваши правки оставлены здесь; сохранение заменит предыдущую версию."); return; }
      lastStored.current = raw; setState(stored); setNow(Date.now()); setStatus("Получено обновлённое сохранение.");
    };
    window.addEventListener("storage", sync);
    window.addEventListener("goconc:solved-changed", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("goconc:solved-changed", sync); };
  }, [ready, selected]);
  useEffect(() => {
    if (!ready || !dirty.current || state.scenario !== selected) return;
    const timer = window.setTimeout(() => persist(state), 350);
    return () => window.clearTimeout(timer);
    // All saved fields are in state; persist intentionally reads this snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready, selected]);
  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      if (dirty.current) {
        const value = current.current;
        if (!blocked.current && loadCode(storageKey(value.scenario), "system-design") === lastStored.current) {
          const serialized = JSON.stringify(value); saveCode(storageKey(value.scenario), serialized, "system-design");
          if (loadCode(storageKey(value.scenario), "system-design") === serialized) { lastStored.current = serialized; dirty.current = false; }
        }
      }
    };
    window.addEventListener("pagehide", flush);
    return () => { flush(); window.removeEventListener("pagehide", flush); };
  }, [ready]);
  useEffect(() => {
    if (!ready || state.runningSince === null || state.completedAt !== null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ready, state.runningSince, state.completedAt]);
  useEffect(() => {
    if (ready && state.runningSince !== null && elapsedInterviewMs(state, now) >= totalInterviewMs(state)) {
      dirty.current = true; setState(pauseInterview(state, now));
    }
  }, [now, ready, state]);
  function change(value: InterviewState) { dirty.current = true; setState(value); setNow(Date.now()); setStatus("Есть несохранённые изменения."); setErrors([]); }
  function timed(action: (value: InterviewState, time: number) => InterviewState) { const time = Date.now(); const next = action(state, time); dirty.current = true; setState(next); setNow(time); persist(next); }
  const scenario = interviewScenarios.find(item => item.id === selected)!;
  const phase = interviewPhase(state, now);
  const elapsed = elapsedInterviewMs(state, now);
  const complete = state.completedAt !== null;
  const timeEditable = ready && elapsed === 0 && state.runningSince === null && !complete;
  if (!ready || state.scenario !== selected) return <p role="status">Загружаем сохранённую попытку…</p>;
  if (storageProblem?.kind === "malformed") return <section className={styles.panel}>
    <h2>Сохранение требует восстановления</h2><p role="alert">Формат попытки не удалось проверить. Редактор заблокирован, исходные данные не заменяются.</p>
    <button className={styles.button} onClick={() => download(`interview-${selected}-recovery.json`, storageProblem.raw ?? "", "application/json")}>Скачать исходные данные</button>
    <p>Можно выбрать другую задачу, сохранив повреждённую попытку для разбора.</p>
    <label className={activity.field}>Другая задача<select value={selected} onChange={event => { setReady(false); setSelected(event.target.value as InterviewScenarioId); }}>{interviewScenarios.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
  </section>;
  return <div>
    {storageProblem?.kind === "conflict" && <section className={styles.panel}>
      <h2>Появилась другая версия</h2><p role="alert">Автосохранение остановлено. Текущий текст не заменён. Скачайте свои правки или исходные данные, прежде чем загружать сохранённую версию.</p>
      <div className={styles.actions}><button className={styles.button} onClick={() => download(`interview-${selected}-draft.json`, JSON.stringify(interviewReport(state, Date.now()), null, 2), "application/json")}>Скачать текущие правки</button>
      <button className={styles.button} onClick={() => download(`interview-${selected}-other.json`, storageProblem.raw ?? "", "application/json")}>Скачать другую версию</button>
      <button className={styles.button} onClick={() => {
        const raw = loadCode(storageKey(selected), "system-design"); const stored = parseInterview(raw, selected);
        if (!stored) { setStatus("Другая версия не прошла проверку. Ваши правки оставлены в редакторе."); return; }
        dirty.current = false; blocked.current = false; lastStored.current = raw; setStorageProblem(null); setState(stored); setNow(Date.now()); setStatus("Загружена сохранённая версия вместо текущих правок.");
      }}>Загрузить сохранённую версию вместо текущих правок</button></div>
    </section>}
    <label className={activity.field}>Задача интервью<select value={selected} onChange={event => { if (dirty.current && !persist(state)) return; setReady(false); setSelected(event.target.value as InterviewScenarioId); }}>
      {interviewScenarios.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select></label>
    <section className={styles.panel}>
      <h2>{scenario.title}</h2><p>{scenario.brief}</p>
      <p>По умолчанию — 45 минут. До запуска можно изменить длительность этапов. Ручной переход пропускает оставшееся время текущего этапа. Длина заметок открывает следующие действия, но не проверяет качество ответа. Автоматической экспертной оценки и внешнего ИИ здесь нет.</p>
      <div className={activity.fields}>{interviewPhases.map((label, index) => <label key={label}>{label}, мин<input type="number" min={1} max={60} value={state.durations[index]} disabled={!timeEditable} onChange={event => { const value = event.currentTarget.valueAsNumber; if (Number.isFinite(value)) change({ ...state, durations: state.durations.map((old, position) => position === index ? Math.min(60, Math.max(1, Math.round(value))) : old) }); }} /></label>)}</div>
      <p role="timer" aria-label="Оставшееся время">Осталось {clock(totalInterviewMs(state) - elapsed)} из {totalInterviewMs(state) / 60_000} мин. {complete ? "Попытка завершена." : state.runningSince !== null ? "Таймер идёт, в том числе после закрытия вкладки." : "Таймер на паузе."}</p>
      <ol className={activity.phases}>{interviewPhases.map((label, index) => <li key={label} className={phase === index ? activity.active : undefined} aria-current={phase === index ? "step" : undefined}>{label}</li>)}</ol>
      <div className={styles.actions}>
        <button className={styles.button} disabled={complete || elapsed >= totalInterviewMs(state)} onClick={() => timed(state.runningSince === null ? resumeInterview : pauseInterview)}>{state.runningSince === null ? "Запустить / продолжить" : "Пауза"}</button>
        <button className={styles.button} disabled={complete || phase >= 4} onClick={() => timed(nextInterviewPhase)}>Перейти к следующему этапу</button>
        <button className={styles.button} onClick={() => persist(state)}>Сохранить сейчас</button>
      </div>
      <p role="status">{status}</p>
      {elapsed >= totalInterviewMs(state) && !complete && <p>Время закончилось. Заметки доступны; заполните самооценку и завершите отчёт.</p>}
    </section>
    {interviewPhases.map((label, index) => <section className={styles.panel} key={label}>
      <label className={activity.field}><strong>{index + 1}. {label}</strong><textarea rows={index === 2 ? 8 : 4} maxLength={100000} disabled={complete} value={state.notes[index]} onChange={event => change({ ...state, notes: state.notes.map((old, position) => position === index ? event.target.value : old) })} placeholder={index === 2 ? "Запишите путь запроса, хранение данных, границы транзакции и альтернативу. Не менее 40 символов для открытия нового условия." : "Запишите рассуждения, вопросы и допущения."} /></label>
    </section>)}
    <section className={styles.panel}>
      <h2>Изменившееся условие</h2>
      {state.changedConstraint ? <p className={activity.notice}>{scenario.change}</p> : <><p>Условие откроется после описания исходной архитектуры (40 символов) либо при переходе к этапу отказов.</p><button className={styles.button} disabled={!canRevealConstraint(state, now) || complete} onClick={() => timed(revealConstraint)}>Открыть новое условие</button></>}
      {state.changedConstraint && <label className={activity.field}>Что изменится в решении и чем вы заплатите за это?<textarea rows={6} maxLength={100000} disabled={complete} value={state.changedAnswer} onChange={event => change({ ...state, changedAnswer: event.target.value })} /></label>}
    </section>
    <section className={styles.panel}>
      <h2>Самооценка по шести критериям</h2><p>0 — не разобрано; 1 — замечено, но не обосновано; 2 — есть объяснение и пример; 3 — проверены альтернативы и границы. Оценку выбираете вы. Для каждого пункта укажите подтверждение из решения или то, чего не хватает.</p>
      {interviewCriteria.map((label, index) => <fieldset className={styles.checkpoint} key={label}><legend>{label}</legend>
        <label className={activity.field}>Ваша оценка<select disabled={complete} value={state.scores[index] ?? ""} onChange={event => change({ ...state, scores: state.scores.map((old, position) => position === index ? event.target.value === "" ? null : Number(event.target.value) : old) })}><option value="">Не оценено</option>{[0, 1, 2, 3].map(score => <option key={score} value={score}>{score}</option>)}</select></label>
        <label className={activity.field}>Подтверждение или пробел<textarea rows={2} maxLength={100000} disabled={complete} value={state.evidence[index]} onChange={event => change({ ...state, evidence: state.evidence.map((old, position) => position === index ? event.target.value : old) })} /></label>
      </fieldset>)}
      {errors.length > 0 && <ul role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
      {!complete ? <button className={styles.button} onClick={() => { const problems = interviewCompletionErrors(state); setErrors(problems); if (!problems.length) timed(completeInterview); }}>Завершить и подготовить отчёт</button> : <>
        <p>Отчёт завершён. Это ваши заметки и самооценка, а не подтверждение профессионального уровня. Его можно обсудить с преподавателем или коллегой.</p>
        <div className={styles.actions}>
          <button className={styles.button} onClick={() => download(`interview-${selected}.json`, JSON.stringify(interviewReport(state, Date.now()), null, 2), "application/json")}>Скачать JSON</button>
          <button className={styles.button} onClick={() => download(`interview-${selected}.md`, interviewMarkdown(state, Date.now()), "text/markdown;charset=utf-8")}>Скачать Markdown</button>
          <button className={styles.button} onClick={() => { const key = `interview-v1-archive-${selected}-${state.completedAt}`; const serialized = JSON.stringify(state); saveCode(key, serialized, "system-design"); if (loadCode(key, "system-design") !== serialized) { setStatus("Не удалось сохранить прежний отчёт. Скачайте его перед новой попыткой."); return; } change(createInterview(selected)); }}>Новая попытка с сохранением прежнего отчёта</button>
        </div>
      </>}
    </section>
  </div>;
}
