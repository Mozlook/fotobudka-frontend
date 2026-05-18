import { Navigate, Outlet, useLocation } from "react-router";
import { Button, Spinner } from "../../components/ui";
import { ApiError } from "../../lib/api/client";
import { useMeProfileQuery } from "./hooks";

function FullPageLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-fg">
      <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm font-medium text-fg-muted">
            Sprawdzam dostęp...
          </p>
        </div>
      </div>
    </main>
  );
}

export function RequireAuth() {
  const location = useLocation();
  const meQuery = useMeProfileQuery();

  if (meQuery.isLoading) {
    return <FullPageLoader />;
  }

  if (meQuery.isError) {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 401) {
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from: location.pathname,
          }}
        />
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-fg">
        <div className="max-w-md rounded-card border border-border bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold text-fg-soft">Błąd</p>

          <h1 className="mt-2 text-2xl font-bold text-fg">
            Nie udało się sprawdzić dostępu
          </h1>

          <p className="mt-3 text-sm leading-6 text-fg-muted">
            Sprawdź, czy backend działa i czy adres API w pliku `.env.local`
            jest poprawny.
          </p>

          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => meQuery.refetch()}
          >
            Spróbuj ponownie
          </Button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
