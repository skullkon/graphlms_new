import { redirect, notFound } from "next/navigation";
import { getPracticalCourse, PRACTICAL_COURSES } from "@/lib/practicalCourses";
export function generateStaticParams() { return PRACTICAL_COURSES.map(course => ({ course })); }
export default async function Page({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  if (!getPracticalCourse(course)) notFound();
  redirect(`/${course}`);
}
