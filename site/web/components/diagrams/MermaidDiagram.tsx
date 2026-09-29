"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { renderDiagram, diagramLegend, type DiagramImage } from "./renderDiagram";
import styles from "./MermaidDiagram.module.css";

export function MermaidDiagram({ source }: { source: string }) {
  const [image, setImage] = useState<DiagramImage | null>(null);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  useEffect(() => {
    let cancelled = false;
    let allocated: string | undefined;
    setImage(null); setError(false); setZoom(1);
    renderDiagram(source).then(result => {
      if (cancelled) { URL.revokeObjectURL(result.url); return; }
      allocated = result.url;
      setImage(result);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; if (allocated) URL.revokeObjectURL(allocated); };
  }, [source]);
  function close() {
    dialog.current?.close();
    setExpanded(false);
    openButton.current?.focus();
  }
  const zoomButtons = <>
    <button type="button" onClick={() => setZoom(value => Math.max(0.5, value - 0.25))} disabled={zoom <= 0.5} aria-label="Уменьшить схему">−</button>
    <span aria-live="polite">{Math.round(zoom * 100)}%</span>
    <button type="button" onClick={() => setZoom(value => Math.min(3, value + 0.25))} disabled={zoom >= 3} aria-label="Увеличить схему">+</button>
    <button type="button" onClick={() => setZoom(1)}>Исходный масштаб</button>
  </>;
  const picture = image && <div className={styles.viewport} tabIndex={0} role="region" aria-label="Область схемы, прокрутка стрелками" aria-describedby={descriptionId}>
    {/* SVG stays in image mode; it is never injected as arbitrary DOM HTML. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={styles.image} src={image.url} alt={image.title} width={image.width * zoom} height={image.height * zoom} style={{ width: image.width * zoom }} />
  </div>;
  return <figure className={styles.figure}>
    {!image && <p className={styles.status} role="status">{error ? "Не удалось построить схему. Используйте текстовое объяснение рядом и исходник ниже." : "Строим схему…"}</p>}
    {image && <>
      <div className={styles.toolbar} role="group" aria-label="Масштаб схемы">
        {zoomButtons}
        <button ref={openButton} type="button" onClick={() => { dialog.current?.showModal(); setExpanded(true); }} aria-haspopup="dialog" aria-expanded={expanded}>Открыть крупнее</button>
      </div>
      {picture}
    </>}
    <figcaption id={descriptionId} className={styles.caption}>{diagramLegend(source)} Условия и последовательность действий разобраны в тексте рядом.</figcaption>
    <details className={styles.source}><summary>Исходник схемы</summary><pre>{source}</pre></details>
    <dialog ref={dialog} className={styles.dialog} aria-label="Увеличенная схема" onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setExpanded(false); openButton.current?.focus(); }}>
      <div className={styles.toolbar} role="group" aria-label="Масштаб увеличенной схемы">{zoomButtons}<button type="button" onClick={close} autoFocus>Закрыть</button></div>
      {expanded && picture}
    </dialog>
  </figure>;
}
