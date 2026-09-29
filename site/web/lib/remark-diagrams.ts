import type { Plugin } from "unified";
import type { Root, Code } from "mdast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

/** Authored fences become scoped islands, using HAST text/attributes, never raw HTML. */
export const remarkDiagrams: Plugin<[], Root> = () => tree => {
  visit(tree, "code", (node: Code) => {
    if (node.lang !== "mermaid") return;
    // A custom node avoids the code handler wrapping the island in <pre>.
    (node as Node).type = "mermaidDiagram";
    node.data = {
      ...node.data,
      hName: "div",
      hProperties: { dataMermaidSource: node.value },
      hChildren: [
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Схема загружается. Текстовое объяснение приведено рядом; исходник доступен ниже." }] },
        { type: "element", tagName: "details", properties: {}, children: [
          { type: "element", tagName: "summary", properties: {}, children: [{ type: "text", value: "Исходник схемы" }] },
          { type: "element", tagName: "pre", properties: {}, children: [{ type: "text", value: node.value }] },
        ] },
      ],
    };
  });
};
