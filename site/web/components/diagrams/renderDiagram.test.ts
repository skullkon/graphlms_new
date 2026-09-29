// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DIAGRAM_CONFIG, diagramLegend, renderDiagram, validateDiagramSource } from "./renderDiagram";

let output: Blob | undefined;
beforeAll(() => {
  // jsdom has no SVG layout engine; geometry is irrelevant to these security tests.
  Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value: () => ({ x: 0, y: 0, width: 120, height: 30 }) });
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", { configurable: true, value: () => 120 });
  URL.createObjectURL = vi.fn(blob => { output = blob as Blob; return "blob:rendered"; });
});
beforeEach(() => { output = undefined; });
const readBlob = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob);
});

describe("local Mermaid renderer", () => {
  it("pins strict policy and rejects inline configuration that could change it", () => {
    expect(DIAGRAM_CONFIG.securityLevel).toBe("strict");
    expect(DIAGRAM_CONFIG.htmlLabels).toBe(false);
    expect(DIAGRAM_CONFIG.startOnLoad).toBe(false);
    expect(() => validateDiagramSource('%%{init: {"securityLevel":"loose"}}%%\nsequenceDiagram')).toThrow();
    expect(() => validateDiagramSource('---\nconfig:\n  securityLevel: loose\n---\nsequenceDiagram')).toThrow();
    expect(() => validateDiagramSource("x".repeat(50_001))).toThrow();
    expect(() => validateDiagramSource("sequenceDiagram\n A->>B: Hi")).not.toThrow();
  });
  it("renders real SVG with accessible text and no executable authored markup", async () => {
    const result = await renderDiagram('sequenceDiagram\naccTitle: Подтверждение записи\nparticipant A as Клиент\nparticipant B as Сервер\nA->>B: <script>alert(1)</script>\nB-->>A: Ответ');
    expect(result.url).toBe("blob:rendered");
    expect(result.title).toBe("Подтверждение записи");
    const svg = await readBlob(output!);
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(parsed.querySelector("svg")).not.toBeNull();
    expect(parsed.querySelector("script, foreignObject, iframe, img")).toBeNull();
    expect(parsed.querySelector("[onload], [onerror]")).toBeNull();
    expect(parsed.querySelector("text")?.textContent).toBeTruthy();
    expect(document.body.childElementCount).toBe(0);
  }, 30_000);
  it("removes temporary DOM after syntax failure and can render the next diagram", async () => {
    await expect(renderDiagram("sequenceDiagram\nthis is invalid syntax %%")).rejects.toThrow();
    expect(document.body.childElementCount).toBe(0);
    expect(output).toBeUndefined();
    await expect(renderDiagram("sequenceDiagram\nA->>B: Следующая схема")).resolves.toMatchObject({ url: "blob:rendered" });
    expect(document.body.childElementCount).toBe(0);
  }, 30_000);
  it("explains time and states rather than supplying a decorative caption", () => {
    expect(diagramLegend("sequenceDiagram\nA->>B: x")).toContain("сверху вниз");
    expect(diagramLegend("stateDiagram-v2\n[*] --> Ready")).toContain("переходы");
  });
});
