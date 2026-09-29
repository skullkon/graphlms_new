import { describe, expect, it } from "vitest";
import { getBookChapters } from "@/lib/content";
import { getHardPart, getHardParts } from "./hardParts";
import { hardCheckpoints } from "./hardCheckpoints";
import { getLearningItem } from "../learning";

const expected = ["consistency", "consensus", "transactions", "delivery", "hot-keys", "overload", "multiregion", "migrations"];
describe("system-design hard parts", () => {
  it("loads eight independent ordered blocks with valid prerequisites and checkpoints", () => {
    const parts = getHardParts();
    const chapters = new Set(getBookChapters("system-design").map(chapter => chapter.slug));
    expect(parts.map(part => part.slug)).toEqual(expected);
    expect(parts.map(part => part.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const part of parts) {
      expect(part.title.length).toBeGreaterThan(0);
      expect(part.summary.length).toBeGreaterThan(0);
      expect(part.body.trim().length).toBeGreaterThan(0);
      expect(part.prerequisites.length).toBeGreaterThan(0);
      expect(part.prerequisites.every(slug => chapters.has(slug))).toBe(true);
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
});
