import { renderMarkdown } from "@/lib/markdown";
import { DiagramMarkdown } from "@/components/diagrams/DiagramMarkdown";

/**
 * Server component that renders trusted authored Markdown/MDX-lite to HTML.
 * Internal links (e.g. /book/channels) render as normal anchors — full
 * navigation works; styling comes from the `.mdx` prose classes in globals.css.
 */
export async function Mdx({ source }: { source: string }) {
  const html = await renderMarkdown(source);
  if (html.includes("data-mermaid-source=")) return <DiagramMarkdown html={html} />;
  return (
    <div className="mdx" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
