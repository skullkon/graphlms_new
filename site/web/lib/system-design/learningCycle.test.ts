import { describe, expect, it } from "vitest";
import {
  learningCycles, createCycleProgress, canCheckCycle, checkCycle,
  editCycleProgress, parseCycleProgress, type LearningCycleDefinition,
} from "./learningCycle";

const cycle: LearningCycleDefinition = {
  chapterSlug: "fixture", title: "Fixture", prompt: "Fixture", hints: ["First", "Second"],
  options: ["Wrong", "Right", "Wrong too"], answer: 1,
  explanations: ["Wrong reason", "Right reason", "Other reason"], solution: "Solution",
  transfer: { prompt: "Transfer", answer: "Answer" },
};
const rationale = "Сначала проверю сохранённое состояние, затем безопасно повторю операцию.";

describe("learning cycle attempts", () => {
  it("requires a valid choice and forty trimmed characters before checking", () => {
    const initial = createCycleProgress();
    expect(canCheckCycle({ ...initial, choice: 1, draft: " ".repeat(80) }, cycle)).toBe(false);
    expect(canCheckCycle({ ...initial, choice: null, draft: rationale }, cycle)).toBe(false);
    expect(canCheckCycle({ ...initial, choice: 9, draft: rationale }, cycle)).toBe(false);
    expect(canCheckCycle({ ...initial, choice: 1, draft: "x".repeat(39) }, cycle)).toBe(false);
    expect(canCheckCycle({ ...initial, choice: 1, draft: "x".repeat(40) }, cycle)).toBe(true);
    expect(checkCycle(initial, cycle, 100)).toEqual(initial);
  });

  it("records a wrong attempt separately from a passed choice and retains hints", () => {
    const wrong = checkCycle({ ...createCycleProgress(), draft: rationale, choice: 0, hints: 1 }, cycle, 100);
    expect(wrong).toMatchObject({ checked: true, passed: false, attemptedAt: 100, hints: 1 });
    const revised = editCycleProgress(wrong, { choice: 1 });
    expect(revised).toMatchObject({ checked: false, passed: false, attemptedAt: 100, hints: 1 });
    expect(checkCycle(revised, cycle, 200)).toMatchObject({ checked: true, passed: true, attemptedAt: 200 });
  });

  it("clears stale correctness when either the rationale or choice changes", () => {
    const passed = { ...createCycleProgress(), draft: rationale, choice: 1, checked: true, passed: true, attemptedAt: 100 };
    expect(editCycleProgress(passed, { draft: "Теперь я выбрал другое объяснение и хочу его проверить." }))
      .toMatchObject({ checked: false, passed: false });
    expect(editCycleProgress(passed, { choice: 0 })).toMatchObject({ checked: false, passed: false });
  });

  it("reloads a legitimate checked attempt but never trusts an inconsistent passed flag", () => {
    const saved = { draft: rationale, choice: 1, hints: 1, checked: true, passed: true, attemptedAt: 100 };
    expect(parseCycleProgress(JSON.stringify(saved), cycle)).toEqual(saved);
    expect(parseCycleProgress(JSON.stringify({ ...saved, choice: 0 }), cycle)?.passed).toBe(false);
    expect(parseCycleProgress(JSON.stringify({ ...saved, draft: "short" }), cycle)?.passed).toBe(false);
    expect(parseCycleProgress(JSON.stringify({ ...saved, checked: false }), cycle)?.passed).toBe(false);
    expect(parseCycleProgress(JSON.stringify({ ...saved, attemptedAt: null }), cycle)?.passed).toBe(false);
  });

  it("rejects malformed fields and out-of-range persisted choices", () => {
    expect(parseCycleProgress("{broken", cycle)).toBeNull();
    expect(parseCycleProgress("[]", cycle)).toBeNull();
    expect(parseCycleProgress(JSON.stringify({ ...createCycleProgress(), choice: -1 }), cycle)).toBeNull();
    expect(parseCycleProgress(JSON.stringify({ ...createCycleProgress(), hints: 99 }), cycle)).toBeNull();
    expect(parseCycleProgress(JSON.stringify({ ...createCycleProgress(), checked: "yes" }), cycle)).toBeNull();
    expect(parseCycleProgress(null, cycle)).toEqual(createCycleProgress());
  });

  it("covers all chapter routes with usable choices and feedback for each choice", () => {
    expect(learningCycles.map(c => c.chapterSlug)).toEqual([
      "01-foundations", "02-http", "03-data", "04-capacity", "05-load", "06-cache",
      "07-replication", "08-partitioning", "09-events", "10-realtime", "11-media",
      "12-security", "13-reliability", "14-evolution", "15-design-review", "16-interviews",
    ]);
    for (const c of learningCycles) {
      expect(c.options.length).toBeGreaterThanOrEqual(3);
      expect(c.options.length).toBeLessThanOrEqual(4);
      expect(c.explanations).toHaveLength(c.options.length);
      expect(c.answer).toBeGreaterThanOrEqual(0);
      expect(c.answer).toBeLessThan(c.options.length);
      expect(c.hints.length).toBeGreaterThanOrEqual(2);
      expect(c.hints.length).toBeLessThanOrEqual(3);
      const result = checkCycle({ ...createCycleProgress(), draft: rationale, choice: c.answer }, c, 100);
      expect(result.passed).toBe(true);
    }
  });
});
