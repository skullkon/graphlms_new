import { describe, expect, it } from "vitest";
import { parseReviews, scheduleReview, readCycleCompletion, firstReviewDue, reviewStoreProblem } from "./reviews";
describe("retrieval practice scheduling", () => {
  it("schedules a first recall, advances consecutive successful self-reviews and resets a forgotten topic", () => {
    const answer = "Подтверждение могло потеряться после сохранения записи.";
    const one = scheduleReview(undefined, "03-data", answer, "good", 1000);
    const two = scheduleReview(one, "03-data", answer, "good", one.dueAt);
    expect(one.dueAt - 1000).toBe(86400000);
    expect(two.dueAt - two.reviewedAt).toBe(3 * 86400000);
    expect(scheduleReview(two, "03-data", answer, "again", two.dueAt).level).toBe(0);
    expect(() => scheduleReview(one, "03-data", "", "good", 2000)).toThrow();
  });
  it("does not interpret viewed solutions or corrupt records as completed practice", () => {
    expect(readCycleCompletion('{"passed":true}', 1)).toBeNull();
    expect(readCycleCompletion(JSON.stringify({ passed: true, checked: true, choice: 1, draft: "x".repeat(40), attemptedAt: 123 }), 1)).toBe(123);
    expect(readCycleCompletion(JSON.stringify({passed:true,checked:true,choice:0,draft:"x".repeat(40),attemptedAt:123}),1)).toBeNull();
    expect(firstReviewDue(123)).toBe(86400123);
    expect(parseReviews("broken").records).toEqual({});
    expect(reviewStoreProblem("broken")).not.toBeNull();
    expect(reviewStoreProblem(JSON.stringify({version:2,records:{}}))).not.toBeNull();
    expect(reviewStoreProblem(null)).toBeNull();
    expect(parseReviews(JSON.stringify({ version: 1, records: { "03-data": { chapterSlug: "03-data", level: 99 } } })).records).toEqual({});
  });
  it("round trips saved work without dropping the learner's answer", () => {
    const record = scheduleReview(undefined, "03-data", "Собственный ответ ученика должен сохраняться целиком.", "again", 500);
    expect(parseReviews(JSON.stringify({ version: 1, records: { "03-data": record } })).records["03-data"]).toEqual(record);
  });
});
