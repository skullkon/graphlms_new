export const PROJECT_KEY = "club-project-v1";
export const MAX_HISTORY = 64;
export const MAX_FIELD = 6000;
export const MAX_BYTES = 2_000_000;
export const fields = { requirements: "Требования и обещания", data: "Данные и инварианты", flow: "Путь операции", failures: "Сбои и восстановление", tradeoffs: "Выбор и его цена" } as const;
export const controls = {
  instantRevocation: "Отзыв доступа должен действовать немедленно",
  cachedPermissions: "Кэшированное разрешение достаточно для доступа без актуальной проверки",
  zeroRPO: "Нельзя потерять ни одной подтверждённой записи при потере основного региона",
  asyncAckOnly: "Успех подтверждается до устойчивой записи за пределами основного региона",
  strictCapacity: "Нельзя выдать больше мест, чем есть",
  independentRegionWrites: "Регионы независимо расходуют общий остаток без согласования или разделения прав",
  exactlyOnceExternal: "Внешнее списание должно выполниться ровно один раз при повторах",
  noProviderDedup: "Провайдер не распознаёт повтор операции; общей транзакции с ним нет",
} as const;
export type Control = keyof typeof controls;
export type Draft = { fields: Record<keyof typeof fields, string>; controls: Record<Control, boolean>; score: number | null };
export type Version = { stage: number; at: string; draft: Draft };
export type Project = { schema: 1; selected: number; drafts: Draft[]; history: Version[] };
export const stages = [
  ["Клиент и сервер Клуба", "Разделите действия браузера и сервера; покажите, где остаётся запись после перезапуска.", "Схема клиента, сервера, памяти и хранилища", "У каждого действия есть наблюдаемый успех; временная память отделена от устойчивых данных.", "Сервер перезапустился после ответа об успешной записи."],
  ["Путь запроса", "Проведите открытие каталога от браузера до ответа сервера.", "Последовательность вызовов", "Отделены DNS, соединение, HTTP и обработка; у каждого ожидания есть предел.", "Ответ потерян после сохранения записи."],
  ["Модель данных", "Опишите занятие, участника и запись; защитите последнее место.", "Таблицы и расписание двух транзакций", "Вместимость и уникальность проверяются атомарно; назван момент успеха и результат повтора.", "Процесс упал сразу после commit."],
  ["Расчёт мощности", "Рассчитайте поток просмотра и записи, размеры ответов и конкурентность.", "Расчёт с единицами и допущениями", "Среднее отделено от пика; объём хранения не смешан с пропускной способностью; указаны границы оценки.", "Весь дневной поток записи пришёл за минуту."],
  ["Балансировка и перегрузка", "Распределите запросы между экземплярами API и ограничьте входную работу.", "Схема балансировки, лимиты и бюджет ожидания", "Есть предел очереди и пула; состояние не теряется при смене экземпляра; повторы ограничены.", "Один экземпляр отключён, а внешняя зависимость отвечает вдвое дольше."],
  ["Кэш каталога", "Выберите ключ, срок и способ обновления описания занятия.", "Протокол чтения и обновления кэша", "Есть источник истины и разбор заполнения старым значением после удаления ключа.", "Отозван доступ к закрытому материалу."],
  ["Реплика", "Добавьте копию базы и проведите запись с последующим чтением.", "Таблица позиций и подтверждений", "Различены получение, устойчивое хранение и применение; названа допустимая потеря.", "Основной узел потерян до доставки последней записи."],
  ["Разделение данных", "Выберите ключ разделения и покажите маршрутизацию курса.", "Карта владельцев и план переноса", "Разобраны популярный ключ, старый маршрут и барьер смены владельца.", "Один курс создаёт половину всех запросов."],
  ["Уведомления", "Свяжите запись на занятие с отправкой письма через outbox.", "Протокол доставки и таблица падений", "Намерение атомарно с записью; повтор эффекта и подтверждение брокеру рассмотрены отдельно.", "Письмо отправлено, но подтверждение потеряно."],
  ["Чат занятия", "Опишите отправку сообщения и возвращение после разрыва.", "ID сообщений и протокол восстановления", "Повтор не создаёт новую запись; история доступна независимо от соединения.", "Второе устройство уже получило сообщение до повтора."],
  ["Видео", "Разделите загрузку файла, обработку и публикацию готовой версии.", "Автомат состояний видео", "Незавершённый файл не опубликован; повтор и очистка имеют условия.", "Обработчик упал между записью файла и сменой статуса."],
  ["Доступ", "Проведите просмотр закрытого материала и отзыв членства.", "Матрица прав и критический путь проверки", "Права проверяет сервер; назначение и целевой ресурс защищены; срок отзыва определён.", "Источник прав недоступен во время отзыва."],
  ["Надёжность", "Задайте SLI, SLO и процедуру восстановления записи.", "Показатель с знаменателем и runbook", "Перегрузка не исчезает из знаменателя; RPO/RTO связаны с проверяемой процедурой.", "Реплика повторила ошибочное удаление."],
  ["Изменение системы", "Спланируйте новое поле и перенос строк при старых писателях.", "Этапы совместимости и отката", "Есть источник истины, защита backfill от гонки и граница обратимости.", "Новый код уже создал значение, которого старый не понимает."],
  ["Защита решения", "Сравните синхронную запись с очередью команд для ста мест.", "ADR и план эксперимента", "Варианты сравниваются по одному контракту; стенд проверяет вместимость, не только HTTP.", "Появилось требование строгого порядка принятия заявок."],
  ["Итоговый разбор", "Подготовьте 45-минутную защиту Клуба и укажите непроверенные предположения.", "Связное решение и перечень свидетельств", "Выполненные опыты отделены от планов; каждый компонент связан с требованием.", "Запись должна пережить потерю региона без потери подтверждённых мест."],
].map(([title, task, artifact, criteria, change], index) => ({ id: index + 1, title, task, artifact, criteria, change }));
export function emptyDraft(): Draft { return { fields: Object.fromEntries(Object.keys(fields).map(k => [k, ""])) as Draft["fields"], controls: Object.fromEntries(Object.keys(controls).map(k => [k, false])) as Draft["controls"], score: null }; }
export function emptyProject(): Project { return { schema: 1, selected: 1, drafts: stages.map(emptyDraft), history: [] }; }
export function contradictions(c: Draft["controls"]): string[] {
  const result: string[] = [];
  if(c.instantRevocation && c.cachedPermissions) result.push("Немедленный отзыв несовместим с самостоятельным разрешением по старому кэшу: после отзыва кэш ещё разрешает доступ. Проверяйте актуальное право у авторитетного источника и отказывайте при невозможности проверки либо согласуйте ограниченную задержку отзыва. TTL требует учёта гонок заполнения и сам по себе не доказывает границу.");
  if(c.zeroRPO && c.asyncAckOnly) result.push("Регион может исчезнуть после ответа об успехе, но до копирования записи. Для нулевой потери подтверждайте успех после устойчивого сохранения в выбранном домене отказа и обеспечьте безопасное переключение; иначе укажите ненулевой RPO. Удалённое подтверждение добавляет задержку и может ограничить доступность записи.");
  if(c.strictCapacity && c.independentRegionWrites) result.push("Два региона могут одновременно выдать последнее общее место. Используйте одного владельца, согласованный атомарный порядок либо заранее разделённые права на места. Разделение прав сохраняет предел, но свободные места другого региона могут оказаться недоступны; перенос прав требует собственного протокола.");
  if(c.exactlyOnceExternal && c.noProviderDedup) result.push("После потерянного ответа неизвестно, выполнилось ли списание: повтор может списать дважды, отказ от повтора — пропустить оплату. Нужен устойчивый ключ операции с контрактом провайдера или общая атомарная граница. Если их нет, храните неопределённый исход и выполняйте сверку; сверка и компенсация не равны гарантии ровно одного эффекта.");
  return result;
}
function validDraft(v: unknown): v is Draft {
  if (!v || typeof v !== "object") return false;
  const d = v as Draft;
  return !!d.fields && !!d.controls && Object.keys(d.fields).length === 5 && Object.keys(d.controls).length === 8 && Object.keys(fields).every(k => typeof d.fields[k as keyof typeof fields] === "string" && d.fields[k as keyof typeof fields].length <= MAX_FIELD) && Object.keys(controls).every(k => typeof d.controls[k as Control] === "boolean") && (d.score === null || Number.isInteger(d.score) && d.score >= 0 && d.score <= 3);
}
export function parseProject(raw: string): Project {
  if(new TextEncoder().encode(raw).length > MAX_BYTES) throw new Error("Размер проекта превышает 2 МБ. Данные не заменены.");
  const p = JSON.parse(raw) as Project;
  if(!p || p.schema !== 1 || !Number.isInteger(p.selected) || p.selected < 1 || p.selected > 16 || !Array.isArray(p.drafts) || p.drafts.length !== 16 || !p.drafts.every(validDraft) || !Array.isArray(p.history) || p.history.length > MAX_HISTORY || !p.history.every(v => v && Number.isInteger(v.stage) && v.stage >= 1 && v.stage <= 16 && typeof v.at === "string" && /^\d{4}-\d\d-\d\dT/.test(v.at) && Number.isFinite(Date.parse(v.at)) && validDraft(v.draft))) throw new Error("Сохранённый проект имеет неизвестный или повреждённый формат. Он не перезаписан.");
  return {schema: 1, selected: p.selected, drafts: p.drafts, history: p.history};
}
export function updateDraft(p: Project, stage: number, draft: Draft): Project { if(stage < 1 || stage > 16 || !Number.isInteger(stage) || !validDraft(draft)) throw new Error("Некорректный этап или черновик"); return {...p, drafts: p.drafts.map((d,i) => i === stage-1 ? structuredClone(draft) : d)}; }
export function saveVersion(p: Project, at = new Date().toISOString()): Project {
  if(Object.values(p.drafts[p.selected - 1].fields).every(value => !value.trim())) throw new Error("Сначала опишите решение хотя бы в одном поле. Флажки и самооценка не заменяют объяснение.");
  if(p.history.length >= MAX_HISTORY) throw new Error("Сохранено 64 версии. Экспортируйте историю; новые версии не добавлены. Черновики можно продолжать редактировать.");
  const next = {...p, history: [...p.history, {stage: p.selected, at, draft: structuredClone(p.drafts[p.selected-1])}]};
  return parseProject(JSON.stringify(next));
}
export function exportProject(p: Project, format: "json" | "md"): string {
  if(format === "json") return JSON.stringify({...p, stages, rubric: "0 — отсутствует; 1 — назван; 2 — объяснён; 3 — проверен на новом условии", assessment: "Экспертная проверка не выполнена. Самооценку выставляет человек."},null,2);
  const draftText = (d: Draft) => [ ...Object.entries(fields).map(([k,label]) => `### ${label}\n\n${d.fields[k as keyof typeof fields] || "Не заполнено"}`), "### Указанная модель\n\n" + Object.entries(controls).map(([k,label]) => `- [${d.controls[k as Control] ? "x" : " "}] ${label}`).join("\n"), `Самооценка: ${d.score ?? "не выставлена"}. Экспертная проверка не выполнена.`, "Проверка выбранной модели:\n" + (contradictions(d.controls).join("\n\n") || "Из четырёх проверяемых противоречий не найдено ни одного. Это не подтверждает корректность проекта.") ].join("\n\n");
  return ["# Проект Клуба", "Рубрика: 0 — отсутствует; 1 — механизм назван; 2 — объяснён; 3 — проверен на изменённом условии. Оценку выставляет человек.", ...stages.map((s,i) => `## Этап ${s.id}. ${s.title}\n\nЗадача: ${s.task}\n\nАртефакт: ${s.artifact}\n\nКритерий: ${s.criteria}\n\nИзменение условия: ${s.change}\n\n${draftText(p.drafts[i])}`), "# История версий", ...p.history.map((v,i) => `## Версия ${i+1}: этап ${v.stage}, ${v.at}\n\n${draftText(v.draft)}`)].join("\n\n");
}

export function inheritPrevious(p: Project): Project {
  const d = p.drafts[p.selected - 1];
  if(p.selected <= 1 || Object.values(d.fields).some(v => v.length > 0) || Object.values(d.controls).some(Boolean) || d.score !== null) throw new Error("Перенос доступен только в полностью пустой этап.");
  return updateDraft(p, p.selected, {...structuredClone(p.drafts[p.selected - 2]), score: null});
}
