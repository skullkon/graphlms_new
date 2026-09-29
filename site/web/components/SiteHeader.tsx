"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  Braces,
  ChevronDown,
  ChevronRight,
  Code2,
  FlaskConical,
  GraduationCap,
  Layers3,
  Menu,
  Search,
  Users,
  X,
  ChartNoAxesCombined,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const primary = [
  { href: "/projects", label: "Проекты", icon: Layers3 },
  { href: "/learn", label: "Курсы", icon: BookOpen },
  { href: "/go/practice", label: "Практика", icon: Code2 },
];
const personal = [
  { href: "/account", label: "Мой прогресс", icon: ChartNoAxesCombined },
  { href: "/account/report", label: "Отчёт о навыках", icon: GraduationCap },
  {
    href: "/go/interview",
    label: "Подготовка к интервью",
    icon: MessageSquare,
  },
  { href: "/teams", label: "Моя команда", icon: Users },
  { href: "/os/labs", label: "Лаборатории", icon: FlaskConical },
];

export function Brand() {
  return (
    <Link href="/" className="product-brand" aria-label="GraphLMS — главная">
      <Braces size={25} strokeWidth={2} />
      <span>
        graph<span>lms</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    if (account.current) account.current.open = false;
  }, [path]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(false);
        setSearchOpen((value) => !value);
      }
      if (event.key === "Escape" && account.current)
        account.current.open = false;
    };
    const outside = (event: PointerEvent) => {
      if (account.current && !account.current.contains(event.target as Node))
        account.current.open = false;
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("pointerdown", outside);
    };
  }, []);
  const active = (href: string) =>
    path === href || (href !== "/account" && path.startsWith(href + "/"));
  const results = [
    ...primary,
    ...personal,
    { href: "/go-basics/book", label: "Основы Go", icon: BookOpen },
    { href: "/go/book", label: "Конкурентность Go", icon: Braces },
    { href: "/os", label: "Операционные системы", icon: Layers3 },
    { href: "/system-design", label: "Проектирование систем · System Design", icon: Layers3 },
  ].filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const links = (items: typeof primary) =>
    items.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        aria-current={active(href) ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        {label}
      </Link>
    ));
  return (
    <>
      <header className="product-header">
        <div className="product-header-inner">
          <Brand />
          <nav className="product-nav" aria-label="Основная навигация">
            {links(primary)}
          </nav>
          <div className="product-header-actions">
            <button
              className="product-search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск по платформе"
            >
              <Search size={17} />
              <span>Поиск</span>
              <kbd>⌘ K</kbd>
            </button>
            <details className="product-account" ref={account}>
              <summary>
                <span>{user ? user.email.split("@")[0] : "Мой профиль"}</span>
                <ChevronDown size={14} />
              </summary>
              <div className="product-account-menu">
                {links(personal)}
                {user ? (
                  <button
                    onClick={() => {
                      if (account.current) account.current.open = false;
                      logout();
                    }}
                  >
                    <LogOut size={15} />
                    Выйти
                  </button>
                ) : (
                  <Link href="/auth">Войти в аккаунт</Link>
                )}
              </div>
            </details>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button
                  className="product-mobile-trigger"
                  aria-label="Открыть меню"
                >
                  <Menu size={21} />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="product-dialog-overlay" />
                <Dialog.Content className="product-mobile-menu">
                  <Dialog.Title className="sr-only">Навигация</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Разделы учебной платформы
                  </Dialog.Description>
                  <Brand />
                  <Dialog.Close
                    className="product-dialog-close"
                    aria-label="Закрыть меню"
                  >
                    <X size={20} />
                  </Dialog.Close>
                  <nav aria-label="Мобильная навигация">
                    {links(primary)}
                    <hr />
                    {links(personal)}
                    <hr />
                    {user ? (
                      <button
                        onClick={() => {
                          setOpen(false);
                          logout();
                        }}
                      >
                        Выйти
                      </button>
                    ) : (
                      <Link href="/auth" onClick={() => setOpen(false)}>
                        Войти в аккаунт
                      </Link>
                    )}
                  </nav>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>
      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="product-dialog-overlay" />
          <Dialog.Content className="product-search-dialog">
            <Dialog.Title>Поиск по платформе</Dialog.Title>
            <Dialog.Description>
              Курсы, практика и личное пространство
            </Dialog.Description>
            <Dialog.Close
              className="product-dialog-close"
              aria-label="Закрыть поиск"
            >
              <X size={20} />
            </Dialog.Close>
            <label className="product-search-input">
              <Search size={18} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название раздела…"
                aria-label="Поиск раздела"
              />
            </label>
            <div className="product-search-results">
              {results.length ? (
                results.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSearchOpen(false)}
                  >
                    <Icon size={18} />
                    {label}
                    <ChevronRight size={16} />
                  </Link>
                ))
              ) : (
                <p>Ничего не найдено. Попробуй другое название.</p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
