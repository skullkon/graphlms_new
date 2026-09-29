import type { LearningEvent } from "./progress";

export interface ResumeItem {
  /** Event itemId: chapter registry ID, or raw task ID. */
  id: string;
  href: string;
  title: string;
  kind: "chapter" | "task";
  courseId: string;
}

/** Resolve stored history through the current server-provided catalog only. */
export function findLearningResume(
  events: LearningEvent[],
  items: ResumeItem[],
): ResumeItem | null {
  let latest: ResumeItem | null = null;
  let latestTime = -Infinity;
  for (const event of events) {
    if (event.type !== "started" && event.type !== "completed") continue;
    const time = Date.parse(event.at);
    if (!Number.isFinite(time) || time <= latestTime) continue;
    const item = items.find(
      (candidate) =>
        candidate.id === event.itemId &&
        candidate.courseId === (event.courseId ?? "go") &&
        candidate.href.startsWith("/") &&
        !candidate.href.startsWith("//") &&
        !/[\\\u0000-\u0020]/.test(candidate.href),
    );
    if (!item) continue;
    latest = item;
    latestTime = time;
  }
  return latest;
}
