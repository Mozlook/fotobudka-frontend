import { Link, Navigate, useSearchParams } from "react-router";
import { PublicHeader } from "../../components/layout/PublicHeader";
import { Button, Spinner } from "../../components/ui";
import { ApiError } from "../../lib/api/client";
import { getGoogleLoginUrl } from "./api";
import { useMeProfileQuery } from "./hooks";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const meQuery = useMeProfileQuery();

  const loginError = searchParams.get("error");

  if (meQuery.isSuccess) {
    return <Navigate to="/app/sessions" replace />;
  }

  const isUnauthorized =
    meQuery.error instanceof ApiError && meQuery.error.status === 401;

  const shouldShowUnexpectedAuthError = meQuery.isError && !isUnauthorized;

  function handleGoogleLogin() {
    window.location.assign(getGoogleLoginUrl());
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <PublicHeader
        subtitle="Panel fotografa"
        actions={[
          {
            label: "Wróć na stronę główną",
            to: "/",
            variant: "outline",
          },
        ]}
      />

      <section className="px-6 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-card border border-border bg-surface shadow-card lg:grid-cols-[1.05fr_0.95fr]">
            <section className="bg-secondary p-8 text-secondary-foreground md:p-12">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                FotoBudka
              </div>

              <h1 className="mt-8 max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
                Panel fotografa do obsługi sesji i portfolio.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
                Zarządzaj sesjami zdjęciowymi, udostępniaj proofy klientom,
                zbieraj wybory, wgrywaj finalne zdjęcia i publikuj publiczne
                galerie portfolio.
              </p>
            </section>

            <section className="p-8 md:p-12">
              <p className="text-sm font-semibold text-fg-soft">
                Logowanie fotografa
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg">
                Witaj ponownie
              </h2>

              <p className="mt-3 text-sm leading-6 text-fg-muted">
                Zaloguj się kontem Google, żeby przejść do panelu fotografa. Po
                poprawnym logowaniu bedziesz mogl wejsc w swoj panel.
              </p>

              {loginError ? (
                <div className="mt-6 rounded-card border border-danger/20 bg-danger-soft p-4 text-danger">
                  <p className="font-semibold">Logowanie nie powiodło się</p>

                  <p className="mt-1 text-sm opacity-80">
                    Spróbuj ponownie. Jeśli problem się powtarza, sprawdź, czy
                    używasz właściwego konta Google.
                  </p>
                </div>
              ) : null}

              {shouldShowUnexpectedAuthError ? (
                <div className="mt-6 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
                  <p className="font-semibold">
                    Nie udało się sprawdzić aktywnej sesji
                  </p>

                  <p className="mt-1 text-sm opacity-80">
                    Nadal możesz rozpocząć logowanie przez Google.
                  </p>
                </div>
              ) : null}

              <div className="mt-8 grid gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleGoogleLogin}
                  className="w-full"
                >
                  Zaloguj przez Google
                </Button>

                <Link
                  to="/"
                  className="inline-flex h-12 items-center justify-center rounded-button border border-border bg-surface px-5 text-base font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
                >
                  Wróć na stronę główną
                </Link>
              </div>

              {meQuery.isLoading ? (
                <div className="mt-5 flex items-center gap-3 text-sm text-fg-muted">
                  <Spinner size="sm" />
                  Sprawdzam, czy jesteś już zalogowany...
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
