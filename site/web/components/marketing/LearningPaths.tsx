"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Braces, Layers3 } from "lucide-react";

export function LearningPaths({
  beginnerHref,
  firstProjectHref,
}: {
  beginnerHref: string;
  firstProjectHref: string;
}) {
  const [path, setPath] = useState<"beginner" | "builder">("beginner");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("graphlms.learning-path.v1");
      if (saved === "beginner" || saved === "builder") setPath(saved);
    } catch {
      /* The path picker also works without browser storage. */
    }
  }, []);
  function choosePath(next: "beginner" | "builder") {
    setPath(next);
    try {
      window.localStorage.setItem("graphlms.learning-path.v1", next);
    } catch {
      /* Private mode. */
    }
  }
  const beginner = path === "beginner";
  const steps = beginner
    ? [
        [
          "Разобраться с основами",
          "Переменные, условия, функции — с примерами на Go.",
          beginnerHref,
        ],
        [
          "Попробовать в деле",
          "Небольшие упражнения рядом с теорией.",
          "/go-basics/book",
        ],
        [
          "Перейти к системам",
          "Когда появится база — собрать свой первый сервер.",
          "/projects/http-server",
        ],
      ]
    : [
        [
          "Собрать HTTP-сервер",
          "Сокеты, разбор запроса и первый настоящий ответ.",
          firstProjectHref,
        ],
        [
          "Углубиться в конкурентность",
          "Горутины, каналы и задачи с проверкой кода.",
          "/go/practice",
        ],
        [
          "Разобрать сложную систему",
          "Redis, Git, SQLite — от протокола до реализации.",
          "/projects",
        ],
      ];
  return (
    <section
      className="path-picker"
      id="start"
      aria-label="Выбор учебного пути"
    >
      <div className="path-options" role="group" aria-label="Ваш опыт">
        <button aria-pressed={beginner} onClick={() => choosePath("beginner")}>
          <Braces size={23} />
          <span>
            <strong>Начинаю с нуля</strong>
            <small>Хочу научиться писать и понимать код</small>
          </span>
          <span className="path-radio">{beginner && <Check size={12} />}</span>
        </button>
        <button aria-pressed={!beginner} onClick={() => choosePath("builder")}>
          <Layers3 size={23} />
          <span>
            <strong>Уже пишу код</strong>
            <small>Хочу решать сложнее и понимать глубже</small>
          </span>
          <span className="path-radio">{!beginner && <Check size={12} />}</span>
        </button>
      </div>
      <div className="path-plan" key={path}>
        <div className="path-plan-intro">
          <span>Ваш следующий шаг</span>
          <h2>
            {beginner
              ? "Начните с первой строки."
              : "Постройте то, чем пользуетесь."}
          </h2>
          <p>
            {beginner
              ? "Не нужно знать всё заранее. Короткая глава, понятный пример — и вы уже пробуете сами."
              : "Возьмите знакомый инструмент и реализуйте его изнутри. В своей IDE, с проверкой каждого этапа."}
          </p>
          <Link
            className="academy-button"
            href={beginner ? beginnerHref : firstProjectHref}
          >
            {beginner ? "Открыть первый урок" : "Начать HTTP-сервер"}
            <ArrowUpRight size={18} />
          </Link>
          <small>Бесплатно · можно начать без аккаунта</small>
        </div>
        <ol className="path-steps">
          {steps.map(([title, description, href], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <Link href={href}>
                <strong>
                  {title}
                  <ArrowRight size={15} />
                </strong>
                <p>{description}</p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
