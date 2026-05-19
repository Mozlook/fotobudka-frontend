import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/ui";
import { ClientSelectionView } from "../features/client-selection/components/CLientSelectionView";
import {
  readClientSession,
  storeClientSession,
} from "../features/client-access/storage";
import type { ClientSessionAccessResult } from "../features/client-access/types";
import { queryKeys } from "../lib/query/keys";

type LocationState = {
  session?: ClientSessionAccessResult;
};

export function ClientSessionPage() {
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
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="font-bold text-fg">
            FotoBudka
          </Link>

          <Link
            to="/client"
            className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
          >
            Mam inny kod
          </Link>
        </div>
      </header>

      <section className="px-6 py-10">
        {!sessionId || !session ? (
          <div className="mx-auto max-w-3xl">
            <EmptyState
              title="Nie udało się odczytać sesji"
              description="Wejdź ponownie przez kod albo link od fotografa. Dostęp klienta działa po bezpiecznym cookie, ale metadane widoku mogły zniknąć po wyczyszczeniu danych przeglądarki."
            />

            <div className="mt-6 text-center">
              <Link
                to="/client"
                className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
              >
                Wpisz kod sesji
              </Link>
            </div>
          </div>
        ) : (
          <ClientSelectionView session={session} />
        )}
      </section>
    </main>
  );
}
