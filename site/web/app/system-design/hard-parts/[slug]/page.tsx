import Link from "next/link";
import { notFound } from "next/navigation";
import { getHardPart, getHardParts, getHardPartPrerequisite } from "@/lib/system-design/hardParts";
import { hardCheckpoints } from "@/lib/system-design/hardCheckpoints";
import { BookChapterView } from "@/components/book/BookChapterView";
import { Mdx } from "@/components/Mdx";
import { Notebook } from "@/components/system-design/Notebook";
import { extractToc } from "@/lib/toc";

export function generateStaticParams() { return getHardParts().map(part => ({ slug: part.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const part = getHardPart(slug);
  return { title: `${part?.title ?? "Блок не найден"} — углублённый System Design`, description: part?.summary };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const part = getHardPart(slug);
  if (!part) notFound();
  const parts = getHardParts();
  const index = parts.findIndex(candidate => candidate.slug === slug);
  return <BookChapterView slug={slug} progressSlug={`hard-part-${slug}`} title={part.title} order={part.order} minutes={null}
    toc={extractToc(part.body)} chapters={parts.map(candidate => ({ slug: candidate.slug, title: candidate.title, index: candidate.order }))}
    prev={parts[index - 1] ?? null} next={parts[index + 1] ?? null} basePath="/system-design/hard-parts" sectionLabel="Углублённый разбор">
    <p>{part.summary}</p>
    <nav aria-label="Базовые главы перед разбором">
      <p><strong>Перед разбором:</strong></p>
      <ul>{part.prerequisites.map(slug => { const prerequisite = getHardPartPrerequisite(slug); return prerequisite ? <li key={slug}><Link href={prerequisite.href}>{prerequisite.title}</Link></li> : null; })}</ul>
    </nav>
    <Mdx source={part.body} />
    <Notebook key={slug} id={`hard-part-${slug}`} checkpoint={hardCheckpoints[slug]} />
  </BookChapterView>;
}
