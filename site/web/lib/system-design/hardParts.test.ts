import { describe, expect, it } from "vitest";
import { getBookChapters } from "@/lib/content";
import { getHardPart, getHardParts, getHardPartPrerequisite } from "./hardParts";
import { hardCheckpoints } from "./hardCheckpoints";
import { getLearningItem } from "../learning";
import { renderMarkdown } from "../markdown";

const expected = ["network-foundations", "transport-proxies", "storage-engines", "transactions", "isolation", "consistency", "consensus", "delivery", "hot-keys", "overload", "batch-stream", "migrations", "multiregion", "search", "ledger", "architecture-cases"];
describe("system-design hard parts", () => {
  it("loads the engineering path with valid prerequisites and checkpoints", () => {
    const parts = getHardParts();
    const chapters = new Set(getBookChapters("system-design").map(chapter => chapter.slug));
    expect(parts.map(part => part.slug)).toEqual(expected);
    expect(parts.map(part => part.order)).toEqual(Array.from({length: 16}, (_, i) => i + 1));
    for (const part of parts) {
      expect(part.title.length).toBeGreaterThan(0);
      expect(part.summary.length).toBeGreaterThan(0);
      expect(part.body.trim().length).toBeGreaterThan(0);
      expect(part.prerequisites.length).toBeGreaterThan(0);
      expect(part.prerequisites.every(slug => chapters.has(slug) || parts.some(other => other.slug === slug && other.order < part.order))).toBe(true);
      expect(chapters.has(part.slug)).toBe(false);
      const checkpoint = hardCheckpoints[part.slug];
      expect(checkpoint).toBeDefined();
      expect(checkpoint.options.length).toBeGreaterThanOrEqual(3);
      expect(checkpoint.answer).toBeGreaterThanOrEqual(0);
      expect(checkpoint.answer).toBeLessThan(checkpoint.options.length);
      expect(checkpoint.explain.length).toBeGreaterThan(50);
      expect(getHardPart(part.slug)).toEqual(part);
      expect(getLearningItem(`system-design:chapter:hard-part-${part.slug}`)?.href).toBe(`/system-design/hard-parts/${part.slug}`);
    }
  });
  it("does not resolve unknown blocks or paths outside the catalog", () => {
    expect(getHardPart("missing")).toBeNull();
    expect(getHardPart("../../courses")).toBeNull();
  });
  it("links foundation and engineering prerequisites to their actual collections", () => {
    expect(getHardPartPrerequisite("02-http")?.href).toBe("/system-design/book/02-http");
    expect(getHardPartPrerequisite("delivery")?.href).toBe("/system-design/hard-parts/delivery");
    expect(getHardPartPrerequisite("../../courses")).toBeNull();
    const ledger = getLearningItem("system-design:chapter:hard-part-ledger");
    expect(ledger?.prerequisites).toContain("system-design:chapter:hard-part-isolation");
    expect(ledger?.prerequisites).toContain("system-design:chapter:03-data");
  });
  it("renders every foundation and engineering lesson with the actual pipeline", async () => {
    for (const lesson of [...getBookChapters("system-design"), ...getHardParts()]) {
      const html = await renderMarkdown(lesson.body);
      expect(html, lesson.slug).toContain("<h2");
    }
  });
});
