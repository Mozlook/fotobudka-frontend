import { Navigate, useSearchParams } from "react-router";
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
    <main className="min-h-screen bg-bg px-6 py-10 text-fg">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-card border border-border bg-surface shadow-card lg:grid-cols-[1.1fr_0.9fr]">
          <section className="bg-secondary p-8 text-secondary-foreground md:p-12">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
              FotoBudka
            </div>

            <h1 className="mt-8 max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
              Panel fotografa do obsługi selekcji zdjęć.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
              Twórz sesje, udostępniaj proofy klientom, zbieraj wybory i
              dostarczaj gotowe zdjęcia w paczce ZIP.
            </p>

            <div className="mt-10 grid gap-4 text-sm text-white/75">
              <div className="rounded-card bg-white/10 p-4">
                Google OAuth bez haseł w aplikacji.
              </div>

              <div className="rounded-card bg-white/10 p-4">
                Bezpieczne cookie HttpOnly po stronie backendu.
              </div>

              <div className="rounded-card bg-white/10 p-4">
                Brak tokenów w localStorage.
              </div>
            </div>
          </section>

          <section className="p-8 md:p-12">
            <p className="text-sm font-semibold text-fg-soft">
              Logowanie fotografa
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg">
              Witaj ponownie
            </h2>

            <p className="mt-3 text-sm leading-6 text-fg-muted">
              Kliknięcie przycisku przekieruje Cię do backendowego flow Google
              OAuth. Po udanym logowaniu backend ustawi cookie i wrócisz do
              panelu.
            </p>

            {loginError ? (
              <div className="mt-6 rounded-card border border-danger/20 bg-danger-soft p-4 text-danger">
                <p className="font-semibold">Logowanie nie powiodło się</p>
                <p className="mt-1 text-sm opacity-80">
                  Spróbuj ponownie albo sprawdź konfigurację OAuth.
                </p>
              </div>
            ) : null}

            {shouldShowUnexpectedAuthError ? (
              <div className="mt-6 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
                <p className="font-semibold">Nie udało się sprawdzić sesji</p>
                <p className="mt-1 text-sm opacity-80">
                  Nadal możesz rozpocząć logowanie przez Google.
                </p>
              </div>
            ) : null}

            <div className="mt-8">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleGoogleLogin}
                className="w-full"
              >
                Zaloguj przez Google
              </Button>
            </div>

            {meQuery.isLoading ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-fg-muted">
                <Spinner size="sm" />
                Sprawdzam aktywną sesję...
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
