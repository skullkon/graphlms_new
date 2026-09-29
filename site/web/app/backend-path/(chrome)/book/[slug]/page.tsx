import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBackendStage, getBackendStages } from "@/lib/backend-path/content";
import { Mdx } from "@/components/Mdx";
import { extractToc } from "@/lib/toc";
import { BookChapterView } from "@/components/book/BookChapterView";
import { BackendCheckpoint } from "@/components/backend-path/BackendCheckpoint";
import { getCourse } from "@/lib/courses";
export function generateStaticParams() { return getBackendStages().map(s => ({ slug: s.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return { title: `${getBackendStage(slug)?.title ?? "Этап не найден"} — Backend на Go` }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params; const stage = getBackendStage(slug); if (!stage) notFound();
 const stages = getBackendStages(); const index = stages.findIndex(s => s.slug === slug); const prev = stages[index - 1]; const next = stages[index + 1]; const course = getCourse("backend-path");
 return <BookChapterView slug={slug} title={stage.title} order={stage.order} minutes={stage.minutes} toc={extractToc(stage.body)} chapters={stages.map(s => ({ slug: s.slug, title: s.title, index: s.order }))} prev={prev ?? null} next={next ?? null} basePath="/backend-path/book" sectionLabel="Бесплатный backend-путь" version={course?.version} versionDate={course?.versionDate}><Mdx source={stage.body} /><BackendCheckpoint stage={stage} criteria={Object.fromEntries(stages.map(s => [s.slug, s.checkpoint.length]))} /></BookChapterView>;
}
