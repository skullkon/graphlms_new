"use client";
import React, { useEffect, useState } from "react";
import type { BackendStage } from "@/lib/backend-path/content";
import { backendStageComplete } from "@/lib/backend-path/progress";
import { useBackendProgress } from "./useBackendProgress";
import styles from "./path.module.css";

export function BackendCheckpoint({ stage, criteria }: { stage: BackendStage; criteria: Record<string, number> }) {
  const { progress, error, ready, save, exportReport } = useBackendProgress(criteria);
  const [checks, setChecks] = useState(stage.checkpoint.map(() => false));
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const stored = progress.stages[stage.slug];
    setChecks(stored?.checks ?? stage.checkpoint.map(() => false)); setNotes(stored?.notes ?? "");
  // Load the draft on first storage read and on navigation; edits remain local until Save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stage.slug]);
  const complete = backendStageComplete(progress, stage.slug);
  return <section className={styles.panel} aria-label="Самопроверка этапа">
    <h2>Самопроверка этапа</h2>
    <p>Отмечайте результат после своей проверки. Открытие главы ничего не завершает. Отметки сохраняются в этом браузере и не являются независимой аттестацией.</p>
    {error && <p role="alert">{error}</p>}
    <fieldset className={styles.checks}><legend>Что выполнено</legend>{stage.checkpoint.map((criterion, index) => <label key={criterion}><input type="checkbox" checked={checks[index] ?? false} onChange={event => { setChecks(checks.map((value, i) => i === index ? event.target.checked : value)); setSaved(false); }} /> <span>{criterion}</span></label>)}</fieldset>
    <label className={styles.field}>Что получилось и чем вы это проверили<textarea rows={4} maxLength={8000} value={notes} onChange={event => { setNotes(event.target.value); setSaved(false); }} placeholder="Команда проверки, результат и объяснение своими словами" /></label>
    <div className={styles.actions}><button type="button" className={styles.button} disabled={!ready || Boolean(error)} onClick={() => {
      const completedAt = checks.every(Boolean) && notes.trim() ? new Date().toISOString() : undefined;
      setSaved(save(stage.slug, { checks, notes, completedAt }));
    }}>Сохранить самопроверку</button><button type="button" className={styles.secondary} onClick={exportReport}>Экспортировать отметки</button></div>
    <p role="status">{complete ? "Этап отмечен как выполненный по вашей самопроверке." : saved ? "Черновик сохранён. Для завершения отметьте все критерии и добавьте объяснение." : "Для завершения отметьте все критерии и добавьте объяснение."}</p>
  </section>;
}
