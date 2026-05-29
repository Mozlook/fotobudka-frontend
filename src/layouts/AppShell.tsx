import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Button } from "../components/ui";
import { useLogoutMutation, useMeProfileQuery } from "../features/auth/hooks";
import { cn } from "../lib/utils/cn";

const navItems = [
  {
    label: "Sesje",
    to: "/app/sessions",
    description: "Selekcje, płatności i dostawy ZIP",
  },
  {
    label: "Portfolio",
    to: "/app/portfolio",
    description: "Publiczne galerie fotografa",
  },
  {
    label: "Profil",
    to: "/app/profile",
    description: "Username, bio i social links",
  },
];

function getCurrentSection(pathname: string) {
  return (
    navItems.find(
      (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
    ) ?? navItems[0]
  );
}

function isSectionActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell() {
  const location = useLocation();
  const meQuery = useMeProfileQuery();
  const logoutMutation = useLogoutMutation();

  const profile = meQuery.data?.profile;
  const currentSection = getCurrentSection(location.pathname);

  const displayName =
    profile?.display_name || profile?.username || "Profil nieuzupełniony";

  const publicProfilePath = profile?.username ? `/${profile.username}` : null;

  return (
    <div className="min-h-screen bg-bg text-fg lg:flex">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
      >
        Przejdź do treści panelu
      </a>

      <aside className="hidden border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-80 lg:flex-col">
        <div className="border-b border-border p-6">
          <Link to="/app/sessions" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-main text-main-foreground">
              <span className="text-sm font-bold">FB</span>
            </div>

            <div>
              <p className="text-base font-bold leading-none text-fg">
                FotoBudka
              </p>
              <p className="mt-1 text-xs text-fg-muted">Panel fotografa</p>
            </div>
          </Link>

          <p className="mt-5 text-sm leading-6 text-fg-muted">
            Zarządzaj sesjami, selekcją klienta, finalnymi zdjęciami i
            publicznym portfolio.
          </p>
        </div>

        <nav aria-label="Nawigacja panelu" className="grid gap-2 p-4">
          {navItems.map((item) => {
            const active = isSectionActive(location.pathname, item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "group rounded-card border px-4 py-4 transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft",
                  active
                    ? "border-main/30 bg-main-soft text-fg shadow-card-sm"
                    : "border-transparent text-fg-muted hover:border-border hover:bg-bg-muted hover:text-fg",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 opacity-75">
                      {item.description}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 rounded-full transition",
                      active ? "bg-main-active" : "bg-border",
                    )}
                  />
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-4 border-t border-border p-4">
          {profile ? (
            <div className="rounded-card border border-border bg-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
                Profil publiczny
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-fg">
                {displayName}
              </p>

              <p className="mt-1 truncate text-xs text-fg-muted">
                /{profile.username}
              </p>

              <div className="mt-4 grid gap-2">
                {publicProfilePath ? (
                  <Link
                    to={publicProfilePath}
                    target="_blank"
                    className="inline-flex h-9 items-center justify-center rounded-button bg-main-soft px-3 text-sm font-semibold text-fg transition hover:bg-main-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
                  >
                    Zobacz publiczny profil
                  </Link>
                ) : null}

                <Link
                  to="/app/profile"
                  className="inline-flex h-9 items-center justify-center rounded-button border border-border bg-surface px-3 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
                >
                  Edytuj profil
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
              <p className="text-sm font-semibold">
                Profil nie jest uzupełniony
              </p>

              <p className="mt-1 text-xs leading-5 opacity-80">
                Uzupełnij username i nazwę wyświetlaną, żeby publiczne portfolio
                było dostępne.
              </p>

              <Link
                to="/app/profile"
                className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-button bg-surface px-3 text-sm font-semibold text-warning transition hover:bg-warning-soft"
              >
                Uzupełnij profil
              </Link>
            </div>
          )}

          <div className="grid gap-2">
            <Link
              to="/"
              className="inline-flex h-9 items-center justify-center rounded-button border border-border bg-surface px-3 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
            >
              Strona główna
            </Link>

            <Button
              className="w-full"
              variant="outline"
              size="sm"
              isLoading={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Wyloguj
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 px-6 py-4 backdrop-blur lg:hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link to="/app/sessions" className="font-bold text-fg">
                FotoBudka
              </Link>

              <p className="mt-1 truncate text-xs text-fg-muted">
                {displayName}
              </p>

              <p className="mt-2 text-sm font-semibold text-fg">
                {currentSection.label}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Link
                to="/"
                aria-label="Strona główna"
                className="inline-flex size-9 items-center justify-center rounded-button border border-border bg-surface text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                /
              </Link>

              <Button
                variant="outline"
                size="sm"
                isLoading={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                Wyloguj
              </Button>
            </div>
          </div>

          <nav
            aria-label="Nawigacja panelu"
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            {navItems.map((item) => {
              const active = isSectionActive(location.pathname, item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "whitespace-nowrap rounded-button px-3 py-2 text-sm font-semibold transition",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft",
                    active
                      ? "bg-main-soft text-fg"
                      : "border border-border bg-surface text-fg-muted hover:bg-bg-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {!profile ? (
            <Link
              to="/app/profile"
              className="mt-4 block rounded-card border border-warning/20 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning"
            >
              Uzupełnij profil, żeby włączyć publiczne portfolio.
            </Link>
          ) : publicProfilePath ? (
            <Link
              to={publicProfilePath}
              target="_blank"
              className="mt-4 block rounded-card border border-main/20 bg-main-subtle px-4 py-3 text-sm font-semibold text-fg"
            >
              Publiczny profil: /{profile.username}
            </Link>
          ) : null}
        </header>

        <main id="app-content" className="px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
