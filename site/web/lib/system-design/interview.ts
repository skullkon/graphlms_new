export type InterviewScenarioId = "booking" | "chat" | "private-links";
export const interviewScenarios = [
  { id: "booking" as const, title: "Запись на интенсив", brief: "Клуб открывает 2 000 мест. В первые 10 минут ожидается 500 попыток записи в секунду. Повторы и одновременные заявки не должны увеличивать вместимость. Спроектируйте API, данные, допуск нагрузки и восстановление после неизвестного исхода.", change: "Платёжный провайдер стал отвечать в 10 раз медленнее. Оплата иногда подтверждается после истечения удержания места. Обновите состояния процесса и правила компенсации." },
  { id: "chat" as const, title: "Групповой чат", brief: "В Клубе 10 000 одновременных подключений, 500 сообщений в секунду и до 200 участников группы. История хранится 90 дней. После разрыва связи нужно восстановить пропуски, не показывая дубли. Определите границу порядка и подтверждения.", change: "Один публичный автор получил 100 000 подписчиков. Большинство читают с задержкой, а часть устройств отключена дольше 90 дней. Пересмотрите доставку, ленту и восстановление истории." },
  { id: "private-links" as const, title: "Закрытые ссылки", brief: "Клуб хранит миллион коротких ссылок: пик 2 000 переходов и 20 созданий в секунду. Закрытые материалы доступны участникам курса. Изменение каталога должно появляться за 60 секунд. Спроектируйте идентификаторы, кэш и отзыв доступа.", change: "Одна ссылка получает 70% переходов, а право пользователя нужно отозвать не позднее 10 секунд. Кэш периодически недоступен. Объясните, что меняется в пути чтения и защите базы." },
];
export const interviewPhases = ["Уточнить требования", "Оценить нагрузку", "Предложить архитектуру", "Разобрать отказы и новое условие", "Проверить решение"] as const;
export const interviewCriteria = [
  "Требования: пользователи, действия и границы задачи названы",
  "Расчёты: единицы, допущения и пик нагрузки объяснены",
  "Данные: ключи, состояния и критические инварианты определены",
  "Отказы: повторы, неизвестный исход и восстановление разобраны",
  "Компромиссы: альтернативы и цена нового условия объяснены",
  "Проверка: права, наблюдение и проверочные эксперименты предусмотрены",
];
export interface InterviewState {
  version: 1;
  scenario: InterviewScenarioId;
  durations: number[];
  elapsedMs: number;
  runningSince: number | null;
  notes: string[];
  changedConstraint: boolean;
  changedAnswer: string;
  scores: (number | null)[];
  evidence: string[];
  completedAt: number | null;
}
export function createInterview(scenario: InterviewScenarioId): InterviewState {
  return { version: 1, scenario, durations: [5, 10, 15, 10, 5], elapsedMs: 0, runningSince: null, notes: ["", "", "", "", ""], changedConstraint: false, changedAnswer: "", scores: Array(6).fill(null), evidence: Array(6).fill(""), completedAt: null };
}
export function totalInterviewMs(state: InterviewState): number { return state.durations.reduce((sum, value) => sum + value, 0) * 60_000; }
export function elapsedInterviewMs(state: InterviewState, now: number): number {
  return Math.min(totalInterviewMs(state), state.elapsedMs + (state.runningSince === null ? 0 : Math.max(0, now - state.runningSince)));
}
export function interviewPhase(state: InterviewState, now: number): number {
  const elapsed = elapsedInterviewMs(state, now); let boundary = 0;
  for (let i = 0; i < state.durations.length; i++) { boundary += state.durations[i] * 60_000; if (elapsed < boundary) return i; }
  return state.durations.length - 1;
}
export function resumeInterview(state: InterviewState, now: number): InterviewState {
  if (state.completedAt !== null || state.runningSince !== null || elapsedInterviewMs(state, now) >= totalInterviewMs(state)) return state;
  return { ...state, runningSince: now };
}
export function pauseInterview(state: InterviewState, now: number): InterviewState {
  return { ...state, elapsedMs: elapsedInterviewMs(state, now), runningSince: null };
}
export function nextInterviewPhase(state: InterviewState, now: number): InterviewState {
  if (state.completedAt !== null) return state;
  const phase = interviewPhase(state, now);
  const boundary = state.durations.slice(0, phase + 1).reduce((sum, value) => sum + value, 0) * 60_000;
  return { ...state, elapsedMs: boundary, runningSince: state.runningSince === null ? null : now };
}
export function canRevealConstraint(state: InterviewState, now: number): boolean {
  return state.notes[2].trim().length >= 40 || interviewPhase(state, now) >= 3;
}
export function revealConstraint(state: InterviewState, now: number): InterviewState {
  return canRevealConstraint(state, now) ? { ...state, changedConstraint: true } : state;
}
export function interviewCompletionErrors(state: InterviewState): string[] {
  const errors: string[] = [];
  if (state.notes[2].trim().length < 40) errors.push("Опишите исходную архитектуру: не менее 40 символов.");
  if (!state.changedConstraint) errors.push("Откройте изменённое условие.");
  if (state.changedAnswer.trim().length < 40) errors.push("Объясните изменение решения: не менее 40 символов.");
  if (state.scores.some(value => value === null || !Number.isInteger(value) || value < 0 || value > 3)) errors.push("Укажите самооценку по всем шести критериям.");
  if (state.evidence.some(value => value.trim().length < 10)) errors.push("Добавьте подтверждение или пробел по каждому критерию: не менее 10 символов.");
  return errors;
}
export function completeInterview(state: InterviewState, now: number): InterviewState {
  if (interviewCompletionErrors(state).length) return state;
  return { ...pauseInterview(state, now), completedAt: state.completedAt ?? now };
}
export function parseInterview(raw: string | null, expected: InterviewScenarioId): InterviewState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as InterviewState;
    const finiteTime = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;
    const texts = (array: unknown, length: number) => Array.isArray(array) && array.length === length && array.every(item => typeof item === "string" && item.length <= 100_000);
    if (!value || value.version !== 1 || value.scenario !== expected || !Array.isArray(value.durations) || value.durations.length !== 5
      || !value.durations.every(n => Number.isInteger(n) && n >= 1 && n <= 60) || !finiteTime(value.elapsedMs)
      || (value.runningSince !== null && !finiteTime(value.runningSince)) || (value.completedAt !== null && !finiteTime(value.completedAt))
      || !texts(value.notes, 5) || !texts(value.evidence, 6) || typeof value.changedConstraint !== "boolean" || typeof value.changedAnswer !== "string" || value.changedAnswer.length > 100_000
      || !Array.isArray(value.scores) || value.scores.length !== 6 || !value.scores.every(n => n === null || (Number.isInteger(n) && n >= 0 && n <= 3))) return null;
    if (value.elapsedMs > totalInterviewMs(value) || (value.completedAt !== null && (value.runningSince !== null || interviewCompletionErrors(value).length > 0))) return null;
    return value;
  } catch { return null; }
}
export function interviewReport(state: InterviewState, now: number) {
  return { ...pauseInterview(state, now), exportedAt: new Date(now).toISOString(), scenarioTitle: interviewScenarios.find(item => item.id === state.scenario)!.title,
    assessment: "Самооценка автора; автоматическая экспертная оценка не выполнялась.", criteria: interviewCriteria };
}
export function interviewMarkdown(state: InterviewState, now: number): string {
  const scenario = interviewScenarios.find(item => item.id === state.scenario)!;
  return [`# Интервью: ${scenario.title}`, scenario.brief, `Статус: ${state.completedAt === null ? "черновик" : "завершено"}. По шкале этапов использовано ${Math.floor(elapsedInterviewMs(state, now) / 60_000)} мин. Ручной переход пропускает остаток этапа.`, ...interviewPhases.map((title, index) => `## ${title}\n\n${state.notes[index]}`), "## Изменённое условие", state.changedConstraint ? scenario.change : "Ещё не открыто", state.changedAnswer, "## Самооценка", "Это самооценка автора, не экспертная оценка системы.", ...interviewCriteria.map((criterion, index) => `- ${criterion}: ${state.scores[index] ?? "не оценено"}/3. ${state.evidence[index]}`)].join("\n\n");
}
