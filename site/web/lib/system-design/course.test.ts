import { describe, expect, it } from "vitest";
import { getBookChapters, getAllTaskMeta, getTaskContent } from "../content";
import { getLearningItems, getTaskLearningContext } from "../learning";
import { checkpoints } from "./checkpoints";

describe("system design course integration", () => {
  it("loads the complete ordered course and a valid checkpoint for each chapter", () => {
    const chapters = getBookChapters("system-design");
    expect(chapters.map(c => c.order)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    expect(new Set(chapters.map(c => c.slug)).size).toBe(16);
    for (const chapter of chapters) {
      const check = checkpoints[chapter.order - 1];
      expect(check.options[check.answer]).toBeTruthy();
      expect(check.explain).toBeTruthy();
      expect(chapter.body).not.toMatch(/<details/);
    }
  });
  it("connects every project to its intended chapter instead of its task number", () => {
    const chapters = getBookChapters("system-design");
    const projects = getAllTaskMeta("system-design");
    expect(projects).toHaveLength(8);
    for (const project of projects) {
      expect(chapters.some(c => c.slug === project.chapterSlug)).toBe(true);
      expect(getTaskLearningContext(`system-design:task:${project.id}`)?.theory?.href).toBe(`/system-design/book/${project.chapterSlug}`);
      expect(getTaskContent(project.slug, "system-design")?.problem).toContain("Как проверить решение");
    }
  });
  it("keeps navigation and skills scoped to the new course", () => {
    const items = getLearningItems("system-design");
    const ids = new Set(items.map(i => i.id));
    for (const item of items) {
      expect(item.href.startsWith("/system-design/")).toBe(true);
      expect(item.relatedSkills).toContain("system-design");
      for (const prerequisite of item.prerequisites) expect(ids.has(prerequisite)).toBe(true);
    }
  });
});
