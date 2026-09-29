"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadCode, useLearningEvents } from "@/lib/progress";

export function HardPartProgress({ parts }: { parts: { slug: string; title: string }[] }) {
  const events = useLearningEvents();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const completed = new Set(events.filter(event => event.type === "completed" && event.courseId === "system-design").map(event => event.itemId));
  const passed = (slug: string) => completed.has(`system-design:chapter:hard-part-${slug}`)
    || (ready && loadCode(`check-hard-part-${slug}`, "system-design") === "passed");
  const count = parts.filter(part => passed(part.slug)).length;
  const next = parts.find(part => !passed(part.slug));
  return <div>
    <p>Проверочные вопросы углублённых блоков: {count} из {parts.length}. Этот прогресс считается отдельно от 16 базовых глав.</p>
    {next ? <Link href={`/system-design/hard-parts/${next.slug}`}>{count ? "Следующий непройденный блок" : "Начать с первого блока"}: {next.title} →</Link> : parts.length > 0 ? <p>Все проверочные вопросы пройдены. Разборы и практические задания стоит проверить отдельно.</p> : null}
  </div>;
}
