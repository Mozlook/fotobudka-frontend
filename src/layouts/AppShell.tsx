import { NavLink, Outlet } from "react-router";
import { Button } from "../components/ui";
import { useLogoutMutation, useMeProfileQuery } from "../features/auth/hooks";
import { cn } from "../lib/utils/cn";

const navItems = [
  {
    label: "Sesje",
    to: "/app/sessions",
    description: "Projekty klientów",
  },
  {
    label: "Portfolio",
    to: "/app/portfolio",
    description: "Galerie publiczne",
  },
  {
    label: "Profil",
    to: "/app/profile",
    description: "Ustawienia fotografa",
  },
];

export function AppShell() {
  const meQuery = useMeProfileQuery();
  const logoutMutation = useLogoutMutation();

  const profile = meQuery.data?.profile;
  const displayName =
    profile?.display_name || profile?.username || "Profil nieuzupełniony";

  return (
    <div className="min-h-screen bg-bg text-fg lg:flex">
      <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-6">
          <div className="inline-flex rounded-full bg-main-soft px-3 py-1 text-sm font-semibold text-fg">
            FotoBudka
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg">
            Panel fotografa
          </h1>

          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Sesje, selekcje, płatności i dostawy ZIP.
          </p>
        </div>

        <nav className="grid gap-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/sessions"}
              className={({ isActive }) =>
                cn(
                  "rounded-card px-4 py-3 transition",
                  "hover:bg-bg-muted",
                  isActive ? "bg-main-soft text-fg" : "text-fg-muted",
                )
              }
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-0.5 block text-xs opacity-75">
                {item.description}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <div className="rounded-card bg-bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
              Zalogowany jako
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-fg">
              {displayName}
            </p>

            {!profile ? (
              <p className="mt-2 text-xs leading-5 text-warning">
                Uzupełnij profil, żeby mieć publiczny username.
              </p>
            ) : null}

            <Button
              className="mt-4 w-full"
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
        <header className="border-b border-border bg-surface/85 px-6 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-fg">FotoBudka</p>
              <p className="text-xs text-fg-muted">{displayName}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              isLoading={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Wyloguj
            </Button>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app/sessions"}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-button px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-main-soft text-fg"
                      : "bg-surface text-fg-muted hover:bg-bg-muted",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
