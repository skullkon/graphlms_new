import { SiteHeader } from "@/components/SiteHeader";
import { AnalyticsPreferences } from "@/components/Analytics";
import Link from "next/link";
export function ChromeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="learning-shell">
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <SiteHeader />
      <div className="learning-body">
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="learning-footer">
          <span>
            graphlms <span aria-hidden="true">·</span> Учись создавать
            работающие системы
          </span>
          <div>
            <Link href="/changelog">Что нового</Link>
            <AnalyticsPreferences />
          </div>
        </footer>
      </div>
    </div>
  );
}
export default ChromeShell;
