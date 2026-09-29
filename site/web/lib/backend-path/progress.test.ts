import { describe, expect, it } from "vitest";
import { backendStageComplete, emptyBackendProgress, parseBackendProgress } from "./progress";
const criteria = { "01-start": 2, "02-http": 3 };
describe("backend path self-assessment", () => {
  it("does not treat reading or an empty checklist as completed work", () => {
    expect(backendStageComplete(emptyBackendProgress(), "01-start")).toBe(false);
    expect(backendStageComplete({ schema: 1, projectUrl: "", stages: { "01-start": { checks: [], notes: "Opened the page" } } }, "01-start")).toBe(false);
  });
  it("requires every check and an explanation before completing a stage", () => {
    const progress = parseBackendProgress(JSON.stringify({ schema: 1, projectUrl: "", stages: { "01-start": { checks: [true, true], notes: "Ran the test and explained word counting" } } }), criteria);
    expect(backendStageComplete(progress, "01-start")).toBe(true);
    progress.stages["01-start"].checks[1] = false;
    expect(backendStageComplete(progress, "01-start")).toBe(false);
    progress.stages["01-start"].checks[1] = true;
    progress.stages["01-start"].notes = "  ";
    expect(backendStageComplete(progress, "01-start")).toBe(false);
  });
  it("pads changed checklists with unchecked criteria instead of awarding completion", () => {
    const progress = parseBackendProgress(JSON.stringify({ schema: 1, stages: { "02-http": { checks: [true], notes: "old criteria" } }, projectUrl: "" }), criteria);
    expect(progress.stages["02-http"].checks).toEqual([true, false, false]);
    expect(backendStageComplete(progress, "02-http")).toBe(false);
  });
  it("does not overwrite malformed or unsupported stored data silently", () => {
    expect(() => parseBackendProgress("broken", criteria)).toThrow();
    expect(() => parseBackendProgress(JSON.stringify({ schema: 7, stages: {}, projectUrl: "" }), criteria)).toThrow();
    expect(() => parseBackendProgress(JSON.stringify({ schema: 1, stages: { "01-start": { checks: ["true"], notes: "x" } }, projectUrl: "" }), criteria)).toThrow();
  });
  it("ignores foreign stage IDs and preserves known notes and repository URL", () => {
    const progress = parseBackendProgress(JSON.stringify({ schema: 1, stages: { foreign: { checks: [true], notes: "not this path" }, "01-start": { checks: [false, true], notes: "my test", completedAt: "2026-09-30T10:00:00Z" } }, projectUrl: "https://example.com/repo" }), criteria);
    expect(Object.keys(progress.stages)).toEqual(["01-start"]);
    expect(progress.projectUrl).toBe("https://example.com/repo");
    expect(progress.stages["01-start"].notes).toBe("my test");
  });
});
