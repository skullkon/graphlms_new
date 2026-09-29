"use client";
import { useEffect, useRef, useState } from "react";
import { loadCode, saveCode, recordLearningEvent, useLearningEvents } from "@/lib/progress";
import type { Checkpoint } from "@/lib/system-design/checkpoints";
import styles from "./course.module.css";

export function Notebook({ id, checkpoint, project = false }: { id: string; checkpoint?: Checkpoint; project?: boolean }) {
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const dirty = useRef(false);
  const savedValue = useRef("");
  const events = useLearningEvents();
  const completed = ready && (loadCode(`check-${id}`, "system-design") === "passed" || events.some(e => e.type === "completed" && e.courseId === "system-design" && e.itemId === `system-design:chapter:${id}`));
  useEffect(() => {
    const sync = () => {
      const stored = loadCode(id, "system-design") ?? "";
      if (!dirty.current) { savedValue.current = stored; setDraft(stored); }
      else if (stored !== savedValue.current) setStatus("Сохранённый ответ изменился в другом окне или после синхронизации. Ваши правки оставлены здесь; сохранение заменит предыдущий ответ.");
    };
    sync(); setReady(true);
    window.addEventListener("goconc:solved-changed", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("goconc:solved-changed", sync); window.removeEventListener("storage", sync); };
  }, [id]);
  function save() {
    savedValue.current = draft;
    dirty.current = true;
    saveCode(id, draft, "system-design");
    const saved = loadCode(id, "system-design") === draft;
    dirty.current = !saved;
    setStatus(saved ? "Сохранено в этом браузере." : "Не удалось сохранить. Скопируйте ответ перед закрытием страницы.");
    if (saved) recordLearningEvent("artifact_saved", id, { courseId: "system-design" });
  }
  function check() {
    setChecked(true);
    if (checkpoint && choice === checkpoint.answer) {
      saveCode(`check-${id}`, "passed", "system-design");
      recordLearningEvent("completed", `system-design:chapter:${id}`, { courseId: "system-design", eventId: `completed:system-design:chapter:${id}` });
    }
  }
  return <section className={styles.panel} aria-label="Рабочая тетрадь">
    {checkpoint && <fieldset className={styles.checkpoint}><legend>Проверьте себя</legend><p>{checkpoint.question}</p>
      {checkpoint.options.map((option, index) => <label key={option} className={styles.option}><input type="radio" name={`checkpoint-${id}`} checked={choice === index} onChange={() => { setChoice(index); setChecked(false); }} />{option}</label>)}
      <button className={styles.button} disabled={choice === null} onClick={check}>Проверить ответ</button>
      <div aria-live="polite">{checked && <p>{choice === checkpoint.answer ? "Верно. " : "Пока не сходится. "}{checkpoint.explain}</p>}{completed && <p>Проверочный вопрос пройден. Практические задания стоит выполнить отдельно.</p>}</div>
    </fieldset>}
    <label htmlFor={`draft-${id}`}><strong>{project ? "Ваше решение" : "Заметки и решение задания"}</strong></label>
    <p>Запишите ход рассуждений, расчёты и вопросы. Сохраните текст перед уходом со страницы. После входа в аккаунт ответ участвует в общей синхронизации прогресса. Автоматической оценки архитектуры здесь нет.</p>
    <textarea id={`draft-${id}`} value={draft} disabled={!ready} onChange={e => { dirty.current = true; setDraft(e.target.value); setStatus("Есть несохранённые изменения."); }} rows={project ? 16 : 7} placeholder="Сценарий → требования → решение → расчёты → отказы → что проверить" />
    <div className={styles.actions}><button className={styles.button} onClick={save} disabled={!ready}>Сохранить ответ</button><span role="status">{status}</span></div>
  </section>;
}
