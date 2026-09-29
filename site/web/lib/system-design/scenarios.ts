export type FailureKind = "lost-response" | "last-seat" | "replica-lag";
export interface FailureState {
  kind: FailureKind;
  safe: boolean;
  step: number;
  log: string[];
  effects: number;
  storedKey: boolean;
  client: string;
  seats: number;
  readA: number | null;
  readB: number | null;
  bookings: string[];
  primary: number;
  replica: number;
  observed: number | null;
}
export const failureScenarios: { id: FailureKind; title: string; plan: string; variants: [string, string]; assumptions: string }[] = [
  { id: "lost-response", title: "Ответ потерялся после записи", plan: "Сервер выполнит операцию, первый ответ потеряется, клиент повторит тот же запрос K и получит следующий ответ.", variants: ["Каждая попытка создаёт эффект", "Ключ K и эффект сохраняются атомарно"], assumptions: "Один клиент, одна база, один ключ K. Во втором варианте ключ и результат хранятся весь опыт. Внешние платежи модель не охватывает." },
  { id: "last-seat", title: "Два клиента занимают последнее место", plan: "A и B сначала увидят одно свободное место. Затем A попытается записаться, за ним — B.", variants: ["Раздельные проверка и запись", "Атомарная проверка остатка при записи"], assumptions: "Одно место, одна согласованная база. При атомарной операции отказ B — корректный результат, а не ошибка доступности." },
  { id: "replica-lag", title: "Чтение после записи отстаёт", plan: "Основной узел сохранит v2. Реплика пока останется на v1. Вы можете доставить запись до чтения или после него и сравнить ответы.", variants: ["Читать реплику", "Читать основной узел"], assumptions: "Один основной узел и одна асинхронная реплика. Запись подтверждается локально; основной узел в этом опыте не падает. Чтение направляется выбранному узлу." },
];
export function createFailure(kind: FailureKind, safe = false): FailureState {
  return { kind, safe, step: 0, log: [], effects: 0, storedKey: false, client: "Ожидает действия", seats: 1, readA: null, readB: null, bookings: [], primary: 1, replica: 1, observed: null };
}
export function predictionReady(value: string): boolean { return value.trim().length >= 20; }
export function failureDone(state: FailureState): boolean { return state.step >= 4; }
export function transitionFailure(state: FailureState, action: "step" | "replicate" = "step"): FailureState {
  if (failureDone(state)) return state;
  const next = { ...state, log: [...state.log], bookings: [...state.bookings] };
  if (action === "replicate") {
    if (state.kind !== "replica-lag" || state.primary === state.replica) return state;
    next.replica = state.primary;
    next.log.push(`Доставка репликации: реплика применила v${next.replica}.`);
    return next;
  }
  next.step += 1;
  if (state.kind === "lost-response") {
    if (state.step === 0) {
      next.effects = 1; next.storedKey = state.safe; next.client = "Запрос K отправлен, исход ещё неизвестен";
      next.log.push(state.safe ? "Сервер атомарно сохранил эффект и результат K." : "Сервер сохранил первый эффект; ключ повтора не хранится.");
    } else if (state.step === 1) {
      next.client = "Таймаут: неизвестно, выполнилась ли операция"; next.log.push("Первый ответ потерян в сети. Данные сервера не откатились.");
    } else if (state.step === 2) {
      const duplicate = state.safe && state.storedKey;
      next.effects += duplicate ? 0 : 1;
      next.client = "Повтор K отправлен, ждём ответ";
      next.log.push(duplicate ? "Повтор K нашёл сохранённый результат: нового эффекта нет." : "Повтор K создал второй эффект.");
    } else { next.client = "Ответ получен"; next.log.push(`Ответ доставлен. Всего бизнес-эффектов: ${next.effects}.`); }
  } else if (state.kind === "last-seat") {
    if (state.step === 0) { next.readA = state.seats; next.log.push(`A прочитал остаток: ${state.seats}.`); }
    else if (state.step === 1) { next.readB = state.seats; next.log.push(`B прочитал остаток: ${state.seats}.`); }
    else {
      const who = state.step === 2 ? "A" : "B";
      const staleRead = who === "A" ? state.readA : state.readB;
      const accepted = state.safe ? state.seats > 0 : (staleRead ?? 0) > 0;
      if (accepted) { next.seats -= 1; next.bookings.push(who); }
      next.log.push(accepted ? `${who} записан. Остаток: ${next.seats}.` : `${who} получил отказ: мест больше нет.`);
      next.client = `Последний результат: ${who} ${accepted ? "записан" : "получил отказ"}`;
    }
  } else {
    if (state.step === 0) { next.primary = 2; next.client = "Запись v2 подтверждена"; next.log.push("Основной узел сохранил v2 и подтвердил запись. Реплика пока v1."); }
    else if (state.step === 2) { next.replica = state.primary; next.log.push(`Репликация доставлена: теперь v${next.replica}.`); }
    else {
      next.observed = state.safe ? state.primary : state.replica;
      next.client = `Чтение вернуло v${next.observed}`;
      next.log.push(`Чтение ${state.safe ? "основного узла" : "реплики"} вернуло v${next.observed}.`);
    }
  }
  return next;
}
export function failureInvariant(state: FailureState): { ok: boolean; text: string } {
  if (state.kind === "lost-response") return { ok: state.effects <= 1, text: `Один логический запрос должен давать не более одного эффекта. Сейчас: ${state.effects}.` };
  if (state.kind === "last-seat") return { ok: state.bookings.length <= 1 && state.seats >= 0, text: `Вместимость — 1. Подтверждено записей: ${state.bookings.length}; остаток: ${state.seats}.` };
  return { ok: state.observed === null || state.observed >= state.primary, text: state.observed === null ? "После записи v2 чтение ещё не выполнено." : `Проверяем чтение своей записи: подтверждена v${state.primary}, прочитана v${state.observed}. Это требование сценария, не обещание асинхронной реплики.` };
}
