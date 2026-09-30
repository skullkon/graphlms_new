import { describe, expect, it } from "vitest";
import { getPracticalCourse, PRACTICAL_COURSES } from "./practicalCourses";
import { getBookChapters } from "./content";
import { getLearningItems } from "./learning";
import { renderMarkdown } from "./markdown";
import sitemap from "@/app/sitemap";

describe("four practical courses", () => {
  it("only serves the registered practical course IDs", () => {
    for (const id of PRACTICAL_COURSES) {
      expect(getPracticalCourse(id)?.labsHref).toMatch(/^\/downloads\/.*-labs\.zip$/);
    }
    for (const id of ["go", "system-design", "unknown", "../../courses.json"]) expect(getPracticalCourse(id)).toBeNull();
  });

  it("connects ordered lessons to catalogue, learning graph and sitemap", () => {
    const expected = { git: 14, linux: 14, databases: 13, algorithms: 16 };
    const urls = new Set(sitemap().map(entry => new URL(entry.url).pathname));
    for (const id of PRACTICAL_COURSES) {
      const chapters = getBookChapters(id);
      expect(chapters, id).toHaveLength(expected[id]);
      expect(chapters.map(c => c.order), id).toEqual(chapters.map((_, i) => i+1));
      const items = getLearningItems(id);
      expect(new Set(items.map(item => item.id)).size).toBe(items.length);
      for (const [index, chapter] of chapters.entries()) {
        const item = items.find(item => item.id === `${id}:chapter:${chapter.slug}`);
        expect(item?.href).toBe(`/${id}/book/${chapter.slug}`);
        expect(item?.relatedSkills).toContain(id);
        expect(item?.prerequisites).toEqual(index ? [`${id}:chapter:${chapters[index-1].slug}`] : []);
        expect(urls.has(`/${id}/book/${chapter.slug}`)).toBe(true);
      }
    }
  });

  it("renders every lesson through the reader pipeline", async () => {
    for (const id of PRACTICAL_COURSES) for (const chapter of getBookChapters(id)) {
      const html = await renderMarkdown(chapter.body);
      expect(html, `${id}/${chapter.slug}`).toContain("<h2");
      expect(html, `${id}/${chapter.slug}`).toContain("<pre");
      expect(html, `${id}/${chapter.slug}`).not.toContain("&lt;details");
    }
  }, 30000);
});
