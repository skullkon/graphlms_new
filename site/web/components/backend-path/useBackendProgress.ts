"use client";
import { useCallback, useEffect, useState } from "react";
import { BACKEND_PROGRESS_KEY, emptyBackendProgress, parseBackendProgress, type BackendProgress, type StageEvidence } from "@/lib/backend-path/progress";
const CHANGED = "graphlms-backend-path-changed";
export function downloadPathReport(progress: BackendProgress, raw?: string) {
  const blob = new Blob([raw ?? JSON.stringify({ ...progress, assessment: "self-reported", exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "graphlms-backend-path.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function useBackendProgress(criteria: Record<string, number>) {
  const [progress, setProgress] = useState(emptyBackendProgress);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => {
      try { setProgress(parseBackendProgress(window.localStorage.getItem(BACKEND_PROGRESS_KEY), criteria)); setError(""); }
      catch { setError("Не удалось прочитать сохранённые отметки. Запись сохранена без изменений: экспортируйте её перед восстановлением. Новые отметки пока не записываются."); }
      setReady(true);
    };
    load(); window.addEventListener("storage", load); window.addEventListener(CHANGED, load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener(CHANGED, load); };
  }, [criteria]);
  const save = useCallback((slug: string | null, evidence?: StageEvidence, projectUrl?: string) => {
    try {
      const current = parseBackendProgress(window.localStorage.getItem(BACKEND_PROGRESS_KEY), criteria);
      const next = { ...current, stages: { ...current.stages } };
      if (slug && evidence) next.stages[slug] = evidence;
      if (projectUrl !== undefined) next.projectUrl = projectUrl;
      window.localStorage.setItem(BACKEND_PROGRESS_KEY, JSON.stringify(next));
      setProgress(next); setError(""); window.dispatchEvent(new Event(CHANGED)); return true;
    } catch { setError("Не удалось сохранить отметки. Текст остаётся на странице; сохранённая запись не заменена. Проверьте доступ к хранилищу браузера и экспортируйте данные."); return false; }
  }, [criteria]);
  const exportReport = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(BACKEND_PROGRESS_KEY);
      downloadPathReport(progress, error && raw ? raw : undefined);
    } catch { setError("Не удалось экспортировать запись. Скопируйте свои заметки перед закрытием страницы."); }
  }, [progress, error]);
  return { progress, error, ready, save, exportReport };
}
