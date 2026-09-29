// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Code } from "mdast";
import { remarkDiagrams } from "./remark-diagrams";
import { renderMarkdown } from "./markdown";
import { DIAGRAM_CONFIG, validateDiagramSource } from "@/components/diagrams/renderDiagram";

const pipeline = () => unified().use(remarkParse).use(remarkDiagrams).use(remarkRehype).use(rehypeStringify);

describe("Mermaid Markdown islands", () => {
  it("escapes malicious markup in both source attributes and the no-JS fallback", async () => {
    const source = 'sequenceDiagram\n A->>B: "</div><script>alert(1)</script><img src=x onerror=alert(1)>';
    const html = String(await pipeline().process(`\`\`\`mermaid\n${source}\n\`\`\``));
    const root = document.createElement("div");
    root.innerHTML = html;
    expect(root.querySelectorAll("[data-mermaid-source]")).toHaveLength(1);
    expect(root.querySelector("[data-mermaid-source]")?.getAttribute("data-mermaid-source")).toBe(source);
    expect(root.querySelector("pre")?.textContent).toBe(source);
    expect(root.querySelector("script, img")).toBeNull();
  });
  it("preserves heading IDs, ordinary Go and runnable islands in the complete pipeline", async () => {
    const html = await renderMarkdown('## Один заголовок\n\n```mermaid\nsequenceDiagram\n A->>B: Привет\n```\n\n```go\nfunc main() {}\n```\n\n```go play\npackage main\n```\n\n## Один заголовок');
    expect(html).toContain('id="один-заголовок"');
    expect(html).toContain('id="один-заголовок-1"');
    expect(html).toContain("data-mermaid-source");
    expect(html).toContain("data-runnable");
    expect(html).toContain('data-language="go"');
    expect(html).not.toContain('data-language="mermaid"');
  });
  it("supports fences nested in lists without splitting the surrounding HTML", async () => {
    const html = String(await pipeline().process('- Объяснение\n\n  ```mermaid\n  stateDiagram-v2\n    [*] --> Done\n  ```'));
    const root = document.createElement("div"); root.innerHTML = html;
    expect(root.querySelector("li [data-mermaid-source]")).not.toBeNull();
  });
});

describe("authored Mermaid syntax", () => {
  it("parses every Mermaid fence in System Design book and hard parts with the installed renderer", async () => {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize(DIAGRAM_CONFIG);
    const content = path.resolve(process.cwd(), "..", "content", "system-design");
    const files = ["book", "hard-parts"].flatMap(dir => fs.readdirSync(path.join(content, dir))
      .filter(file => file.endsWith(".mdx")).map(file => path.join(content, dir, file)));
    const diagrams: { file: string; source: string }[] = [];
    for (const file of files) {
      const tree = unified().use(remarkParse).parse(fs.readFileSync(file, "utf8"));
      visit(tree, "code", (node: Code) => { if (node.lang === "mermaid") diagrams.push({ file, source: node.value }); });
    }
    expect(diagrams.length).toBeGreaterThan(0);
    for (const { file, source } of diagrams) {
      validateDiagramSource(source);
      await expect(mermaid.parse(source), file).resolves.toBeTruthy();
    }
  }, 30_000);
});
