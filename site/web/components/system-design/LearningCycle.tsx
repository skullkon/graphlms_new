"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadCode, saveCode } from "@/lib/progress";
import {
  learningCycles, createCycleProgress, canCheckCycle, checkCycle, editCycleProgress,
  parseCycleProgress, type CycleProgress, type LearningCycleDefinition,
} from "@/lib/system-design/learningCycle";
import styles from "./course.module.css";

export function LearningCycle({ chapterSlug }: { chapterSlug: string }) {
  const cycle = learningCycles.find(item => item.chapterSlug === chapterSlug);
  return cycle ? <CyclePanel key={chapterSlug} cycle={cycle} /> : null;
}

function CyclePanel({ cycle }: { cycle: LearningCycleDefinition }) {
  const [progress, setProgress] = useState<CycleProgress>(createCycleProgress);
  const [ready, setReady] = useState(false);
  const savedRaw = useRef<string | null>(null);
  const savedTransfer = useRef<string | null>(null);
  const [blocked, setBlocked] = useState<{ kind: "corrupt" | "conflict"; raw: string | null } | null>(null);
  const [transferBlocked, setTransferBlocked] = useState(false);
  const [status, setStatus] = useState("");
  const [transferDraft, setTransferDraft] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [showTransferAnswer, setShowTransferAnswer] = useState(false);
  const key = `cycle-${cycle.chapterSlug}`;
  const transferKey = `cycle-transfer-${cycle.chapterSlug}`;
  const rationaleId = `cycle-rationale-${cycle.chapterSlug}`;
  const transferId = `cycle-transfer-draft-${cycle.chapterSlug}`;

  useEffect(() => {
    const raw = loadCode(key, "system-design");
    savedRaw.current = raw;
    const restored = parseCycleProgress(raw, cycle);
    if (restored) setProgress(restored);
    else {
      setBlocked({ kind: "corrupt", raw });
      setStatus("Не удалось прочитать сохранённую попытку. Скачайте исходную запись перед восстановлением.");
    }
    const transfer = loadCode(transferKey, "system-design");
    savedTransfer.current = transfer;
    setTransferDraft(transfer ?? "");
    setReady(true);
  }, [cycle, key, transferKey]);

  function writeProgress(next: CycleProgress) {
    setProgress(next);
    const serialized = JSON.stringify(next);
    saveCode(key, serialized, "system-design");
    const saved = loadCode(key, "system-design") === serialized;
    if (saved) savedRaw.current = serialized;
    setStatus(saved ? "Попытка сохранена."
      : "Не удалось сохранить попытку. Ответ остаётся на экране: скопируйте его перед закрытием страницы или повторите сохранение.");
  }

  function persist(next: CycleProgress) {
    setProgress(next);
    if (blocked) return;
    const current = loadCode(key, "system-design");
    if (current !== savedRaw.current) {
      setBlocked({ kind: "conflict", raw: current });
      setStatus("Сохранённая попытка изменилась в другом окне или после синхронизации. Ваш черновик оставлен на экране, запись не перезаписана. Скачайте его перед загрузкой сохранённой версии.");
      return;
    }
    writeProgress(next);
  }

  function reloadProgress() {
    const raw = loadCode(key, "system-design");
    savedRaw.current = raw;
    const restored = parseCycleProgress(raw, cycle);
    if (!restored) {
      setBlocked({ kind: "corrupt", raw });
      setStatus("Сохранённая запись повреждена. Ваш текст остаётся на экране; скачайте нужные версии перед восстановлением.");
      return;
    }
    setProgress(restored);
    setBlocked(null);
    setStatus("Загружена сохранённая попытка.");
  }

  function resetCorrupt() {
    const raw = loadCode(key, "system-design");
    if (raw !== savedRaw.current) {
      setBlocked({ kind: "conflict", raw });
      setStatus("Сохранённая попытка изменилась после чтения. Загрузите её, прежде чем создавать новую.");
      return;
    }
    setBlocked(null);
    writeProgress(createCycleProgress());
  }

  function saveTransfer(value: string) {
    setTransferDraft(value);
    setShowTransferAnswer(false);
    if (transferBlocked) return;
    if (loadCode(transferKey, "system-design") !== savedTransfer.current) {
      setTransferBlocked(true);
      setTransferStatus("Сохранённый ответ изменился в другом окне. Ваш текст оставлен на экране; скачайте его перед загрузкой сохранённой версии.");
      return;
    }
    saveCode(transferKey, value, "system-design");
    const saved = loadCode(transferKey, "system-design") === value;
    if (saved) savedTransfer.current = value;
    setTransferStatus(saved ? "Ответ сохранён."
      : "Не удалось сохранить ответ. Скопируйте его перед закрытием страницы или повторите сохранение.");
  }

  const canCheck = ready && !blocked && canCheckCycle(progress, cycle);
  const showSolution = progress.checked && progress.attemptedAt !== null && canCheck;
  const stage = progress.checked
    ? (progress.passed ? "Выбор проверен: верно." : "Попытка проверена: пересмотрите выбор.")
    : progress.attemptedAt !== null ? "Ответ изменён после попытки: проверьте его снова."
      : progress.draft || progress.choice !== null ? "Черновик: проверка ещё не выполнена." : "Сценарий ещё не проверен.";

  return <section className={styles.panel} aria-label="Практический сценарий">
    <h2>Сценарий: {cycle.title}</h2>
    <p>{cycle.prompt}</p>
    <p>{stage} Подсказок открыто: {progress.hints} из {cycle.hints.length}.</p>
    <p>Сначала объясните ожидаемое состояние своими словами, затем выберите ответ. Автомат проверяет вариант, а не качество вашего объяснения. Это упражнение не отмечает всю главу завершённой.</p>

    {progress.hints > 0 && <ol aria-label="Открытые подсказки">
      {cycle.hints.slice(0, progress.hints).map(hint => <li key={hint}>{hint}</li>)}
    </ol>}
    <button type="button" className={styles.button} disabled={!ready || !!blocked || progress.hints >= cycle.hints.length}
      onClick={() => persist({ ...progress, hints: Math.min(cycle.hints.length, progress.hints + 1) })}>
      Следующая подсказка
    </button>

    <p><label htmlFor={rationaleId}><strong>Ваше объяснение</strong></label></p>
    <p id={`${rationaleId}-help`}>Опишите, что произойдёт и почему. Для открытия проверки нужно не менее 40 символов без пробелов по краям; длина текста не является оценкой понимания.</p>
    <textarea id={rationaleId} name="rationale" aria-describedby={`${rationaleId}-help`} rows={5}
      value={progress.draft} disabled={!ready || blocked?.kind === "corrupt"}
      onChange={event => persist(editCycleProgress(progress, { draft: event.target.value }))}
      placeholder="Какое состояние останется? Какие действия его объясняют?" />

    <fieldset className={styles.checkpoint} disabled={!ready || blocked?.kind === "corrupt"}>
      <legend>Выберите результат</legend>
      {cycle.options.map((option, index) => <label key={option} className={styles.option}>
        <input type="radio" name={`cycle-choice-${cycle.chapterSlug}`} value={index}
          checked={progress.choice === index}
          onChange={() => persist(editCycleProgress(progress, { choice: index }))} />
        {option}
      </label>)}
    </fieldset>
    <div className={styles.actions}>
      <button type="button" className={styles.button} disabled={!canCheck}
        onClick={() => persist(checkCycle(progress, cycle, Date.now()))}>Проверить выбор</button>
      <button type="button" className={styles.button} disabled={!ready || !!blocked}
        onClick={() => persist(progress)}>Сохранить ещё раз</button>
    </div>
    <p role="status">{status}</p>
    {blocked && <div>
      <p>Автосохранение приостановлено. Загрузка сохранённой версии заменит текст на экране; сначала скачайте нужный черновик.</p>
      <div className={styles.actions}>
        <a download={`${key}-draft.json`} href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(progress, null, 2))}`}>Скачать мой черновик</a>
        {blocked.raw !== null && <a download={`${key}-stored.json`} href={`data:application/json;charset=utf-8,${encodeURIComponent(blocked.raw)}`}>Скачать сохранённую запись</a>}
        <button type="button" className={styles.button} onClick={reloadProgress}>Загрузить сохранённую попытку</button>
        {blocked.kind === "corrupt" && <button type="button" className={styles.button} onClick={resetCorrupt}>Начать новую попытку вместо повреждённой</button>}
      </div>
    </div>}

    {showSolution && <div aria-live="polite">
      <h3>{progress.passed ? "Верный выбор" : "Что не сходится"}</h3>
      <p>{cycle.explanations[progress.choice!]}</p>
      <h3>Разбор состояния</h3>
      <p>{cycle.solution}</p>
      <p>Сравните разбор со своим объяснением. Верный вариант сам по себе не доказывает, что все предпосылки учтены. При изменении ответа потребуется новая проверка.</p>

      <h3>Перенесите решение на другое условие</h3>
      <p>{cycle.transfer.prompt}</p>
      <label htmlFor={transferId}>Что вы измените и почему?</label>
      <textarea id={transferId} name="transfer" rows={4} value={transferDraft}
        onChange={event => saveTransfer(event.target.value)} />
      <p>Запишите не менее 40 символов, затем сравните ответ с разбором. Автоматической оценки этого ответа нет.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} disabled={transferDraft.trim().length < 40}
          onClick={() => setShowTransferAnswer(true)}>Открыть разбор нового условия</button>
        <button type="button" className={styles.button} onClick={() => saveTransfer(transferDraft)}>Сохранить ответ на новое условие</button>
      </div>
      <p role="status">{transferStatus}</p>
      {transferBlocked && <div className={styles.actions}>
        <a download={`${transferKey}.txt`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(transferDraft)}`}>Скачать мой ответ на новое условие</a>
        <button type="button" className={styles.button} onClick={() => {
          const raw = loadCode(transferKey, "system-design");
          savedTransfer.current = raw;
          setTransferDraft(raw ?? "");
          setTransferBlocked(false);
          setShowTransferAnswer(false);
          setTransferStatus("Загружен сохранённый ответ.");
        }}>Загрузить сохранённый ответ на новое условие</button>
      </div>}
      {showTransferAnswer && <p><strong>Разбор нового условия.</strong> {cycle.transfer.answer}</p>}
    </div>}
  </section>;
}
