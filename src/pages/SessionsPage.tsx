import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button, EmptyState, Spinner } from "../components/ui";
import { AccessResultModal } from "../features/sessions/components/AccessResultModal";
import { CreateSessionModal } from "../features/sessions/components/CreateSessionModal";
import { SessionStatusBadge } from "../features/sessions/components/SessionStatusBadge";
import { useSessionsQuery } from "../features/sessions/hooks";
import type {
  CreateSessionResult,
  SessionSummary,
} from "../features/sessions/types";
import {
  formatDate,
  formatMoney,
  getSessionPhotoStats,
  getSessionStatusMeta,
  sessionStatusFilters,
} from "../features/sessions/utils";
import { cn } from "../lib/utils/cn";

function SessionCard({ session }: { session: SessionSummary }) {
  const statusMeta = getSessionStatusMeta(session.status);
  const stats = getSessionPhotoStats(session);

  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge status={session.status} />
            <span className="text-xs text-fg-soft">
              {formatDate(session.created_at)}
            </span>
          </div>

          <h2 className="mt-3 truncate text-xl font-semibold text-fg">
            {session.title}
          </h2>

          <p className="mt-1 text-sm text-fg-muted">
            {session.client_email || "Brak emaila klienta"}
          </p>
        </div>

        <Link
          to={`/app/sessions/${session.id}`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-button border border-border bg-surface px-4 text-sm font-semibold text-fg transition hover:bg-bg-muted"
        >
          Otwórz
        </Link>
      </div>

      <p className="mt-4 text-sm leading-6 text-fg-muted">
        {statusMeta.description}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-card bg-bg p-3">
          <p className="text-xs font-medium text-fg-soft">Cena bazowa</p>
          <p className="mt-1 font-semibold text-fg">
            {formatMoney(session.base_price_cents, session.currency)}
          </p>
        </div>

        <div className="rounded-card bg-bg p-3">
          <p className="text-xs font-medium text-fg-soft">Pakiet</p>
          <p className="mt-1 font-semibold text-fg">
            {session.included_count} zdjęć
          </p>
        </div>

        <div className="rounded-card bg-bg p-3">
          <p className="text-xs font-medium text-fg-soft">Zdjęcia ready</p>
          <p className="mt-1 font-semibold text-fg">
            {stats ? `${stats.ready}/${stats.total}` : "—"}
          </p>
        </div>
      </div>
    </article>
  );
}

export function SessionsPage() {
  const sessionsQuery = useSessionsQuery();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdAccess, setCreatedAccess] =
    useState<CreateSessionResult | null>(null);

  const sessions = sessionsQuery.data ?? [];

  const filteredSessions = useMemo(() => {
    if (selectedStatus === "all") {
      return sessions;
    }

    return sessions.filter((session) => session.status === selectedStatus);
  }, [selectedStatus, sessions]);

  const dashboardStats = useMemo(() => {
    return {
      total: sessions.length,
      selecting: sessions.filter((session) => session.status === "selecting")
        .length,
      payment: sessions.filter(
        (session) => session.status === "waiting_for_payment",
      ).length,
      delivered: sessions.filter((session) => session.status === "delivered")
        .length,
    };
  }, [sessions]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Sesje</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
            Sesje zdjęciowe
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
            Zarządzaj sesjami, statusem selekcji i dostępem klienta.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            isLoading={sessionsQuery.isFetching}
            onClick={() => sessionsQuery.refetch()}
          >
            Odśwież
          </Button>

          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            Utwórz sesję
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Wszystkie sesje</p>
          <p className="mt-2 text-3xl font-bold text-fg">
            {dashboardStats.total}
          </p>
        </div>

        <div className="rounded-card border border-border bg-main-subtle p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">W selekcji</p>
          <p className="mt-2 text-3xl font-bold text-fg">
            {dashboardStats.selecting}
          </p>
        </div>

        <div className="rounded-card border border-border bg-warning-soft p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Czekają na płatność</p>
          <p className="mt-2 text-3xl font-bold text-fg">
            {dashboardStats.payment}
          </p>
        </div>

        <div className="rounded-card border border-border bg-success-soft p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Dostarczone</p>
          <p className="mt-2 text-3xl font-bold text-fg">
            {dashboardStats.delivered}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {sessionStatusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setSelectedStatus(filter.value)}
            className={cn(
              "whitespace-nowrap rounded-button px-3 py-2 text-sm font-semibold transition",
              selectedStatus === filter.value
                ? "bg-main-soft text-fg"
                : "bg-surface text-fg-muted hover:bg-bg-muted",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {sessionsQuery.isLoading ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="text-sm text-fg-muted">Ładuję sesje...</p>
            </div>
          </div>
        ) : null}

        {sessionsQuery.isError ? (
          <div className="rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
            <p className="font-semibold">Nie udało się pobrać sesji</p>
            <p className="mt-1 text-sm opacity-80">
              Sprawdź backend albo spróbuj odświeżyć widok.
            </p>

            <Button
              className="mt-4"
              variant="outline"
              onClick={() => sessionsQuery.refetch()}
            >
              Spróbuj ponownie
            </Button>
          </div>
        ) : null}

        {sessionsQuery.isSuccess && filteredSessions.length === 0 ? (
          <EmptyState
            title={
              sessions.length === 0
                ? "Nie masz jeszcze sesji"
                : "Brak sesji dla tego filtra"
            }
            description={
              sessions.length === 0
                ? "Utwórz pierwszą sesję, żeby wygenerować kod i link dla klienta."
                : "Zmień filtr albo odśwież listę."
            }
            action={
              sessions.length === 0 ? (
                <Button onClick={() => setCreateOpen(true)}>
                  Utwórz pierwszą sesję
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {filteredSessions.length > 0 ? (
          <div className="grid gap-4">
            {filteredSessions.map((session, index) => (
              <SessionCard
                key={session.id ? `${session.id}-${index}` : `session-${index}`}
                session={session}
              />
            ))}
          </div>
        ) : null}
      </div>

      <CreateSessionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setCreatedAccess}
      />

      <AccessResultModal
        open={Boolean(createdAccess?.access)}
        access={createdAccess?.access ?? null}
        sessionId={createdAccess?.session.id}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedAccess(null);
          }
        }}
      />
    </div>
  );
}
