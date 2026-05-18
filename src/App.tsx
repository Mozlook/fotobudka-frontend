import { Link, Navigate, Route, Routes } from "react-router";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { ProfilePage } from "./features/profile/ProfilePage";
import { AppShell } from "./layouts/AppShell";
import { PortfolioPage } from "./pages/PortfolioPage";
import { PublicHomePage } from "./pages/PublicHomePage";
import { SessionsPage } from "./pages/SessionsPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-fg">
      <div className="max-w-md rounded-card border border-border bg-surface p-6 text-center shadow-card">
        <p className="text-sm font-semibold text-fg-soft">404</p>

        <h1 className="mt-2 text-2xl font-bold text-fg">
          Nie znaleziono strony
        </h1>

        <p className="mt-3 text-sm leading-6 text-fg-muted">
          Ten adres nie istnieje albo widok nie został jeszcze zaimplementowany.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-button bg-main px-4 py-2 text-sm font-semibold text-main-foreground transition hover:bg-main-hover"
          >
            Strona główna
          </Link>

          <Link
            to="/login"
            className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
          >
            Panel fotografa
          </Link>
        </div>
      </div>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/sessions" replace />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
