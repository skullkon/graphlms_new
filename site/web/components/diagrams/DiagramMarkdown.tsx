"use client";

import React, { memo, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MermaidDiagram } from "./MermaidDiagram";

interface Island { element: HTMLElement; source: string }

// Portal state updates must not rewrite innerHTML and detach their own targets.
const StaticMarkup = memo(function StaticMarkup({ html, hostRef }: { html: string; hostRef: RefObject<HTMLDivElement | null> }) {
  return <div ref={hostRef} className="mdx" dangerouslySetInnerHTML={{ __html: html }} />;
});

/** Portals keep island teardown in React, including StrictMode and client navigation. */
export function DiagramMarkdown({ html }: { html: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [islands, setIslands] = useState<{ html: string; nodes: Island[] } | null>(null);
  useEffect(() => {
    const nodes = Array.from(host.current?.querySelectorAll<HTMLElement>("[data-mermaid-source]") ?? []).map(element => {
      const source = element.getAttribute("data-mermaid-source") ?? "";
      element.replaceChildren();
      return { element, source };
    });
    setIslands({ html, nodes });
  }, [html]);
  return <>
    <StaticMarkup html={html} hostRef={host} />
    {islands?.html === html && islands.nodes.map(({ element, source }, index) => createPortal(<MermaidDiagram source={source} />, element, String(index)))}
  </>;
}
