import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button, EmptyState, Input, Spinner } from "../components/ui";
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

function DashboardMetricCard({
  label,
  value,
  description,
  variant = "default",
}: {
  label: string;
  value: number;
  description: string;
  variant?: "default" | "main" | "warning" | "success";
}) {
  const variantClassName = {
    default: "bg-surface",
    main: "bg-main-subtle",
    warning: "bg-warning-soft",
    success: "bg-success-soft",
  }[variant];

  return (
    <article
      className={cn(
        "rounded-card border border-border p-5 shadow-card-sm",
        variantClassName,
      )}
    >
      <p className="text-sm font-medium text-fg-muted">{label}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-fg">{value}</p>

      <p className="mt-2 text-xs leading-5 text-fg-muted">{description}</p>
    </article>
  );
}

function SessionCard({ session }: { session: SessionSummary }) {
  const statusMeta = getSessionStatusMeta(session.status);
  const stats = getSessionPhotoStats(session);

  const selectedCount =
    typeof session.selected_count === "number"
      ? session.selected_count
      : undefined;

  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge status={session.status} />

            <span className="text-xs font-medium text-fg-soft">
              Utworzono: {formatDate(session.created_at)}
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
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-soft"
        >
          Otwórz sesję
        </Link>
      </div>

      <p className="mt-4 text-sm leading-6 text-fg-muted">
        {statusMeta.description}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <p className="text-xs font-medium text-fg-soft">Proofy ready</p>
          <p className="mt-1 font-semibold text-fg">
            {stats ? `${stats.ready}/${stats.total}` : "—"}
          </p>
        </div>

        <div className="rounded-card bg-bg p-3">
          <p className="text-xs font-medium text-fg-soft">Wybrane</p>
          <p className="mt-1 font-semibold text-fg">{selectedCount ?? "—"}</p>
        </div>
      </div>
    </article>
  );
}

export function SessionsPage() {
  const sessionsQuery = useSessionsQuery();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdAccess, setCreatedAccess] =
    useState<CreateSessionResult | null>(null);

  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sessions.length,
    };

    for (const filter of sessionStatusFilters) {
      counts[filter.value] = filter.value === "all" ? sessions.length : 0;
    }

    for (const session of sessions) {
      counts[session.status] = (counts[session.status] ?? 0) + 1;
    }

    return counts;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesStatus =
        selectedStatus === "all" || session.status === selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        session.title.toLowerCase().includes(normalizedSearch) ||
        session.id.toLowerCase().includes(normalizedSearch) ||
        (session.client_email ?? "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [selectedStatus, sessions, search]);

  const dashboardStats = useMemo(() => {
    const activeStatuses = new Set(["draft", "processing", "selecting"]);

    return {
      total: sessions.length,
      active: sessions.filter((session) => activeStatuses.has(session.status))
        .length,
      payment: sessions.filter(
        (session) => session.status === "waiting_for_payment",
      ).length,
      delivered: sessions.filter((session) => session.status === "delivered")
        .length,
    };
  }, [sessions]);

  const hasAnySessions = sessions.length > 0;
  const hasFilteredSessions = filteredSessions.length > 0;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-fg-soft">
              Sesje fotografa
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              Zarządzanie sesjami
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              Twórz sesje, śledź processing proofów, obsługuj wybór klienta,
              płatność manualną, finale i dostawy ZIP.
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
      </section>

      <section
        aria-label="Podsumowanie sesji"
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <DashboardMetricCard
          label="Wszystkie sesje"
          value={dashboardStats.total}
          description="Łączna liczba sesji fotografa."
        />

        <DashboardMetricCard
          label="Aktywne"
          value={dashboardStats.active}
          description="Draft, processing albo selekcja klienta."
          variant="main"
        />

        <DashboardMetricCard
          label="Czekają na płatność"
          value={dashboardStats.payment}
          description="Klient zatwierdził wybór."
          variant="warning"
        />

        <DashboardMetricCard
          label="Dostarczone"
          value={dashboardStats.delivered}
          description="Paczka ZIP jest gotowa."
          variant="success"
        />
      </section>

      <section className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Input
            label="Szukaj sesji"
            placeholder="Tytuł, email klienta albo ID sesji"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            hint="Filtrowanie działa lokalnie na aktualnie pobranej liście."
          />

          <div className="text-sm text-fg-muted lg:text-right">
            {sessionsQuery.isFetching && !sessionsQuery.isLoading ? (
              <span>Odświeżam dane...</span>
            ) : (
              <span>
                Pokazuję{" "}
                <span className="font-semibold text-fg">
                  {filteredSessions.length}
                </span>{" "}
                z{" "}
                <span className="font-semibold text-fg">{sessions.length}</span>{" "}
                sesji
              </span>
            )}
          </div>
        </div>

        <div
          role="list"
          aria-label="Filtry statusów sesji"
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
        >
          {sessionStatusFilters.map((filter) => {
            const active = selectedStatus === filter.value;
            const count = filterCounts[filter.value] ?? 0;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedStatus(filter.value)}
                className={cn(
                  "whitespace-nowrap rounded-button px-3 py-2 text-sm font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft",
                  active
                    ? "bg-main-soft text-fg"
                    : "border border-border bg-surface text-fg-muted hover:bg-bg-muted hover:text-fg",
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    active
                      ? "bg-surface/80 text-fg"
                      : "bg-bg-muted text-fg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6" aria-label="Lista sesji">
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
              Sprawdź backend albo spróbuj ponownie za chwilę.
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

        {sessionsQuery.isSuccess && !hasAnySessions ? (
          <EmptyState
            title="Nie masz jeszcze sesji"
            description="Utwórz pierwszą sesję, żeby wygenerować kod i link dla klienta."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                Utwórz pierwszą sesję
              </Button>
            }
          />
        ) : null}

        {sessionsQuery.isSuccess && hasAnySessions && !hasFilteredSessions ? (
          <EmptyState
            title="Brak sesji dla tego widoku"
            description="Zmień filtr statusu albo wyczyść wyszukiwanie."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStatus("all");
                  setSearch("");
                }}
              >
                Wyczyść filtry
              </Button>
            }
          />
        ) : null}

        {hasFilteredSessions ? (
          <div className="grid gap-4">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : null}
      </section>

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
