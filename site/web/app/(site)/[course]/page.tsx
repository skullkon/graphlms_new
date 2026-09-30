import { notFound } from "next/navigation";
import { getBookChapters } from "@/lib/content";
import { getPracticalCourse, PRACTICAL_COURSES } from "@/lib/practicalCourses";
import { BookIndexView } from "@/components/book/BookIndexView";
import Link from "next/link";

export function generateStaticParams() { return PRACTICAL_COURSES.map(course => ({ course })); }
export async function generateMetadata({ params }: { params: Promise<{ course: string }> }) {
  const { course: id } = await params;
  const course = getPracticalCourse(id);
  return course ? { title: course.title, description: course.description, alternates: { canonical: `/${id}` } } : { title: "Курс не найден" };
}
export default async function Page({ params }: { params: Promise<{ course: string }> }) {
  const { course: id } = await params;
  const course = getPracticalCourse(id);
  if (!course) notFound();
  return <>
    <BookIndexView chapters={getBookChapters(id).map(c => ({ slug: c.slug, title: c.title, minutes: c.minutes ?? null }))} basePath={`/${id}/book`} title={course.title} description={course.description} sectionLabel="Бесплатный практический курс" />
    <section className="mdx" style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px 48px" }} aria-label="Практика курса">
      <h2>Как учиться</h2>
      <p>Проходите главы по порядку. Сначала выполните самостоятельное задание, затем сравните результат с критериями и прочитайте разбор. Время рядом с главой относится к чтению; на практику понадобится отдельное время.</p>
      <p>Сохраняйте команды, результаты и объяснения в своей рабочей папке. Финальное задание проверяет, можете ли вы собрать решение и объяснить его без пошаговой инструкции.</p>
      <p><Link href={course.labsHref}>Скачать бесплатный комплект лабораторий</Link>. Требования к среде и команды запуска указаны в README внутри архива и в первой главе. Для обязательных упражнений платное облако не требуется.</p>
    </section>
  </>;
}
