// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => ({ data: new Map<string, string>(), fail: false }));
vi.mock("@/lib/progress", () => ({ loadCode: (key: string) => storage.data.get(key) ?? null, saveCode: (key: string, value: string) => { if (!storage.fail) storage.data.set(key, value); } }));
import { DesignInterview } from "./DesignInterview";
import { createInterview, resumeInterview } from "@/lib/system-design/interview";
let host: HTMLDivElement, root: Root;
const button = (label: string) => [...host.querySelectorAll("button")].find(item => item.textContent === label)!;
function write(value: string) { const area = host.querySelector("textarea")!; Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(area, value); area.dispatchEvent(new Event("input", { bubbles: true })); }
beforeEach(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; vi.useFakeTimers(); vi.setSystemTime(1_000_000); storage.data.clear(); storage.fail = false; host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
describe("interview persistence UI", () => {
  it("blocks malformed storage and keeps recovery export available", () => {
    storage.data.set("interview-v1-booking", "broken"); act(() => root.render(<DesignInterview />));
    expect(host.querySelector("textarea")).toBeNull(); expect(button("Скачать исходные данные")).toBeDefined(); expect(storage.data.get("interview-v1-booking")).toBe("broken");
  });
  it("does not switch away from an unsaved draft when storage fails", () => {
    act(() => root.render(<DesignInterview />)); act(() => write("Несохранённое рассуждение о требованиях и пользователях.")); storage.fail = true;
    const select = host.querySelector("select")!;
    act(() => { select.value = "chat"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(host.querySelector("select")?.value).toBe("booking"); expect(host.querySelector("textarea")?.value).toContain("Несохранённое"); expect(host.textContent).toContain("Не удалось сохранить");
  });
  it("stops autosave on a conflicting external update without losing local edits", () => {
    act(() => root.render(<DesignInterview />)); act(() => write("Локальная версия требований, которую нельзя потерять."));
    const other = createInterview("booking"); other.notes[0] = "Другая версия из второго окна"; const raw = JSON.stringify(other); storage.data.set("interview-v1-booking", raw);
    act(() => window.dispatchEvent(new Event("storage"))); act(() => vi.advanceTimersByTime(1000));
    expect(storage.data.get("interview-v1-booking")).toBe(raw); expect(host.querySelector("textarea")?.value).toContain("Локальная версия"); expect(host.textContent).toContain("Автосохранение остановлено");
  });
  it("restores running timer by wall time and saves pause for the next load", () => {
    storage.data.set("interview-v1-booking", JSON.stringify(resumeInterview(createInterview("booking"), 940_000)));
    act(() => root.render(<DesignInterview />)); expect(host.querySelector('[role="timer"]')?.textContent).toContain("44:00");
    act(() => button("Пауза").click()); const saved = JSON.parse(storage.data.get("interview-v1-booking")!);
    expect(saved.runningSince).toBeNull(); expect(saved.elapsedMs).toBe(60_000);
  });
});
