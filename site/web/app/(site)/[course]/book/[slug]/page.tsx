import { notFound } from "next/navigation";
import { getBookChapter, getBookChapters } from "@/lib/content";
import { getPracticalCourse, PRACTICAL_COURSES } from "@/lib/practicalCourses";
import { BookChapterView } from "@/components/book/BookChapterView";
import { Mdx } from "@/components/Mdx";
import { extractToc } from "@/lib/toc";
export function generateStaticParams() {
  return PRACTICAL_COURSES.flatMap(course => getBookChapters(course).map(c => ({ course, slug: c.slug })));
}
export async function generateMetadata({ params }: { params: Promise<{ course: string; slug: string }> }) {
  const { course: id, slug } = await params;
  const course = getPracticalCourse(id);
  const chapter = course ? getBookChapters(id).find(c => c.slug === slug) : null;
  return { title: chapter ? `${chapter.title} — ${course?.short}` : "Глава не найдена" };
}
export default async function Page({ params }: { params: Promise<{ course: string; slug: string }> }) {
  const { course: id, slug } = await params;
  const course = getPracticalCourse(id);
  // Resolve through the catalogue before calling the filesystem reader.
  const chapters = course ? getBookChapters(id) : [];
  if (!course || !chapters.some(c => c.slug === slug)) notFound();
  const data = getBookChapter(slug, id);
  if (!data) notFound();
  const { chapter, prev, next } = data;
  return <BookChapterView slug={slug} title={chapter.title} order={chapter.order} minutes={chapter.minutes ?? null} toc={extractToc(chapter.body)} chapters={chapters.map(c => ({ slug: c.slug, title: c.title, index: c.order }))} prev={prev ? { slug: prev.slug, title: prev.title } : null} next={next ? { slug: next.slug, title: next.title } : null} basePath={`/${id}/book`} sectionLabel={course.short} version={course.version} versionDate={course.versionDate}><Mdx source={chapter.body} /></BookChapterView>;
}
