"use client";

import { useId, useState, type CSSProperties } from "react";
import { capacity, emptyQueue, queueStep, type CapacityInput, type QueueConfig } from "@/lib/system-design/experiments";

const panel: CSSProperties = { padding: 20, margin: "24px 0", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", background: "var(--bg-elevated)", color: "var(--text-primary)" };
const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };
const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", padding: 8, marginTop: 4, color: "var(--text-primary)", background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderRadius: 4 };
const buttonStyle: CSSProperties = { padding: "8px 12px", border: "1px solid var(--border-default)", borderRadius: 4, background: "var(--bg-canvas)", color: "var(--text-primary)", cursor: "pointer" };
const format = (value: number) => value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

function NumberField({ label, value, onChange, min = 0, max = 1_000_000 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return <label style={{ fontSize: 14 }}>{label}<input type="number" value={value} min={min} max={max} step={1} style={inputStyle} onChange={(event) => {
    const next = event.currentTarget.valueAsNumber;
    if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, Math.round(next))));
  }} /></label>;
}

export function Experiments({ kind }: { kind: "capacity" | "queue" }) {
  return kind === "capacity" ? <CapacityExperiment /> : <QueueExperiment />;
}

function CapacityExperiment() {
  const titleId = useId();
  const [input, setInput] = useState<CapacityInput>({ dau: 100_000, requestsPerUser: 20, peakFactor: 5, responseBytes: 2000 });
  const result = capacity(input);
  const update = (key: keyof CapacityInput) => (value: number) => setInput((previous) => ({ ...previous, [key]: value }));
  return <section aria-labelledby={titleId} style={panel}>
    <h3 id={titleId}>Оцените нагрузку по действиям пользователей</h3>
    <p>Сколько запросов в секунду придётся обслуживать на пике? Измените одно допущение и сравни результат.</p>
    <div style={grid}>
      <NumberField label="Активных пользователей в сутки (DAU)" value={input.dau} max={1_000_000_000} onChange={update("dau")} />
      <NumberField label="Запросов на пользователя в сутки" value={input.requestsPerUser} onChange={update("requestsPerUser")} />
      <NumberField label="Пиковая нагрузка / средняя, раз" value={input.peakFactor} min={1} max={100} onChange={update("peakFactor")} />
      <NumberField label="Размер ответа, байт" value={input.responseBytes} max={1_000_000_000} onChange={update("responseBytes")} />
    </div>
    <dl style={grid} aria-live="polite" aria-atomic="true">
      <div><dt>Средняя нагрузка</dt><dd>{format(result.averageRps)} запросов/с</dd></div>
      <div><dt>Пиковая нагрузка</dt><dd>{format(result.peakRps)} запросов/с</dd></div>
      <div><dt>Исходящий поток на пике</dt><dd>{format(result.peakBytesPerSecond / 1_000_000)} МБ/с</dd></div>
      <div><dt>Объём ответов за сутки</dt><dd>{format(result.dailyResponseBytes / 1_000_000_000)} ГБ</dd></div>
    </dl>
    <p style={{ fontSize: 14 }}>Средний RPS = DAU × запросов на пользователя / 86 400. Пиковый RPS = средний RPS × коэффициент пика. Поток = RPS × размер ответа.</p>
    <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>МБ = 1 000 000 байт, ГБ = 1 000 000 000 байт. Считаем одинаковый размер ответов без сжатия, заголовков и повторов. Объём ответов — сетевой трафик за сутки; из него нельзя вывести объём базы данных. Коэффициент пика не умножает суточный объём.</p>
  </section>;
}

function QueueExperiment() {
  const titleId = useId();
  const [config, setConfig] = useState<QueueConfig>({ arrivalPerSecond: 10, servicePerSecond: 6, buffer: 20, duration: 10 });
  const [state, setState] = useState(emptyQueue);
  const update = (key: keyof QueueConfig) => (value: number) => {
    setConfig((previous) => ({ ...previous, [key]: value }));
    setState(emptyQueue());
  };
  return <section aria-labelledby={titleId} style={panel}>
    <h3 id={titleId}>Когда заполнится очередь?</h3>
    <p>Если запросы приходят быстрее, чем воркеры успевают их обработать, буфер заполняется. Предскажите первую секунду с отказами и проверьте по шагам.</p>
    <div style={grid}>
      <NumberField label="Приходит запросов в секунду" value={config.arrivalPerSecond} max={1000} onChange={update("arrivalPerSecond")} />
      <NumberField label="Обрабатывается запросов в секунду" value={config.servicePerSecond} max={1000} onChange={update("servicePerSecond")} />
      <NumberField label="Мест в буфере" value={config.buffer} max={10000} onChange={update("buffer")} />
      <NumberField label="Длительность опыта, секунд" value={config.duration} min={1} max={120} onChange={update("duration")} />
    </div>
    <p style={{ fontSize: 14 }}>Изменение параметров начинает опыт заново. Один шаг равен одной секунде: воркеры обслуживают старые и новые запросы, оставшиеся занимают буфер, избыток отклоняется. Снимок сделан на границе секунд; незавершённой обработки в этой модели нет.</p>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" style={{ ...buttonStyle, opacity: state.second >= config.duration ? 0.5 : 1 }} disabled={state.second >= config.duration} onClick={() => setState((previous) => queueStep(previous, config))}>Шаг: +1 секунда</button>
      <button type="button" style={buttonStyle} onClick={() => setState(emptyQueue())}>Сбросить</button>
    </div>
    <div aria-live="polite" aria-atomic="true">
      <p>Прошло {state.second} из {config.duration} секунд{state.second >= config.duration ? ". Опыт завершён." : "."}</p>
      <dl style={grid}>
        <div><dt>Пришло всего</dt><dd>{state.arrived}</dd></div>
        <div><dt>Принято всего</dt><dd>{state.accepted}</dd></div>
        <div><dt>Обработано всего</dt><dd>{state.processed}</dd></div>
        <div><dt>Отклонено всего</dt><dd>{state.dropped}</dd></div>
        <div><dt>Сейчас в очереди</dt><dd>{state.queued} из {config.buffer}</dd></div>
      </dl>
      <p>Баланс запросов: {state.accepted} принято = {state.processed} обработано + {state.queued} в очереди. Ещё {state.dropped} отклонено.</p>
    </div>
    <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Отказ при заполнении буфера — выбранная политика защиты от перегрузки. Автоматических повторов нет. Буфер увеличивает время до отказов, но не скорость воркеров. Реальные запросы занимают разное время; здесь все скорости постоянны.</p>
  </section>;
}
