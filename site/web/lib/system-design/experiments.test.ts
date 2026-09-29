import { describe, expect, it } from "vitest";
import { capacity, emptyQueue, queueStep } from "./experiments";

describe("capacity units", () => {
  it("converts daily actions to RPS and decimal bytes without applying peak to daily volume", () => {
    const result = capacity({ dau: 86_400, requestsPerUser: 10, peakFactor: 3, responseBytes: 1000 });
    expect(result).toEqual({ dailyRequests: 864_000, averageRps: 10, peakRps: 30, peakBytesPerSecond: 30_000, dailyResponseBytes: 864_000_000 });
  });
  it("handles no traffic and rejects invalid estimates", () => {
    expect(capacity({ dau: 0, requestsPerUser: 5, peakFactor: 2, responseBytes: 100 }).peakRps).toBe(0);
    for (const dau of [-1, NaN, Infinity]) {
      expect(() => capacity({ dau, requestsPerUser: 5, peakFactor: 2, responseBytes: 100 })).toThrow();
    }
    expect(() => capacity({ dau: 1, requestsPerUser: 1, peakFactor: 0, responseBytes: 1 })).toThrow();
  });
});
describe("finite queue", () => {
  it("fills, rejects overload, preserves conservation at every boundary and stops", () => {
    const config = { arrivalPerSecond: 10, servicePerSecond: 4, buffer: 10, duration: 20 };
    let state = emptyQueue();
    for (let i = 0; i < config.duration; i++) {
      state = queueStep(state, config);
      expect(state.accepted).toBe(state.processed + state.queued);
      expect(state.arrived).toBe(state.accepted + state.dropped);
      expect(state.queued).toBeLessThanOrEqual(config.buffer);
    }
    expect(state).toEqual({ second: 20, arrived: 200, accepted: 90, processed: 80, dropped: 110, queued: 10 });
    expect(queueStep(state, config)).toBe(state);
  });
  it("serves directly with zero buffer and drains pending work when arrivals stop", () => {
    const config = { arrivalPerSecond: 10, servicePerSecond: 4, buffer: 0, duration: 10 };
    expect(queueStep(emptyQueue(), config)).toMatchObject({ processed: 4, accepted: 4, dropped: 6, queued: 0 });
    let state = queueStep(emptyQueue(), { ...config, buffer: 10 });
    state = queueStep(state, { ...config, arrivalPerSecond: 0, buffer: 10 });
    expect(state).toMatchObject({ accepted: 10, processed: 8, queued: 2, dropped: 0 });
  });
  it("handles a stopped consumer, zero duration, and rejects fractional rates", () => {
    const config = { arrivalPerSecond: 3, servicePerSecond: 0, buffer: 2, duration: 1 };
    expect(queueStep(emptyQueue(), config)).toMatchObject({ processed: 0, queued: 2, dropped: 1 });
    expect(queueStep(emptyQueue(), { ...config, duration: 0 })).toEqual(emptyQueue());
    expect(() => queueStep(emptyQueue(), { ...config, arrivalPerSecond: 0.5 })).toThrow();
  });
});
