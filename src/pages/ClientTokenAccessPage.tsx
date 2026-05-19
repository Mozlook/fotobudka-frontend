import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "../components/ui";
import { toastApiError } from "../lib/notifications/apiToast";
import { queryKeys } from "../lib/query/keys";
import { accessClientSessionByToken } from "../features/client-access/api";
import { storeClientSession } from "../features/client-access/storage";

export function ClientTokenAccessPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const startedRef = useRef(false);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!token || startedRef.current) {
      return;
    }

    startedRef.current = true;

    accessClientSessionByToken(token)
      .then((session) => {
        queryClient.setQueryData(queryKeys.client.session(session.id), session);

        storeClientSession(session);
        const targetPath =
          session.status === "delivered"
            ? `/client/session/${session.id}/download`
            : `/client/session/${session.id}`;

        navigate(targetPath, {
          replace: true,
          state: {
            session,
          },
        });
      })
      .catch((error) => {
        setHasError(true);
        toastApiError(error, "Nie udało się wejść do sesji z linku.");
      });
  }, [token, navigate, queryClient]);

  if (!token || hasError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-fg">
        <div className="max-w-md rounded-card border border-border bg-surface p-6 text-center shadow-card">
          <p className="text-sm font-semibold text-fg-soft">Link klienta</p>

          <h1 className="mt-2 text-2xl font-bold text-fg">
            Nie udało się otworzyć sesji
          </h1>

          <p className="mt-3 text-sm leading-6 text-fg-muted">
            Link może być niepoprawny, wygasły albo unieważniony po regeneracji
            dostępu przez fotografa.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/client"
              className="rounded-button bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
            >
              Wpisz kod
            </Link>

            <Link
              to="/"
              className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
            >
              Strona główna
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-fg">
      <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm font-medium text-fg-muted">
            Otwieram sesję klienta...
          </p>
        </div>
      </div>
    </main>
  );
}
