// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { LearningCycle } from "./LearningCycle";
import { loadCode, saveCode } from "@/lib/progress";
import { learningCycles } from "@/lib/system-design/learningCycle";

let host: HTMLDivElement;
let root: Root;
const cycle = learningCycles[0];
const rationale = "Новая копия существует только в памяти процесса, а база хранит прежнюю версию.";
const button = (name: string) => [...host.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === name)!;
async function type(selector: string, value: string) {
  const field = host.querySelector<HTMLTextAreaElement>(selector)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function choose(index: number) {
  await act(async () => host.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index].click());
}
async function mount(slug = cycle.chapterSlug) {
  await act(async () => root.render(<LearningCycle chapterSlug={slug} />));
}
beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const values = new Map<string, string>();
  const storage: Storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    clear: () => values.clear(), key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

describe("LearningCycle", () => {
  it("gates the solution on an explained attempt and gives concrete wrong-answer feedback", async () => {
    await mount();
    expect(host.textContent).toContain(cycle.prompt);
    expect(host.textContent).not.toContain(cycle.solution);
    expect(button("Проверить выбор").disabled).toBe(true);
    await choose(0);
    await type('textarea[name="rationale"]', "x".repeat(39));
    expect(button("Проверить выбор").disabled).toBe(true);
    await type('textarea[name="rationale"]', rationale);
    expect(button("Проверить выбор").disabled).toBe(false);
    await act(async () => button("Проверить выбор").click());
    expect(host.textContent).toContain(cycle.explanations[0]);
    expect(host.textContent).toContain(cycle.solution);
    const saved = JSON.parse(loadCode(`cycle-${cycle.chapterSlug}`, "system-design")!);
    expect(saved).toMatchObject({ checked: true, passed: false, choice: 0 });
    expect(saved.attemptedAt).toBeTypeOf("number");
    expect(loadCode(`check-${cycle.chapterSlug}`, "system-design")).toBeNull();
  });

  it("reloads hints, draft and a valid pass, then clears a stale pass when edited", async () => {
    await mount();
    expect(host.textContent).toContain(cycle.prompt);
    await act(async () => button("Следующая подсказка").click());
    await type('textarea[name="rationale"]', rationale);
    await choose(1);
    await act(async () => button("Проверить выбор").click());
    await act(async () => root.render(null));
    await mount();
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.value).toBe(rationale);
    expect(host.textContent).toContain(cycle.hints[0]);
    expect(host.textContent).toContain("Выбор проверен: верно.");
    await choose(0);
    expect(host.textContent).not.toContain("Выбор проверен: верно.");
    expect(JSON.parse(loadCode(`cycle-${cycle.chapterSlug}`, "system-design")!).passed).toBe(false);
  });
  it("does not restore a forged pass or open the solution without an explained attempt", async () => {
    saveCode(`cycle-${cycle.chapterSlug}`, JSON.stringify({
      draft: "short", choice: 1, hints: 0, checked: true, passed: true, attemptedAt: 100,
    }), "system-design");
    await mount();
    expect(host.textContent).not.toContain("Выбор проверен: верно.");
    expect(host.textContent).not.toContain(cycle.solution);
    expect(button("Проверить выбор").disabled).toBe(true);
  });

  it("keeps the visible draft and reports failed persistence rather than claiming it saved", async () => {
    await mount();
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    await type('textarea[name="rationale"]', rationale);
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.value).toBe(rationale);
    expect(host.textContent).toContain("Не удалось сохранить попытку");
    expect(loadCode(`cycle-${cycle.chapterSlug}`, "system-design")).toBeNull();
  });

  it("saves the transfer draft separately and reveals its answer only after writing", async () => {
    await mount();
    await type('textarea[name="rationale"]', rationale);
    await choose(1);
    await act(async () => button("Проверить выбор").click());
    expect(host.textContent).not.toContain(cycle.transfer.answer);
    expect(button("Открыть разбор нового условия").disabled).toBe(true);
    await type('textarea[name="transfer"]', rationale);
    await act(async () => button("Открыть разбор нового условия").click());
    expect(host.textContent).toContain(cycle.transfer.answer);
    await act(async () => root.render(null));
    await mount();
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="transfer"]')!.value).toBe(rationale);
    expect(host.textContent).not.toContain(cycle.transfer.answer);
    expect(loadCode(`check-${cycle.chapterSlug}`, "system-design")).toBeNull();
  });

  it("does not copy draft or correctness when navigating to a different chapter", async () => {
    await mount();
    await type('textarea[name="rationale"]', rationale);
    await choose(1);
    await act(async () => button("Проверить выбор").click());
    await mount("02-http");
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.value).toBe("");
    expect(host.querySelectorAll('input:checked')).toHaveLength(0);
    expect(host.textContent).not.toContain("Выбор проверен: верно.");
    expect(loadCode("cycle-02-http", "system-design")).toBeNull();
    await mount();
    expect(host.textContent).toContain("Выбор проверен: верно.");
  });

  it("preserves corrupted storage until an explicit recovery and offers the original export", async () => {
    const raw = "{broken saved answer";
    saveCode(`cycle-${cycle.chapterSlug}`, raw, "system-design");
    await mount();
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.disabled).toBe(true);
    expect(button("Следующая подсказка").disabled).toBe(true);
    expect(loadCode(`cycle-${cycle.chapterSlug}`, "system-design")).toBe(raw);
    const exportLink = [...host.querySelectorAll<HTMLAnchorElement>("a[download]")]
      .find(a => a.textContent === "Скачать сохранённую запись")!;
    expect(decodeURIComponent(exportLink.getAttribute("href")!)).toContain(raw);
    await act(async () => button("Начать новую попытку вместо повреждённой").click());
    expect(JSON.parse(loadCode(`cycle-${cycle.chapterSlug}`, "system-design")!).draft).toBe("");
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.disabled).toBe(false);
  });

  it("blocks a cross-tab overwrite, keeps the local draft and reloads only on request", async () => {
    await mount();
    await type('textarea[name="rationale"]', rationale);
    const other = JSON.stringify({ draft: "Ответ, изменённый в другом окне, должен остаться в хранилище.", choice: 0,
      hints: 1, checked: false, passed: false, attemptedAt: null });
    saveCode(`cycle-${cycle.chapterSlug}`, other, "system-design");
    const local = rationale + " Мои дополнительные правки.";
    await type('textarea[name="rationale"]', local);
    expect(loadCode(`cycle-${cycle.chapterSlug}`, "system-design")).toBe(other);
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.value).toBe(local);
    expect(host.textContent).toContain("Сохранённая попытка изменилась");
    expect(host.querySelector('a[download]')).not.toBeNull();
    await act(async () => button("Загрузить сохранённую попытку").click());
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="rationale"]')!.value)
      .toBe("Ответ, изменённый в другом окне, должен остаться в хранилище.");
  });

});
