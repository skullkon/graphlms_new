export interface StageEvidence {
  checks: boolean[];
  notes: string;
  completedAt?: string;
}
export interface BackendProgress {
  schema: 1;
  stages: Record<string, StageEvidence>;
  projectUrl: string;
}
export const BACKEND_PROGRESS_KEY = "graphlms.backend-path.v1";
export function emptyBackendProgress(): BackendProgress { return { schema: 1, stages: {}, projectUrl: "" }; }

/** Reject broken storage so the UI can preserve and export it before any write. */
export function parseBackendProgress(raw: string | null, criteria: Record<string, number>): BackendProgress {
  if (!raw) return emptyBackendProgress();
  const data = JSON.parse(raw);
  if (!data || data.schema !== 1 || !data.stages || typeof data.stages !== "object" || Array.isArray(data.stages)
    || typeof data.projectUrl !== "string" || data.projectUrl.length > 2000) throw new Error("Неизвестный формат сохранённых отметок");
  const stages: Record<string, StageEvidence> = {};
  for (const [slug, count] of Object.entries(criteria)) {
    const saved = data.stages[slug];
    if (saved === undefined) continue;
    if (!saved || !Array.isArray(saved.checks) || saved.checks.some((check: unknown) => typeof check !== "boolean")
      || typeof saved.notes !== "string" || saved.notes.length > 8000) throw new Error("Повреждены отметки этапа");
    stages[slug] = {
      checks: Array.from({ length: count }, (_, i) => saved.checks[i] === true),
      notes: saved.notes,
      completedAt: typeof saved.completedAt === "string" && !Number.isNaN(Date.parse(saved.completedAt)) ? saved.completedAt : undefined,
    };
  }
  return { schema: 1, stages, projectUrl: data.projectUrl };
}
export function backendStageComplete(progress: BackendProgress, slug: string): boolean {
  const stage = progress.stages[slug];
  return Boolean(stage && stage.checks.length > 0 && stage.checks.every(check => check === true) && stage.notes.trim());
}
