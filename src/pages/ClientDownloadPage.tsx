import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/ui";
import { ClientDeliveryView } from "../features/client-delivery/components/ClientDeliveryView";
import { PublicHeader } from "../components/layout/PublicHeader";
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

      <PublicHeader
        subtitle="Pobieranie zdjęć"
        actions={[
          {
            label: "Mam inny kod",
            to: "/client",
            variant: "outline",
          },
          {
            label: "Strona główna",
            to: "/",
            variant: "primary",
          },
        ]}
      />

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
