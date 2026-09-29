import { describe, expect, it } from "vitest";
import { createFailure, failureDone, failureInvariant, predictionReady, transitionFailure } from "./scenarios";
const finish = (state: ReturnType<typeof createFailure>) => { for (let i = 0; i < 4; i++) state = transitionFailure(state); return state; };
describe("failure experiments", () => {
  it("shows duplicated effect after lost response and preserves a single effect with atomic deduplication", () => {
    const naive = finish(createFailure("lost-response"));
    const safe = finish(createFailure("lost-response", true));
    expect(naive.effects).toBe(2); expect(failureInvariant(naive).ok).toBe(false);
    expect(safe.effects).toBe(1); expect(failureInvariant(safe).ok).toBe(true);
    expect(safe.client).toBe("Ответ получен"); expect(failureDone(safe)).toBe(true);
    expect(transitionFailure(safe)).toBe(safe);
  });
  it("both stale readers pass but atomic admission rejects the second writer", () => {
    let state = createFailure("last-seat"); state = transitionFailure(transitionFailure(state));
    expect(state.readA).toBe(1); expect(state.readB).toBe(1); expect(state.seats).toBe(1);
    const naive = finish(state); const safe = finish(createFailure("last-seat", true));
    expect(naive.bookings).toEqual(["A", "B"]); expect(naive.seats).toBe(-1);
    expect(failureInvariant(naive).ok).toBe(false); expect(safe.bookings).toEqual(["A"]);
    expect(failureInvariant(safe).ok).toBe(true);
  });
  it("exposes lag, allows delivery injection, then converges without changing primary", () => {
    const written = transitionFailure(createFailure("replica-lag"));
    const stale = transitionFailure(written);
    expect(stale.observed).toBe(1); expect(failureInvariant(stale).ok).toBe(false);
    const delivered = transitionFailure(written, "replicate");
    expect(delivered.step).toBe(1); expect(transitionFailure(delivered).observed).toBe(2);
    expect(transitionFailure(transitionFailure(createFailure("replica-lag", true))).observed).toBe(2);
    expect(failureInvariant(finish(stale)).ok).toBe(true);
    expect(written.replica).toBe(1); // transitions do not mutate snapshots
  });
  it("requires a prediction and resets all state", () => {
    expect(predictionReady("  ")).toBe(false); expect(predictionReady("1234567890123456789")).toBe(false);
    expect(predictionReady("Два клиента получат одно место")).toBe(true);
    expect(createFailure("last-seat").log).toEqual([]);
  });
});
