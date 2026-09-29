import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { courseRoot } from "../courses";

export interface BackendStage {
  slug: string;
  title: string;
  summary: string;
  order: number;
  minutes: number | null;
  checkpoint: string[];
  body: string;
}
export function getBackendStages(): BackendStage[] {
  const dir = path.join(courseRoot("backend-path"), "book");
  if (!fs.existsSync(dir)) return [];
  const stages = fs.readdirSync(dir).filter(name => name.endsWith(".mdx")).map(name => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, name), "utf8"));
    const slug = name.slice(0, -4);
    if (data.slug !== slug || !/^[a-z0-9-]+$/.test(slug) || typeof data.title !== "string" || typeof data.summary !== "string"
      || !Number.isInteger(data.order) || data.order < 1 || !Array.isArray(data.checkpoint) || data.checkpoint.length < 3
      || !data.checkpoint.every((item: unknown) => typeof item === "string" && item.trim())) throw new Error(`Invalid backend path milestone: ${name}`);
    return { slug, title: data.title, summary: data.summary, order: data.order, minutes: typeof data.minutes === "number" ? data.minutes : null, checkpoint: data.checkpoint, body: content } as BackendStage;
  }).sort((a, b) => a.order - b.order);
  if (new Set(stages.map(stage => stage.order)).size !== stages.length) throw new Error("Duplicate backend path order");
  return stages;
}
/** Resolve from known metadata only; a URL never becomes a filesystem path. */
export function getBackendStage(slug: string): BackendStage | null { return getBackendStages().find(stage => stage.slug === slug) ?? null; }
