"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
const questions = [
  {
    label: "Основы",
    code: "total := 0\nfor i := 1; i <= 3; i++ {\n    total += i\n}\nfmt.Println(total)",
    options: ["3", "6", "7", "123"],
    answer: "6",
    explanation:
      "Цикл складывает 1, 2 и 3. Поэтому total становится равен 6. Вы только что разобрали накопление значения в цикле.",
    hint: "Проследите, как меняется total после каждого прохода: сначала прибавляется 1, потом 2, потом 3.",
    href: "/go-basics/book",
    link: "Разобраться с основами Go",
  },
  {
    label: "Уже в теме",
    code: 'func main() {\n    defer fmt.Print("A")\n    fmt.Print("B")\n}',
    options: ["AB", "BA", "A", "Ошибка"],
    answer: "BA",
    explanation:
      "defer откладывает вызов до выхода из функции. Сначала выполняется обычный Print и печатает B, затем отложенный вызов печатает A.",
    hint: "Вызов после defer не выполняется сразу: он ждёт выхода из функции main.",
    href: "/go/practice",
    link: "Перейти к практике",
  },
];
export function QuickChallenge() {
  const [level, setLevel] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const q = questions[level];
  const correct = answer === q.answer;
  return (
    <div className="quick-challenge">
      <div className="quick-top">
        <span>Разминка / Go</span>
        <div role="group" aria-label="Уровень разминки">
          {questions.map((x, i) => (
            <button
              key={x.label}
              aria-pressed={level === i}
              onClick={() => {
                setLevel(i);
                setAnswer(null);
              }}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="quick-code">
        <div className="quick-line-numbers" aria-hidden="true">
          {q.code.split("\n").map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre>
          <code>{q.code}</code>
        </pre>
      </div>
      <div className="quick-answer">
        <h3>Что выведет этот код?</h3>
        <div className="quick-options">
          {q.options.map((option) => (
            <button
              key={option}
              aria-pressed={answer === option}
              className={
                answer === option ? (correct ? "is-correct" : "is-wrong") : ""
              }
              onClick={() => setAnswer(option)}
            >
              {option}
              {answer === option && correct && <Check size={16} />}
            </button>
          ))}
        </div>
        <div className="quick-feedback" aria-live="polite">
          {answer ? (
            <>
              <strong>{correct ? "Именно так." : "Попробуйте ещё раз."}</strong>
              <p>{correct ? q.explanation : q.hint}</p>
              {correct ? (
                <Link href={q.href}>
                  {q.link}
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button onClick={() => setAnswer(null)}>
                  <RotateCcw size={13} />
                  Сбросить ответ
                </button>
              )}
            </>
          ) : (
            <p>Выберите ответ. Объяснение появится сразу.</p>
          )}
        </div>
      </div>
    </div>
  );
}
