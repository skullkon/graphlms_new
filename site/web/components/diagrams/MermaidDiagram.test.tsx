// @vitest-environment jsdom
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidDiagram } from "./MermaidDiagram";
import { DiagramMarkdown } from "./DiagramMarkdown";
import { renderDiagram, type DiagramImage } from "./renderDiagram";

vi.mock("./renderDiagram", () => ({ renderDiagram: vi.fn(), diagramLegend: () => "Диаграмма последовательности" }));
const render = vi.mocked(renderDiagram);
const image = (url: string): DiagramImage => ({ url, width: 900, height: 400, title: "Порядок записи" });
let host: HTMLDivElement;
let root: Root;
let revoke: ReturnType<typeof vi.fn>;

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  revoke = vi.fn(); vi.stubGlobal("URL", Object.assign(URL, { revokeObjectURL: revoke }));
  render.mockReset();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove(); vi.unstubAllGlobals();
});

describe("diagram lifecycle", () => {
  it("discards late render results and revokes URLs when the source changes or unmounts", async () => {
    let finish!: (value: DiagramImage) => void;
    render.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await act(async () => root.render(<MermaidDiagram source="old" />));
    render.mockResolvedValueOnce(image("blob:new"));
    await act(async () => root.render(<MermaidDiagram source="new" />));
    await act(async () => finish(image("blob:old")));
    expect(revoke).toHaveBeenCalledWith("blob:old");
    expect(host.querySelector("img")?.getAttribute("src")).toBe("blob:new");
    await act(async () => root.render(null));
    expect(revoke).toHaveBeenCalledWith("blob:new");
  });
  it("supports zoom and a modal that closes with Escape and returns focus", async () => {
    render.mockResolvedValue(image("blob:diagram"));
    await act(async () => root.render(<MermaidDiagram source="sequenceDiagram" />));
    const bigger = host.querySelector<HTMLButtonElement>('button[aria-label="Увеличить схему"]')!;
    await act(async () => bigger.click());
    expect(host.querySelector("img")?.getAttribute("width")).toBe("1125");
    const open = host.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
    await act(async () => open.click());
    expect(host.querySelector("dialog")?.hasAttribute("open")).toBe(true);
    await act(async () => host.querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true })));
    expect(host.querySelector("dialog")?.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(open);
  });
  it("renders only scoped markers, keeps multiple diagrams through StrictMode and cleans on navigation", async () => {
    let number = 0;
    render.mockImplementation(async () => image(`blob:${++number}`));
    const outside = document.createElement("div"); outside.dataset.mermaidSource = "outside"; document.body.append(outside);
    const html = '<h2 id="stable">Title</h2><div data-mermaid-source="one">fallback</div><div data-mermaid-source="two">fallback</div>';
    await act(async () => root.render(<StrictMode><DiagramMarkdown html={html} /></StrictMode>));
    expect(host.querySelectorAll("img")).toHaveLength(2);
    expect(outside.childElementCount).toBe(0);
    expect(host.querySelector("#stable")?.textContent).toBe("Title");
    await act(async () => root.render(<StrictMode><DiagramMarkdown html='<p>Another page</p><div data-mermaid-source="three">fallback</div>' /></StrictMode>));
    expect(host.querySelectorAll("img")).toHaveLength(1);
    expect(host.textContent).toContain("Another page");
    await act(async () => root.render(null));
    expect(revoke.mock.calls.length).toBe(number);
    outside.remove();
  });
  it("keeps an accessible explanation and escaped source when rendering fails", async () => {
    render.mockRejectedValue(new Error("invalid"));
    await act(async () => root.render(<MermaidDiagram source='<script>alert(1)</script>' />));
    expect(host.querySelector('[role="status"]')?.textContent).toContain("Не удалось");
    expect(host.querySelector("pre")?.textContent).toBe('<script>alert(1)</script>');
    expect(host.querySelector("script")).toBeNull();
  });
});
