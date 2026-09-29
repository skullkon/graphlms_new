import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  BookOpen,
  Code2,
  Terminal,
  Check,
} from "lucide-react";
import { SiteHeader, Brand } from "@/components/SiteHeader";
import { LearningPaths } from "@/components/marketing/LearningPaths";
import { QuickChallenge } from "@/components/marketing/QuickChallenge";
import LearningReturn from "@/components/marketing/LearningReturn";
import { getChallenges } from "@/lib/projectLab.server";
import { getCourses } from "@/lib/courses";
import { getHardParts } from "@/lib/system-design/hardParts";
import { getAllTaskMeta, getBookChapters } from "@/lib/content";
import { AnalyticsPreferences } from "@/components/Analytics";
import "@/components/marketing/academy.css";

export const metadata: Metadata = {
  title: "Учиться. Пробовать. Создавать.",
  description:
    "Бесплатная практика программирования на русском. Начните с основ Go или соберите свой Redis, Git и HTTP-сервер. Теория, задачи и инженерные проекты в одном месте.",
  alternates: { canonical: "/" },
};
export default function HomePage() {
  const projects = getChallenges();
  const courses = getCourses();
  const chapters = courses.flatMap((c) =>
    getBookChapters(c.id).map((ch) => ({
      id: `${c.id}:chapter:${ch.slug}`,
      href: `/${c.slug}/book/${ch.slug}`,
      title: ch.title,
      kind: "chapter" as const,
      courseId: c.id,
    })),
  );
  const tasks = courses.flatMap((c) =>
    getAllTaskMeta(c.id).map((t) => ({
      id: t.id,
      href: `/${c.slug}/tasks/${t.slug}`,
      title: t.title,
      kind: "task" as const,
      courseId: c.id,
    })),
  );
  chapters.push(...getHardParts().map(part => ({
    id: `system-design:chapter:hard-part-${part.slug}`,
    href: `/system-design/hard-parts/${part.slug}`,
    title: part.title,
    kind: "chapter" as const,
    courseId: "system-design",
  })));
  const beginnerHref =
    chapters.find((c) => c.courseId === "go-basics")?.href || "/go-basics/book";
  const http = projects.find((p) => p.slug === "http-server")!;
  const featured = ["http-server", "redis", "git", "sqlite"].map((slug) =>
    projects.find((p) => p.slug === slug)!,
  );
  return (
    <div className="academy">
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className="academy-wrap academy-return">
          <LearningReturn
            items={[...chapters, ...tasks]}
            taskCount={tasks.length}
          />
        </div>
        <section className="academy-hero academy-wrap">
          <div className="academy-hero-copy">
            <div className="academy-kicker">
              <span />
              Открытая среда для разработчиков
            </div>
            <h1>
              От первой строки
              <br />
              до своей <em>системы.</em>
            </h1>
            <p>
              Здесь учатся не только читать код.
              <br />
              Здесь пробуют, ошибаются, разбираются —
              <br className="desktop-break" /> и создают то, что работает.
            </p>
            <a className="academy-hero-link" href="#start">
              Найдите свою точку старта <ArrowRight size={19} />
            </a>
            <div className="academy-hero-notes">
              <span>
                <Check size={14} /> Бесплатно
              </span>
              <span>На русском</span>
              <span>В вашем темпе</span>
            </div>
          </div>
          <figure className="academy-hero-art">
            <Image
              src="/images/learning-construction.png"
              alt="Инженерный конструктор: синие и светлые детали собираются в многоуровневую систему"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 700px) 100vw, 55vw"
            />
            <figcaption>
              <span>
                Маленькие шаги.
                <br />
                <strong>Сложные вещи.</strong>
              </span>
              <span className="art-caption-index">[01 → ∞]</span>
            </figcaption>
          </figure>
        </section>
        <div className="academy-wrap">
          <LearningPaths
            beginnerHref={beginnerHref}
            firstProjectHref={`/projects/http-server/${http.stages[0].slug}`}
          />
        </div>
        <section className="academy-practice academy-wrap" id="practice">
          <div className="academy-section-copy">
            <span className="academy-eyebrow">
              Понять. Проверить. Запомнить.
            </span>
            <h2>
              Не откладывайте
              <br />
              на «когда-нибудь».
            </h2>
            <p>
              Первую маленькую задачу можно решить прямо сейчас. Никакой
              подготовки — выберите уровень и попробуйте.
            </p>
            <div className="practice-note">
              <Code2 size={20} />
              <span>
                Ответ важен.
                <br />
                <strong>Понять почему — ещё важнее.</strong>
              </span>
            </div>
          </div>
          <QuickChallenge />
        </section>
        <section className="academy-build" id="projects">
          <div className="academy-wrap academy-build-layout">
            <div className="academy-section-copy">
              <span className="academy-eyebrow">Для тех, кто хочет глубже</span>
              <h2>
                Когда-нибудь
                <br />
                вы напишете
                <br />
                <em>свой Redis.</em>
              </h2>
              <p>
                А начать можно сегодня. Реальные системы, разобранные на
                посильные этапы. Ваш редактор, ваш код, настоящие тесты.
              </p>
              <Link className="academy-button light" href="/projects">
                Выбрать из {projects.length} проектов <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="academy-projects">
              {featured.map((p, i) => (
                <Link href={`/projects/${p.slug}`} key={p.slug}>
                  <span className="academy-project-number">0{i + 1}</span>
                  <div>
                    <strong>{p.shortName}</strong>
                    <p>
                      {p.slug === "http-server"
                        ? "От сокета до ответа на запрос"
                        : p.slug === "redis"
                          ? "От PING до репликации"
                          : p.slug === "git"
                            ? "От первого объекта до клонирования"
                            : "От файла базы до SQL-запроса"}
                    </p>
                  </div>
                  <span className="academy-project-stages">
                    {p.stages.length}
                    <small>
                      {new Intl.PluralRules("ru").select(p.stages.length) ===
                      "few"
                        ? "этапа"
                        : "этапов"}
                    </small>
                  </span>
                  <ArrowUpRight size={24} />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="academy-rhythm academy-wrap">
          <div className="academy-rhythm-heading">
            <span className="academy-eyebrow">
              Место, куда хочется возвращаться
            </span>
            <h2>
              Не марафон на силу воли.
              <br />
              Практика, которая складывается.
            </h2>
          </div>
          <div className="academy-rhythm-grid">
            <article>
              <BookOpen size={25} />
              <h3>Один понятный шаг</h3>
              <p>
                Откройте главу или выберите этап проекта. Не нужно держать весь
                учебный план в голове.
              </p>
              <Link href="/learn">
                Найти тему <ArrowRight size={15} />
              </Link>
            </article>
            <article>
              <Terminal size={25} />
              <h3>Обратная связь по делу</h3>
              <p>
                Запускайте проверки, читайте вывод и исправляйте решение. Ошибка
                — часть работы, а не повод остановиться.
              </p>
              <Link href="/go/practice">
                Открыть практику <ArrowRight size={15} />
              </Link>
            </article>
            <article>
              <Check size={25} />
              <h3>Ваш прогресс остаётся</h3>
              <p>
                Решённые задачи сохраняются в браузере. Вернитесь к последнему
                материалу с главной; аккаунт добавит синхронизацию.
              </p>
              <Link href="/account">
                Мой прогресс <ArrowRight size={15} />
              </Link>
            </article>
          </div>
        </section>
        <section className="academy-library academy-wrap" id="courses">
          <div className="academy-library-title">
            <div>
              <span className="academy-eyebrow">
                Теория, к которой возвращаются
              </span>
              <h2>Соберите крепкую базу.</h2>
            </div>
            <Link href="/learn">
              Вся библиотека <ArrowRight size={17} />
            </Link>
          </div>
          <div className="academy-books">
            {courses.map((c, i) => (
              <Link
                className={`academy-book book-${i}`}
                href={c.id === "os" ? "/os" : `/${c.slug}/book`}
                key={c.id}
              >
                <div className="academy-book-cover">
                  <span>GraphLMS / Учебник</span>
                  <strong>
                    {c.id === "go-basics"
                      ? "Go_"
                      : c.id === "go"
                        ? "go func()"
                        : c.id === "system-design" ? "API → DB" : "OS /"}
                  </strong>
                  <div>
                    <span>
                      {c.id === "go-basics"
                        ? "Начните здесь"
                        : c.id === "go"
                          ? "Думайте параллельно"
                          : c.id === "system-design" ? "Спроектируйте систему" : "Загляните под капот"}
                    </span>
                    <ArrowUpRight size={26} />
                  </div>
                </div>
                <div className="academy-book-label">
                  <h3>{c.title}</h3>
                  <span>{getBookChapters(c.id).length} глав</span>
                </div>
                <p>
                  {c.id === "go-basics"
                    ? "Синтаксис, типы, функции и первый работающий код."
                    : c.id === "go"
                      ? "Горутины, каналы, синхронизация и контекст."
                      : c.id === "system-design" ? "Нагрузка, данные, сбои и архитектурные решения." : "Процессы, память, файловые системы и симуляторы."}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="academy-faq academy-wrap">
          <h2>Остались вопросы?</h2>
          <div>
            {[
              [
                "Я никогда не программировал. Мне подойдёт?",
                "Да. Выберите «Начинаю с нуля»: маршрут откроет основы Go. Начните с первой главы, запускайте примеры и двигайтесь в своём темпе. К системным проектам можно перейти позже.",
              ],
              [
                "А если я уже работаю разработчиком?",
                "Выберите «Уже пишу код». Вам доступны задачи по конкурентности Go, лаборатории по ОС и 11 проектов: собственные HTTP-сервер, Redis, Git, SQLite и другие системы.",
              ],
              [
                "Это действительно бесплатно?",
                "Учебники, задачи и локальные проверки доступны бесплатно. В проекте Claude Code отдельно нужны ключ и оплаченные запросы к внешнему API OpenRouter. Для остальных проектов эта интеграция не требуется.",
              ],
              [
                "Нужно ли создавать аккаунт?",
                "Начать можно без регистрации. Прогресс учебных задач сохраняется в этом браузере; аккаунт нужен для синхронизации между устройствами. Результаты локальных проектных тестеров отображаются отдельно в проекте.",
              ],
              [
                "Откуда взяты инженерные проекты?",
                "Используем открытые задания CodeCrafters под лицензией MIT. Материалы переведены на русский, ссылки на оригиналы сохранены. Решения вы пишете и проверяете локально на своём компьютере.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={19} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="academy-finale academy-wrap">
          <span>Не нужно быть готовым ко всему.</span>
          <h2>
            Достаточно начать
            <br />с <em>одного шага.</em>
          </h2>
          <a className="academy-button" href="#start">
            Выбрать свой путь <ArrowUpRight size={19} />
          </a>
          <p>Без регистрации. Без дедлайна. С интересом.</p>
        </section>
      </main>
      <footer className="academy-footer academy-wrap">
        <Brand />
        <span>Учиться. Пробовать. Создавать.</span>
        <div>
          <Link href="/learn">Библиотека</Link>
          <Link href="/projects">Проекты</Link>
          <Link href="/changelog">Что нового</Link>
          <AnalyticsPreferences />
        </div>
      </footer>
    </div>
  );
}
