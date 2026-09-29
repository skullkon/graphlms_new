import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Database, GitBranch, Globe, Terminal, Search, HardDrive, Code2, Bot } from "lucide-react";
import { getChallenges } from "@/lib/projectLab.server";
import "@/components/project-lab/project-lab.css";
export const metadata: Metadata = {
  title: "Инженерные проекты — GraphLMS",
  description:
    "Настоящие инженерные проекты: пишите код в своей IDE и проверяйте локальными тестерами.",
};
const stageWord = (n: number) => ({ one: "этап", few: "этапа", many: "этапов", other: "этапов", zero: "этапов", two: "этапа" })[new Intl.PluralRules("ru").select(n)];
export default function ProjectsPage() {
  const challenges = getChallenges();
  return (
    <div className="lab lab-catalog-page">
      <header className="lab-hero">
        <p className="lab-eyebrow">Практика / Проектная лаборатория</p>
        <h1>Поймите систему.<br /><span>Постройте свою.</span></h1>
        <p className="lab-lead">
          HTTP-сервер, Redis, Git и другие системы изнутри. Настоящие задания
          CodeCrafters, ваша IDE и локальная проверка каждого этапа.
        </p>
        <div className="lab-facts">
          <span>{challenges.length} проектов</span>
          <span>
            {challenges.reduce((n, c) => n + c.stages.length, 0)} этапов
          </span>
          <span>Ваш редактор · ваш код</span>
        </div>
      </header>
      <div className="lab-section-heading"><h2>Первый backend-проект на Go</h2><Link href="/learn/backend">Бесплатный путь с заготовкой и тестами ↗</Link></div>
      <div className="lab-section-heading">
        <h2>Инженерные проекты <span className="lab-count">{challenges.length}</span></h2>
        <Link href="/projects/tracks">Учебные треки GraphLMS ↗</Link>
      </div>
      <div className="lab-catalog">
        {challenges.map((c, i) => {
          const Icon = c.slug.includes("redis") ? Database : c.slug.includes("git") ? GitBranch : c.slug.includes("http") || c.slug.includes("dns") ? Globe : c.slug.includes("shell") ? Terminal : c.slug.includes("grep") ? Search : c.slug.includes("sqlite") || c.slug.includes("bittorrent") ? HardDrive : c.slug.includes("claude") ? Bot : Code2;
          return (
            <Link className="lab-card" href={`/projects/${c.slug}`} key={c.slug}>
              <div className="lab-project-icon"><Icon size={25} strokeWidth={1.5} /></div>
              <div className="lab-card-copy">
                <div className="lab-card-top"><span className="lab-number">{String(i + 1).padStart(2, "0")}</span><span>{c.stages.length} {stageWord(c.stages.length)}</span></div>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
                <div className="lab-card-bottom"><span>{c.languages.slice(0, 4).join(" / ")}{c.languages.length > 4 ? ` +${c.languages.length - 4}` : ""}</span>{c.slug === "claude-code" && <span>Нужен OpenRouter API</span>}</div>
              </div>
              <ArrowUpRight className="lab-card-arrow" size={19} strokeWidth={1.5} />
            </Link>
          );
        })}
      </div>
      <section className="lab-method">
        <p className="lab-eyebrow">От задания до работающего кода</p>
        <div>
          <h3>01 / Откройте IDE</h3>
          <p>
            Создайте проект локальной CLI-командой. Код остаётся на вашем
            компьютере.
          </p>
        </div>
        <div>
          <h3>02 / Реализуйте этап</h3>
          <p>
            Читайте требования, пишите решение и запускайте его в привычном
            окружении.
          </p>
        </div>
        <div>
          <h3>03 / Проверьте результат</h3>
          <p>
            CLI запускает локальный тестер. Результат и вывод проверки появятся
            на странице проекта.
          </p>
        </div>
      </section>
    </div>
  );
}
