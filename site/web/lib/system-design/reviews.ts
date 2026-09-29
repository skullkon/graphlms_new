export type ReviewRating = "again" | "good";
export type ReviewRecord = { chapterSlug: string; level: number; dueAt: number; reviewedAt: number; answer: string; rating: ReviewRating };
export type ReviewStore = { version: 1; records: Record<string, ReviewRecord> };
export const REVIEW_KEY = "sd-reviews-v1";
const DAY = 86_400_000;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
export function emptyReviews(): ReviewStore { return { version: 1, records: {} }; }
export function parseReviews(raw: string | null): ReviewStore {
  if (!raw) return emptyReviews();
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !value.records || typeof value.records !== "object" || Array.isArray(value.records)) return emptyReviews();
    const records: Record<string, ReviewRecord> = {};
    for (const [slug, r] of Object.entries(value.records) as [string, any][]) {
      if (!/^[0-9]{2}-[a-z-]+$/.test(slug) || r?.chapterSlug !== slug || !Number.isInteger(r.level) || r.level < 0 || r.level >= REVIEW_INTERVALS.length || !Number.isFinite(r.dueAt) || !Number.isFinite(r.reviewedAt) || r.dueAt < 0 || r.reviewedAt < 0 || typeof r.answer !== "string" || !["again", "good"].includes(r.rating)) continue;
      records[slug] = { chapterSlug: slug, level: r.level, dueAt: r.dueAt, reviewedAt: r.reviewedAt, answer: r.answer, rating: r.rating };
    }
    return { version: 1, records };
  } catch { return emptyReviews(); }
}
export function scheduleReview(previous: ReviewRecord | undefined, chapterSlug: string, answer: string, rating: ReviewRating, now: number): ReviewRecord {
  if (!Number.isFinite(now) || now < 0 || answer.trim().length < 40) throw new Error("Для повторения нужен собственный ответ.");
  const level = rating === "again" ? 0 : previous?.rating === "good" ? Math.min(previous.level + 1, REVIEW_INTERVALS.length - 1) : 0;
  return { chapterSlug, answer, rating, level, reviewedAt: now, dueAt: now + REVIEW_INTERVALS[level] * DAY };
}
export function firstReviewDue(attemptedAt: number): number { return attemptedAt + DAY; }
export function readCycleCompletion(raw: string | null, answer: number): number | null {
  try { const v = JSON.parse(raw ?? "null"); return v?.passed === true && v.checked === true && Number.isInteger(answer) && v.choice === answer && typeof v.draft === "string" && v.draft.trim().length >= 40 && Number.isFinite(v.attemptedAt) && v.attemptedAt >= 0 ? v.attemptedAt : null; } catch { return null; }
}
export function reviewStoreProblem(raw: string | null): string | null {
  if (raw === null) return null;
  try {
    const v=JSON.parse(raw);
    if(v?.version!==1 || !v.records || typeof v.records!=="object" || Array.isArray(v.records) || Object.keys(parseReviews(raw).records).length!==Object.keys(v.records).length) throw new Error();
    return null;
  } catch { return "Сохранённое расписание имеет неизвестный или повреждённый формат. Оно не перезаписано. Скачайте исходные данные для восстановления."; }
}
