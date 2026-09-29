import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { courseRoot } from "@/lib/courses";

export interface HardPart {
  slug: string;
  title: string;
  summary: string;
  order: number;
  prerequisites: string[];
  body: string;
}

/** Separate content collection: never included in the 16 foundational chapters. */
export function getHardParts(): HardPart[] {
  const root = path.join(courseRoot("system-design"), "hard-parts");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter(file => file.endsWith(".mdx")).map(file => {
    const { data, content } = matter(fs.readFileSync(path.join(root, file), "utf8"));
    const slug = file.slice(0, -4);
    if (typeof data.title !== "string" || typeof data.summary !== "string" || !Number.isInteger(data.order)
      || !Array.isArray(data.prerequisites) || !data.prerequisites.every((value: unknown) => typeof value === "string")) {
      throw new Error(`Invalid hard-part metadata: ${file}`);
    }
    return { slug, title: data.title, summary: data.summary, order: data.order, prerequisites: data.prerequisites as string[], body: content };
  }).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export function getHardPart(slug: string): HardPart | null {
  // Resolve only from the catalog; user input never becomes a filesystem path.
  return getHardParts().find(part => part.slug === slug) ?? null;
}
