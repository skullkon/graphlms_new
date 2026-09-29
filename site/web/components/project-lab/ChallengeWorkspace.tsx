"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Terminal,
  BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Challenge, ProjectLabRun } from "@/lib/projectLab";

type Run = ProjectLabRun;

const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
function Command({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <div className="lab-command">
      <pre>
        <code>{value}</code>
      </pre>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Скопировано" : "Копировать"}
      </button>
      {failed && (
        <small role="status">Выделите и скопируйте команду вручную.</small>
      )}
    </div>
  );
}
export function ChallengeWorkspace({
  challenge,
  stageSlug,
  html,
  cliPath,
}: {
  challenge: Challenge;
  stageSlug?: string;
  html?: string;
  cliPath: string;
}) {
  const groupName = (group: string) =>
    group === "base" || !group
      ? "Основные этапы"
      : (
          challenge as Challenge & {
            extensions?: { slug: string; name: string }[];
          }
        ).extensions?.find((e) => e.slug === group)?.name ||
        group
          .replace(/[-_]/g, " ")
          .replace(/^./, (letter) => letter.toUpperCase());
  const [stageNavigationOpen, setStageNavigationOpen] = useState(false);
  const [language, setLanguage] = useState(
    challenge.languages.includes("go") ? "go" : challenge.languages[0] || "go",
  );
  const [runs, setRuns] = useState<Run[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let stopped = false;
    let controller: AbortController | undefined;
    async function refresh() {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(
          `/api/project-lab/runs?challenge=${encodeURIComponent(challenge.slug)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Не удалось получить результаты");
        const data = await response.json();
        if (!stopped) {
          setRuns(data.runs || []);
          setEnabled(data.enabled);
          setError("");
        }
      } catch (e) {
        if (!stopped && !(e instanceof Error && e.name === "AbortError"))
          setError("Нет связи с локальной проверкой. Повторим автоматически.");
      }
    }
    void refresh();
    const timer = setInterval(refresh, 8000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stopped = true;
      controller?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [challenge.slug]);
  const index = challenge.stages.findIndex((s) => s.slug === stageSlug);
  const stage = challenge.stages[index];
  const passed = new Set(
    runs
      .filter((r) => r.language === language)
      .flatMap((r) =>
        r.passedStages?.length ? r.passedStages : r.passed ? [r.stage] : [],
      )
      .filter((slug) => challenge.stages.some((s) => s.slug === slug)),
  );
  const latest = runs.find(
    (r) =>
      (!stageSlug ||
        r.stage === stageSlug ||
        r.passedStages?.includes(stageSlug)) &&
      r.language === language,
  );
  const groups = Array.from(new Set(challenge.stages.map((s) => s.group)));
  const cli = `node ${quote(cliPath)}`;
  return (
    <div className="lab lab-workspace">
      <div className="lab-breadcrumb">
        <Link href="/projects">
          <ArrowLeft size={13} /> Все проекты
        </Link>
        <span>/</span>
        <Link href={`/projects/${challenge.slug}`}>{challenge.shortName}</Link>
        {stage && (
          <>
            <span>/</span>
            <span>Этап {index + 1}</span>
          </>
        )}
      </div>
      <header className="lab-workspace-heading">
        <div>
          <p className="lab-eyebrow">Проектная лаборатория</p>
          <h1>{challenge.title}</h1>
        </div>
        <div className="lab-progress-summary">
          <strong>
            {passed.size}
            <span> / {challenge.stages.length}</span>
          </strong>
          <small>этапов пройдено</small>
          <progress
            value={passed.size}
            max={challenge.stages.length}
            aria-label="Пройдено этапов"
          />
        </div>
      </header>
      <div className="lab-workbench">
        <aside className="lab-rail">
          <details
            className="lab-mobile-stage-toggle"
            open={stageNavigationOpen}
            onToggle={(event) =>
              setStageNavigationOpen(event.currentTarget.open)
            }
          >
            <summary>
              Этапы проекта{" "}
              <span>
                {stage
                  ? `${index + 1} / ${challenge.stages.length}`
                  : `${challenge.stages.length} этапов`}
              </span>
            </summary>
          </details>
          <div
            className={`lab-stage-list${stageNavigationOpen ? " is-open" : ""}`}
          >
            <Link
              className={!stage ? "is-active" : ""}
              href={`/projects/${challenge.slug}`}
            >
              <BookOpen size={15} /> Обзор и настройка{" "}
              <ArrowUpRight size={13} />
            </Link>
            {groups.map((group) => (
              <div className="lab-stage-group" key={group}>
                <h2>{groupName(group)}</h2>
                {challenge.stages
                  .filter((s) => s.group === group)
                  .map((s) => (
                    <Link
                      key={s.slug}
                      className={s.slug === stageSlug ? "is-active" : ""}
                      aria-current={s.slug === stageSlug ? "page" : undefined}
                      href={`/projects/${challenge.slug}/${s.slug}`}
                    >
                      <span
                        className={
                          passed.has(s.slug)
                            ? "lab-stage-dot passed"
                            : "lab-stage-dot"
                        }
                      >
                        {passed.has(s.slug) ? (
                          <Check size={11} />
                        ) : (
                          challenge.stages.indexOf(s) + 1
                        )}
                      </span>
                      <span>{s.name}</span>
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </aside>
        <div className="lab-main">
          <div className="lab-article">
            {stage ? (
              <>
                <p className="lab-eyebrow">
                  Этап {String(index + 1).padStart(2, "0")} ·{" "}
                  {groupName(stage.group)}
                </p>
                <h2 className="lab-stage-title">{stage.name}</h2>
                <p className="lab-caption">
                  Русский перевод заданий CodeCrafters. Примеры подготовлены для
                  Go. Выбор языка меняет команды и результаты, но не текст
                  задания.
                </p>
                {stage.prerequisites?.length ? (
                  <p className="lab-notice">
                    Предыдущие этапы: {stage.prerequisites.join(", ")}
                  </p>
                ) : null}
                <div
                  className="lab-docs prose"
                  dangerouslySetInnerHTML={{ __html: html || "" }}
                />
              </>
            ) : (
              <>
                <p className="lab-eyebrow">Начало работы</p>
                <h2 className="lab-stage-title">О проекте</h2>
                <p className="lab-lead">{challenge.description}</p>
                <p>
                  Разберите систему шаг за шагом: каждый этап добавляет новое
                  поведение и проверяется тестером на вашем компьютере.
                </p>
                <div className="lab-overview-facts">
                  <div>
                    <strong>{challenge.stages.length}</strong>
                    <span>практических этапов</span>
                  </div>
                  <div>
                    <strong>{challenge.languages.length}</strong>
                    <span>языков в исходном курсе</span>
                  </div>
                  <div>
                    <strong>Локально</strong>
                    <span>IDE и выполнение</span>
                  </div>
                </div>
                <p className="lab-notice">
                  Задания импортированы из открытого репозитория CodeCrafters.
                  Условия переведены на русский, примеры подготовлены для Go;
                  наличие языка в исходном курсе не означает, что его окружение
                  проверено здесь.
                </p>
                {challenge.stages[0] && (
                  <Link
                    className="lab-primary-link"
                    href={`/projects/${challenge.slug}/${challenge.stages[0].slug}`}
                  >
                    Перейти к первому этапу →
                  </Link>
                )}
              </>
            )}
          </div>
          <section className="lab-setup">
            {challenge.slug === "claude-code" && (
              <p className="lab-notice">
                Для проверки этого проекта нужен ключ OpenRouter в переменной
                CODECRAFTERS_SECRET_OPENROUTER_API_KEY. Запросы к модели могут
                быть платными. Ключ задаётся только в вашем терминале и не
                отправляется в GraphLMS.
              </p>
            )}
            <div className="lab-section-heading">
              <h2>
                {stage ? "Проверка в вашей IDE" : "Настройте локальный проект"}
              </h2>
              <label className="lab-language">
                Язык{" "}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {challenge.languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p>
              Нужны Node.js, Git, Go 1.24+ для тестеров и инструменты выбранного
              языка. Тестеры загружаются и запускаются локально; отдельным
              проектам нужны дополнительные системные зависимости.
            </p>
            {stage ? (
              <details className="lab-setup-details">
                <summary>Настройка проекта и IDE</summary>
                <h3>1. Создайте проект один раз</h3>
                <Command
                  value={`${cli} init ${challenge.slug} ./my-${challenge.slug} --language ${language}`}
                />
                <h3>2. Откройте папку в IDE</h3>
                <Command value={`cd ./my-${challenge.slug}`} />
                <p>Реализуйте требования этапа в созданном проекте.</p>
              </details>
            ) : (
              <>
                <h3>1. Создайте проект один раз</h3>
                <Command
                  value={`${cli} init ${challenge.slug} ./my-${challenge.slug} --language ${language}`}
                />
                <h3>2. Откройте папку в IDE</h3>
                <Command value={`cd ./my-${challenge.slug}`} />
                <p>Реализуйте требования этапа в созданном проекте.</p>
              </>
            )}
            <h3>
              {stage
                ? "Запустите из папки проекта"
                : "3. Отправьте решение на локальную проверку"}
            </h3>
            <Command
              value={`${cli} submit --stage ${stage?.slug || challenge.stages[0]?.slug || ""}${challenge.slug === "claude-code" ? " --allow-paid-api" : ""}`}
            />
            <p className="lab-caption">
              Запускайте submit из папки проекта. Это локальные проверки, а не
              сертификаты или результаты аккаунта CodeCrafters.
            </p>
          </section>
          <section className="lab-results" aria-live="polite">
            <div className="lab-section-heading">
              <h2>Результат проверки</h2>
              <span className="lab-eyebrow">{language} / ЛОКАЛЬНО</span>
            </div>
            {error ? (
              <p className="lab-notice">{error}</p>
            ) : enabled === false ? (
              <p className="lab-notice">
                Локальный мост выключен. Запустите сайт с переменной
                PROJECT_LAB_LOCAL=1, чтобы получать результаты CLI.
              </p>
            ) : enabled === null ? (
              <p>Подключение к локальной проверке…</p>
            ) : null}
            {latest ? (
              <>
                <div className="lab-run-meta">
                  <strong className={latest.passed ? "lab-pass" : "lab-fail"}>
                    {latest.passed
                      ? "✓ Проверка пройдена"
                      : "Проверка не пройдена"}
                  </strong>
                  <span>
                    {new Date(latest.submittedAt).toLocaleString("ru-RU")} ·{" "}
                    {(latest.durationMs / 1000).toFixed(1)} с
                  </span>
                </div>
                <pre className="lab-output">
                  {latest.output || "Тестер завершился без вывода."}
                </pre>
              </>
            ) : (
              <div className="lab-empty">
                <Terminal size={22} strokeWidth={1.5} />
                <h3>Здесь появится результат</h3>
                <p>
                  Запустите submit в терминале. Страница обновляет результаты
                  каждые 8 секунд.
                </p>
              </div>
            )}
          </section>
          {stage && (
            <nav className="lab-stage-nav">
              {index > 0 ? (
                <Link
                  href={`/projects/${challenge.slug}/${challenge.stages[index - 1].slug}`}
                >
                  <small>← Предыдущий этап</small>
                  {challenge.stages[index - 1].name}
                </Link>
              ) : (
                <span />
              )}
              {index < challenge.stages.length - 1 ? (
                <Link
                  href={`/projects/${challenge.slug}/${challenge.stages[index + 1].slug}`}
                >
                  <small>Следующий этап →</small>
                  {challenge.stages[index + 1].name}
                </Link>
              ) : (
                <Link href="/projects">
                  <small>Продолжить практику →</small>Выбрать следующий проект
                </Link>
              )}
            </nav>
          )}
          <footer className="lab-source">
            <a href={challenge.upstreamUrl} target="_blank" rel="noreferrer">
              Исходные задания CodeCrafters ↗
            </a>
            <span>Версия {challenge.sourceCommit.slice(0, 8)}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
