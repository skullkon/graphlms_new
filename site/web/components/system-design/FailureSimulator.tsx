"use client";
import { useState } from "react";
import { createFailure, failureDone, failureInvariant, failureScenarios, predictionReady, transitionFailure, type FailureKind } from "@/lib/system-design/scenarios";
import styles from "./course.module.css";

export function FailureSimulator() {
  const [kind, setKind] = useState<FailureKind>("lost-response");
  const [safe, setSafe] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [state, setState] = useState(() => createFailure("lost-response"));
  const scenario = failureScenarios.find(item => item.id === kind)!;
  const invariant = failureInvariant(state);
  const started = state.step > 0;
  const reset = (nextKind = kind, nextSafe = safe) => { setKind(nextKind); setSafe(nextSafe); setState(createFailure(nextKind, nextSafe)); setPrediction(""); };
  return <section className={styles.panel} aria-label="Пошаговые модели отказов">
    <h2>Предскажите результат сбоя</h2>
    <p>Выберите сценарий и способ обработки. Запишите прогноз не короче 20 символов: что увидит клиент и что останется в данных? Изменение сценария сбрасывает опыт.</p>
    <label>Сценарий <select value={kind} onChange={event => reset(event.target.value as FailureKind, false)}>{failureScenarios.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <fieldset className={styles.checkpoint}><legend>Способ обработки</legend>{scenario.variants.map((label, index) => <label className={styles.option} key={label}><input type="radio" name="failure-variant" checked={safe === (index === 1)} onChange={() => reset(kind, index === 1)} />{label}</label>)}</fieldset>
    <p><strong>План опыта:</strong> {scenario.plan}</p>
    <label htmlFor="failure-prediction">Ваш прогноз</label><textarea id="failure-prediction" value={prediction} disabled={started} onChange={event => setPrediction(event.target.value)} rows={3} />
    {!started && <p>{prediction.trim().length}/20 символов. Длина открывает запуск, но не оценивает правильность прогноза.</p>}
    <div className={styles.actions}>
      <button className={styles.button} disabled={!predictionReady(prediction) || failureDone(state)} onClick={() => setState(current => transitionFailure(current))}>Следующий шаг</button>
      {kind === "replica-lag" && <button className={styles.button} disabled={!started || state.primary === state.replica || failureDone(state)} onClick={() => setState(current => transitionFailure(current, "replicate"))}>Доставить репликацию сейчас</button>}
      <button className={styles.button} onClick={() => reset()}>Сбросить опыт</button>
    </div>
    <div aria-live="polite" aria-atomic="true">
      <h3>Состояние после шага {state.step} из 4</h3>
      <p>Клиент: {state.client}.</p>
      {kind === "lost-response" && <p>Сервер: эффектов {state.effects}. Сохранённый ключ K: {state.storedKey ? "есть" : "нет"}.</p>}
      {kind === "last-seat" && <p>Клиент A прочитал: {state.readA ?? "ещё не читал"}; B: {state.readB ?? "ещё не читал"}. База: остаток {state.seats}, записаны {state.bookings.join(", ") || "никто"}.</p>}
      {kind === "replica-lag" && <p>Основной узел: v{state.primary}. Реплика: v{state.replica}. Последнее чтение: {state.observed === null ? "не выполнялось" : `v${state.observed}`}.</p>}
      <p><strong>{invariant.ok ? "Условие пока не нарушено." : "Условие нарушено."}</strong> {invariant.text}</p>
      {failureDone(state) && <p>Опыт завершён. Сравните результат со своим прогнозом, затем повторите с другим способом обработки.</p>}
    </div>
    <h3>Журнал</h3>{state.log.length ? <ol>{state.log.map((entry, index) => <li key={index}>{entry}</li>)}</ol> : <p>Пока нет событий.</p>}
    <p><strong>Границы модели:</strong> {scenario.assumptions}</p>
  </section>;
}
