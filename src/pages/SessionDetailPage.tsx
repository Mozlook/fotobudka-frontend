import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button, Modal, Spinner } from "../components/ui";
import { AccessResultModal } from "../features/sessions/components/AccessResultModal";
import { SessionStatusBadge } from "../features/sessions/components/SessionStatusBadge";
import { SourcePhotoUploader } from "../features/uploads/components/SourcePhotoUploader";
import { PhotographerSelectionPanel } from "../features/photographer-selection/components/PhotographerSelectionPanel";
import { FinalDeliveryPanel } from "../features/finals/components/FinalDeliveryPanel";
import {
  useRegenerateSessionAccessMutation,
  useSessionQuery,
} from "../features/sessions/hooks";
import type { SessionAccessResult } from "../features/sessions/types";
import {
  formatDate,
  formatMoney,
  getSessionPhotoStats,
  getSessionStatusMeta,
} from "../features/sessions/utils";

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const sessionQuery = useSessionQuery(sessionId, {
    refetchInterval: 3000,
  });

  const regenerateAccessMutation = useRegenerateSessionAccessMutation(
    sessionId ?? "",
  );

  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [accessResult, setAccessResult] = useState<SessionAccessResult | null>(
    null,
  );

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
        Brak identyfikatora sesji w adresie.
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm text-fg-muted">Ładuję szczegóły sesji...</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
        <p className="font-semibold">Nie udało się pobrać sesji</p>
        <p className="mt-1 text-sm opacity-80">
          Sesja nie istnieje, nie masz do niej dostępu albo backend zwrócił
          błąd.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => sessionQuery.refetch()}>
            Spróbuj ponownie
          </Button>

          <Link
            to="/app/sessions"
            className="inline-flex h-10 items-center justify-center rounded-button bg-surface px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
          >
            Wróć do sesji
          </Link>
        </div>
      </div>
    );
  }

  const session = sessionQuery.data;
  const stats = getSessionPhotoStats(session);
  const statusMeta = getSessionStatusMeta(session.status);

  const statItems = [
    {
      label: "Wszystkie",
      value: stats?.total ?? "—",
    },
    {
      label: "Pending",
      value: stats?.pending_upload ?? "—",
    },
    {
      label: "Uploaded",
      value: stats?.uploaded ?? "—",
    },
    {
      label: "Processing",
      value: stats?.processing ?? "—",
    },
    {
      label: "Ready",
      value: stats?.ready ?? "—",
    },
    {
      label: "Failed",
      value: stats?.failed ?? "—",
    },
  ];
  function handleRegenerateAccess() {
    regenerateAccessMutation.mutate(undefined, {
      onSuccess: (access) => {
        setConfirmRegenerateOpen(false);
        setAccessResult(access);
      },
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          to="/app/sessions"
          className="text-sm font-semibold text-fg-muted transition hover:text-fg"
        >
          ← Wróć do listy sesji
        </Link>
      </div>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SessionStatusBadge status={session.status} />
              <span className="text-sm text-fg-soft">
                Utworzono: {formatDate(session.created_at)}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">
              {session.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
              {statusMeta.description}
            </p>

            <p className="mt-3 text-sm text-fg-muted">
              Email klienta:{" "}
              <span className="font-medium text-fg">
                {session.client_email || "—"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              isLoading={sessionQuery.isFetching}
              onClick={() => sessionQuery.refetch()}
            >
              Odśwież
            </Button>

            <Button
              variant="danger"
              onClick={() => setConfirmRegenerateOpen(true)}
            >
              Regeneruj dostęp
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Cena bazowa</p>
          <p className="mt-2 text-2xl font-bold text-fg">
            {formatMoney(session.base_price_cents, session.currency)}
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Zdjęcia w pakiecie</p>
          <p className="mt-2 text-2xl font-bold text-fg">
            {session.included_count}
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Dopłata za kolejne</p>
          <p className="mt-2 text-2xl font-bold text-fg">
            {formatMoney(session.extra_price_cents, session.currency)}
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Minimum wyboru</p>
          <p className="mt-2 text-2xl font-bold text-fg">
            {session.min_select_count}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Zdjęcia</p>

          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Status przetwarzania
          </h2>

          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Backend zwraca statystyki zdjęć w szczegółach sesji. Ten widok
            będzie bazą pod FE-3, czyli upload i monitoring processingu.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-fg">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <PhotographerSelectionPanel
          sessionId={session.id}
          currency={session.currency}
          includedCount={session.included_count}
          extraPriceCents={session.extra_price_cents}
          basePriceCents={session.base_price_cents}
        />
      </div>

      <div className="mt-8">
        <FinalDeliveryPanel
          sessionId={session.id}
          sessionStatus={session.status}
          latestDelivery={session.latest_delivery ?? null}
        />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <SourcePhotoUploader
          sessionId={session.id}
          disabled={
            session.status === "waiting_for_payment" ||
            session.status === "editing" ||
            session.status === "delivered" ||
            session.status === "closed" ||
            session.status === "archived"
          }
        />

        <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
          <p className="text-sm font-semibold text-fg-soft">Dostęp klienta</p>

          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Kod i link klienta
          </h2>

          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Regeneracja unieważnia poprzedni kod i poprzedni link. Nowe dane
            pokażemy tylko raz po wygenerowaniu.
          </p>

          <Button
            className="mt-5"
            variant="danger"
            onClick={() => setConfirmRegenerateOpen(true)}
          >
            Regeneruj kod/link
          </Button>
        </div>
      </section>

      <Modal
        open={confirmRegenerateOpen}
        onOpenChange={setConfirmRegenerateOpen}
        title="Regenerować dostęp klienta?"
        description="Nowy kod i link unieważnią poprzednie dane dostępu. Klient korzystający ze starego linku lub kodu straci dostęp."
        footer={
          <>
            <Button
              variant="outline"
              disabled={regenerateAccessMutation.isPending}
              onClick={() => setConfirmRegenerateOpen(false)}
            >
              Anuluj
            </Button>

            <Button
              variant="danger"
              isLoading={regenerateAccessMutation.isPending}
              onClick={handleRegenerateAccess}
            >
              Regeneruj dostęp
            </Button>
          </>
        }
      >
        <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Uwaga</p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            Tę akcję wykonuj tylko wtedy, gdy chcesz świadomie wycofać stary kod
            i stary link klienta.
          </p>
        </div>
      </Modal>

      <AccessResultModal
        open={Boolean(accessResult)}
        access={accessResult}
        sessionId={session.id}
        onOpenChange={(open) => {
          if (!open) {
            setAccessResult(null);
          }
        }}
      />
    </div>
  );
}
