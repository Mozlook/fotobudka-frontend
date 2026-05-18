import { Link, useLocation, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState } from "../components/ui";
import type { ClientSessionAccessResult } from "../features/client-access/types";
import { queryKeys } from "../lib/query/keys";
import { formatMoney } from "../features/sessions/utils";

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

  const session = cachedSession ?? stateSession;

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

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold text-fg-soft">Sesja klienta</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
            {session?.title ?? "Sesja zdjęciowa"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-fg-muted">
            Dostęp został potwierdzony. W kolejnym etapie dodamy grid proofów,
            wybór zdjęć, notatki i zatwierdzanie wyboru.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">Status</p>
              <p className="mt-1 font-semibold text-fg">
                {session?.status ?? "—"}
              </p>
            </div>

            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">Pakiet</p>
              <p className="mt-1 font-semibold text-fg">
                {session ? `${session.included_count} zdjęć` : "—"}
              </p>
            </div>

            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">Cena bazowa</p>
              <p className="mt-1 font-semibold text-fg">
                {session
                  ? formatMoney(session.base_price_cents, session.currency)
                  : "—"}
              </p>
            </div>

            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">Dodatkowe</p>
              <p className="mt-1 font-semibold text-fg">
                {session
                  ? formatMoney(session.extra_price_cents, session.currency)
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <EmptyState
            title="Grid proofów będzie w FE-5"
            description="Backend ma już endpoint zdjęć klienta, signed thumb/proof URL-e, selections, notes i submit. Teraz mamy gotowe wejście klienta kodem albo linkiem."
            action={<Button disabled>Przegląd zdjęć — następny etap</Button>}
          />
        </div>
      </section>
    </main>
  );
}
