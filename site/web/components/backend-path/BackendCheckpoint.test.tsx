// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackendCheckpoint } from "./BackendCheckpoint";
import { BACKEND_PROGRESS_KEY } from "@/lib/backend-path/progress";
const stage = { slug: "01-start", title: "Первая программа", summary: "Начало", order: 1, minutes: 10, checkpoint: ["Написал функцию", "Проверил результат"], body: "" };
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); }, clear: () => data.clear(), key: (index: number) => [...data.keys()][index] ?? null, get length() { return data.size; } };
  vi.stubGlobal("localStorage", storage);
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => { if (root) act(() => root.unmount()); host?.remove(); vi.unstubAllGlobals(); });
function render() { act(() => root.render(<BackendCheckpoint stage={stage} criteria={{ "01-start": 2 }} />)); }
describe("backend checkpoint", () => {
  it("never completes a stage merely by opening its page", () => {
    render();
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(localStorage.getItem(BACKEND_PROGRESS_KEY)).toBeNull();
    expect(host.textContent).toContain("Самопроверка");
    expect(host.textContent).not.toContain("Этап отмечен как выполненный");
  });
  it("preserves an unreadable previous record instead of silently replacing it", () => {
    localStorage.setItem(BACKEND_PROGRESS_KEY, "broken-data"); render();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("сохранён");
    expect(localStorage.getItem(BACKEND_PROGRESS_KEY)).toBe("broken-data");
  });
  it("requires the checklist and an explanation before marking completion", () => {
    render();
    const boxes = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    for (const box of boxes) act(() => box.click());
    const save = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "Сохранить самопроверку")!;
    act(() => save.click());
    const raw = localStorage.getItem(BACKEND_PROGRESS_KEY);
    expect(raw && JSON.parse(raw).stages["01-start"].completedAt).toBeFalsy();
    const textarea = host.querySelector("textarea")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "Запустил тест и объяснил результат");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => save.click());
    expect(JSON.parse(localStorage.getItem(BACKEND_PROGRESS_KEY)!).stages["01-start"].completedAt).toBeTruthy();
    expect(host.textContent).toContain("Этап отмечен как выполненный");
  });
});
