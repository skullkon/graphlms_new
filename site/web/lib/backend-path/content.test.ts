import { describe, expect, it } from "vitest";
import { getBackendStage, getBackendStages } from "./content";
import { renderMarkdown } from "../markdown";
describe("free backend path", () => {
  it("offers eight ordered milestones with actual practice and completion criteria", () => {
    const stages = getBackendStages();
    expect(stages).toHaveLength(8);
    expect(stages.map(stage => stage.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(stages.map(stage => stage.slug)).size).toBe(8);
    for (const stage of stages) {
      expect(stage.checkpoint.length, stage.slug).toBeGreaterThanOrEqual(3);
      expect(stage.summary.length, stage.slug).toBeGreaterThan(20);
      expect(stage.body.trim(), stage.slug).not.toBe("");
    }
  });
  it("resolves only catalog slugs instead of opening arbitrary paths", () => {
    expect(getBackendStage("../../courses.json")).toBeNull();
    expect(getBackendStage("01-start")?.order).toBe(1);
  });
  it("renders every milestone with the actual Markdown pipeline", async () => {
    for (const stage of getBackendStages()) {
      expect(await renderMarkdown(stage.body)).toContain("<h2");
    }
  });
});
