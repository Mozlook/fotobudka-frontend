import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/ui";
import { ClientDeliveryView } from "../features/client-delivery/components/ClientDeliveryView";
import {
  readClientSession,
  storeClientSession,
} from "../features/client-access/storage";
import type { ClientSessionAccessResult } from "../features/client-access/types";
import { queryKeys } from "../lib/query/keys";

type LocationState = {
  session?: ClientSessionAccessResult;
};

export function ClientDownloadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const stateSession = (location.state as LocationState | null)?.session;

  const cachedSession = sessionId
    ? queryClient.getQueryData<ClientSessionAccessResult>(
        queryKeys.client.session(sessionId),
      )
    : undefined;

  const storedSession = sessionId ? readClientSession(sessionId) : null;

  const session = cachedSession ?? stateSession ?? storedSession;

  useEffect(() => {
    if (!session) {
      return;
    }

    queryClient.setQueryData(queryKeys.client.session(session.id), session);
    storeClientSession(session);
  }, [queryClient, session]);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <a
        href="#client-download-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
      >
        Przejdź do pobierania ZIP
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-main text-main-foreground">
              <span className="text-sm font-bold">FB</span>
            </div>

            <div>
              <p className="text-sm font-bold leading-none text-fg">
                FotoBudka
              </p>
              <p className="mt-1 text-xs text-fg-muted">Pobieranie zdjęć</p>
            </div>
          </Link>

          <nav
            aria-label="Nawigacja pobierania"
            className="flex flex-wrap gap-2"
          >
            <Link
              to="/client"
              className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
            >
              Mam inny kod
            </Link>

            <Link
              to="/"
              className="rounded-button bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-soft"
            >
              Strona główna
            </Link>
          </nav>
        </div>
      </header>

      <section id="client-download-content" className="px-6 py-10">
        {!sessionId ? (
          <div className="mx-auto max-w-3xl">
            <EmptyState
              title="Brak identyfikatora sesji"
              description="Wejdź ponownie przez kod albo link od fotografa."
              action={
                <Link
                  to="/client"
                  className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
                >
                  Wpisz kod sesji
                </Link>
              }
            />
          </div>
        ) : (
          <ClientDeliveryView
            sessionId={sessionId}
            sessionTitle={session?.title}
          />
        )}
      </section>
    </main>
  );
}
