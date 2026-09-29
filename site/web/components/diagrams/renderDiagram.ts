import type { Mermaid, MermaidConfig } from "mermaid";

/** Pinned site policy: diagram text cannot opt into HTML, click handlers or remote services. */
export const DIAGRAM_CONFIG: MermaidConfig = {
  startOnLoad: false,
  securityLevel: "strict",
  htmlLabels: false,
  suppressErrorRendering: true,
  maxTextSize: 50_000,
  maxEdges: 500,
  theme: "default",
  fontFamily: "Arial, sans-serif",
  // Extra room for Russian transition labels and branches in state machines.
  state: { nodeSpacing: 100, rankSpacing: 110, padding: 20 },
  secure: ["securityLevel", "startOnLoad", "maxTextSize", "maxEdges", "htmlLabels", "suppressErrorRendering", "dompurifyConfig", "theme", "fontFamily"],
};

let library: Promise<Mermaid> | undefined;
let serial = 0;
function getMermaid(): Promise<Mermaid> {
  if (!library) library = import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize(DIAGRAM_CONFIG);
    return mermaid;
  }).catch(error => { library = undefined; throw error; });
  return library;
}

export function validateDiagramSource(source: string): void {
  if (!source.trim() || source.length > 50_000) throw new Error("Invalid diagram size");
  // Config directives/frontmatter are unnecessary for authored educational diagrams.
  // Reject rather than stripping silently: the exact reviewed diagram is rendered.
  if (/%%\s*\{/.test(source) || /^\s*---(?:\r?\n|$)/.test(source)) throw new Error("Inline Mermaid configuration is disabled");
}

export function diagramLegend(source: string): string {
  if (/^\s*sequenceDiagram\b/m.test(source)) return "Диаграмма последовательности: время идёт сверху вниз, вертикальные линии обозначают участников, стрелки — сообщения между ними.";
  if (/^\s*stateDiagram(?:-v2)?\b/m.test(source)) return "Диаграмма состояний: блоки обозначают состояния, стрелки — переходы по событиям или условиям. Начало и завершение отмечены кругами.";
  if (/^\s*classDiagram\b/m.test(source)) return "Диаграмма классов: блоки показывают классы и их свойства, линии — отношения между ними. Подписи уточняют вид связи.";
  return "Схема связей: блоки обозначают элементы системы, линии и подписи объясняют связи. Направление стрелок показывает направление взаимодействия.";
}

export interface DiagramImage { url: string; width: number; height: number; title: string }

export async function renderDiagram(source: string): Promise<DiagramImage> {
  validateDiagramSource(source);
  const mermaid = await getMermaid();
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = "position:absolute;left:-100000px;top:0;pointer-events:none";
  document.body.append(container);
  try {
    const { svg } = await mermaid.render(`lesson-diagram-${++serial}`, source, container);
    // Mermaid's strict renderer creates SVG; image mode is an additional boundary:
    // scripts/click bindings and external resources cannot run in the host DOM.
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = parsed.documentElement;
    if (root.localName !== "svg" || parsed.querySelector("parsererror")) throw new Error("Invalid SVG output");
    const viewBox = root.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
    const width = viewBox?.[2] ?? 800;
    const height = viewBox?.[3] ?? 500;
    const title = root.querySelector("title")?.textContent?.trim() || diagramLegend(source);
    return {
      url: URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
      width: Number.isFinite(width) && width > 0 ? width : 800,
      height: Number.isFinite(height) && height > 0 ? height : 500,
      title,
    };
  } finally {
    container.remove();
  }
}
