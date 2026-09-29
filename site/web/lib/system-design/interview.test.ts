import { describe, expect, it } from "vitest";
import { canRevealConstraint, completeInterview, createInterview, elapsedInterviewMs, interviewCompletionErrors, interviewMarkdown, interviewPhase, nextInterviewPhase, parseInterview, pauseInterview, resumeInterview, revealConstraint, totalInterviewMs } from "./interview";
describe("durable interview", () => {
  it("continues from timestamps on reload, excludes paused time and caps elapsed", () => {
    let state = resumeInterview(createInterview("booking"), 1000);
    state = parseInterview(JSON.stringify(state), "booking")!;
    expect(elapsedInterviewMs(state, 61_000)).toBe(60_000);
    state = pauseInterview(state, 61_000);
    expect(elapsedInterviewMs(state, 601_000)).toBe(60_000);
    state = resumeInterview(state, 601_000);
    expect(elapsedInterviewMs(state, 661_000)).toBe(120_000);
    expect(elapsedInterviewMs(state, 99_000_000)).toBe(totalInterviewMs(state));
  });
  it("moves through adjustable phases and only reveals the change after a baseline or the failure phase", () => {
    let state = createInterview("chat"); state.durations = [1, 2, 3, 4, 5];
    expect(canRevealConstraint(state, 0)).toBe(false); expect(revealConstraint(state, 0)).toBe(state);
    state = nextInterviewPhase(state, 0); expect(interviewPhase(state, 0)).toBe(1);
    state = nextInterviewPhase(state, 0); expect(canRevealConstraint(state, 0)).toBe(false);
    state = nextInterviewPhase(state, 0); expect(canRevealConstraint(state, 0)).toBe(true);
    expect(revealConstraint(state, 0).changedConstraint).toBe(true);
    const baseline = createInterview("booking"); baseline.notes[2] = "Архитектура с отдельным хранением операций и повторов.";
    expect(canRevealConstraint(baseline, 0)).toBe(true);
  });
  it("requires explicit self-rubric and produces a completed frozen report without judging prose", () => {
    const empty = createInterview("private-links"); expect(interviewCompletionErrors(empty).length).toBeGreaterThan(0);
    expect(completeInterview(empty, 100)).toBe(empty);
    const state = { ...empty, notes: ["", "", "Исходное решение описано, но его качество человек ещё должен проверить.", "", ""], changedConstraint: true, changedAnswer: "После отзыва проверяем доступ перед выдачей кэшированных данных.", scores: [0, 1, 2, 3, 2, 1], evidence: Array(6).fill("Есть вопросы для дальнейшего разбора.") };
    const done = completeInterview(resumeInterview(state, 1000), 61_000);
    expect(done.completedAt).toBe(61_000); expect(done.runningSince).toBeNull(); expect(resumeInterview(done, 100_000)).toBe(done);
    expect(interviewMarkdown(done, 61_000)).toContain("не экспертная оценка"); expect(parseInterview(JSON.stringify(done), "private-links")).toEqual(done);
  });
  it("rejects malformed, cross-scenario and invalid timer/rubric snapshots", () => {
    const state = createInterview("booking");
    expect(parseInterview("{oops", "booking")).toBeNull(); expect(parseInterview(JSON.stringify(state), "chat")).toBeNull();
    for (const patch of [{ durations: [0, 1, 2, 3, 4] }, { scores: [4, 0, 0, 0, 0, 0] }, { notes: [] }, { runningSince: -1 }, { completedAt: 100 }, { elapsedMs: 1e12 }]) expect(parseInterview(JSON.stringify({ ...state, ...patch }), "booking")).toBeNull();
  });
});
