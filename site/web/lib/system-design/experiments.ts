/** Teaching models: decimal bytes; queue snapshots are taken at slot boundaries. */
export interface CapacityInput {
  dau: number;
  requestsPerUser: number;
  peakFactor: number;
  responseBytes: number;
}
function finiteNonnegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
}
export function capacity(input: CapacityInput) {
  for (const [name, value] of Object.entries(input)) finiteNonnegative(value, name);
  if (input.peakFactor < 1) throw new RangeError("peakFactor must be at least 1");
  const dailyRequests = input.dau * input.requestsPerUser;
  const averageRps = dailyRequests / 86_400;
  const peakRps = averageRps * input.peakFactor;
  const peakBytesPerSecond = peakRps * input.responseBytes;
  const dailyResponseBytes = dailyRequests * input.responseBytes;
  for (const value of [dailyRequests, averageRps, peakRps, peakBytesPerSecond, dailyResponseBytes]) {
    if (!Number.isFinite(value)) throw new RangeError("Capacity estimate overflow");
  }
  return { dailyRequests, averageRps, peakRps, peakBytesPerSecond, dailyResponseBytes };
}
export interface QueueConfig {
  arrivalPerSecond: number;
  servicePerSecond: number;
  buffer: number;
  duration: number;
}
export interface QueueState {
  second: number;
  arrived: number;
  accepted: number;
  processed: number;
  dropped: number;
  queued: number;
}
export function emptyQueue(): QueueState {
  return { second: 0, arrived: 0, accepted: 0, processed: 0, dropped: 0, queued: 0 };
}
export function queueStep(state: QueueState, config: QueueConfig): QueueState {
  for (const [name, value] of Object.entries(config)) {
    finiteNonnegative(value, name);
    if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer`);
  }
  if (state.second >= config.duration) return state;
  // Existing FIFO work and this slot's arrivals may complete within this slot.
  // Only work remaining at the boundary consumes buffer capacity.
  const available = state.queued + config.arrivalPerSecond;
  const completed = Math.min(available, config.servicePerSecond);
  const queued = Math.min(available - completed, config.buffer);
  const dropped = available - completed - queued;
  return {
    second: state.second + 1,
    arrived: state.arrived + config.arrivalPerSecond,
    accepted: state.accepted + config.arrivalPerSecond - dropped,
    processed: state.processed + completed,
    dropped: state.dropped + dropped,
    queued,
  };
}
