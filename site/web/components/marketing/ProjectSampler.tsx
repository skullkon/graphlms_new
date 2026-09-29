"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown, CornerDownRight } from "lucide-react";

const examples = [
  {
    slug: "http-server",
    name: "HTTP-сервер",
    protocol: "HTTP / 1.1",
    title: "От запроса до ответа.",
    description:
      "Откройте сокет, разберите HTTP-запрос и отправьте первый ответ. Затем добавьте маршруты, файлы и сжатие.",
    request: "GET /hello HTTP/1.1\nHost: localhost:4221\nAccept: */*",
    response:
      "HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: 13\n\nHello, world!",
    label: "Текстовый протокол поверх TCP",
  },
  {
    slug: "redis",
    name: "Redis",
    protocol: "RESP / 2",
    title: "Своя база. В памяти.",
    description:
      "Реализуйте протокол Redis: от ответа на PING до хранения ключей, времени жизни данных и репликации.",
    request: "*1\r\n$4\r\nPING\r\n",
    response: "+PONG\r\n",
    label: "Массив команд → простой ответ",
  },
  {
    slug: "dns-server",
    name: "DNS-сервер",
    protocol: "DNS / UDP",
    title: "Как имя становится адресом.",
    description:
      "Разберите бинарный пакет, прочитайте доменное имя и соберите DNS-ответ. Всё начинается с одного UDP-сокета.",
    request: ";; QUESTION SECTION:\nexample.com.    IN    A",
    response:
      ";; ANSWER SECTION:\nexample.com.    60    IN    A    93.184.215.14",
    label: "Читаемое представление DNS-пакета",
  },
];

export function ProjectSampler({ counts }: { counts: Record<string, number> }) {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return (
    <section className="sample" aria-label="Примеры инженерных проектов">
      <div className="sample-tabs" aria-label="Выберите пример">
        {examples.map((item, index) => (
          <button
            key={item.slug}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span>0{index + 1}</span>
            {item.name}
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="sample-body">
        <div
          className="sample-wire"
          aria-label={`Пример обмена по протоколу ${example.protocol}`}
        >
          <div className="sample-wire-head">
            <span>{example.protocol}</span>
            <span>Пример обмена</span>
          </div>
          <div className="sample-packet">
            <span className="sample-packet-label">
              Клиент <CornerDownRight size={14} />
            </span>
            <pre>{example.request}</pre>
          </div>
          <div className="sample-connector">
            <ArrowDown size={18} />
            <span>Ваша реализация</span>
          </div>
          <div className="sample-packet response">
            <span className="sample-packet-label">
              Сервер <CornerDownRight size={14} />
            </span>
            <pre>{example.response}</pre>
          </div>
          <p className="sample-wire-note">{example.label}</p>
        </div>
        <div className="sample-detail">
          <span className="sample-detail-count">
            {`${counts[example.slug]} ${new Intl.PluralRules("ru").select(counts[example.slug]) === "few" ? "этапа" : "этапов"} · локальная разработка`}
          </span>
          <h2>{example.title}</h2>
          <p>{example.description}</p>
          <Link className="marketing-link" href={`/projects/${example.slug}`}>
            {`Собрать ${example.name}`}
            <ArrowRight size={18} />
          </Link>
          <div className="sample-detail-foot">
            <span>Свой редактор</span>
            <span>Задания на русском</span>
          </div>
        </div>
      </div>
    </section>
  );
}
