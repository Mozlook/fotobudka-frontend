import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { Button, Modal, Spinner } from "../components/ui";
import { FinalDeliveryPanel } from "../features/finals/components/FinalDeliveryPanel";
import { PhotographerSelectionPanel } from "../features/photographer-selection/components/PhotographerSelectionPanel";
import { AccessResultModal } from "../features/sessions/components/AccessResultModal";
import { SessionStatusBadge } from "../features/sessions/components/SessionStatusBadge";
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
import { SourcePhotoUploader } from "../features/uploads/components/SourcePhotoUploader";
import { cn } from "../lib/utils/cn";

type MetricTone = "default" | "main" | "success" | "warning" | "danger";

function MetricCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description?: string;
  tone?: MetricTone;
}) {
  const toneClassName: Record<MetricTone, string> = {
    default: "bg-surface",
    main: "bg-main-subtle",
    success: "bg-success-soft",
    warning: "bg-warning-soft",
    danger: "bg-danger-soft",
  };

  return (
    <article
      className={cn(
        "rounded-card border border-border p-5 shadow-card-sm",
        toneClassName[tone],
      )}
    >
      <p className="text-sm font-medium text-fg-muted">{label}</p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-fg">{value}</p>

      {description ? (
        <p className="mt-2 text-xs leading-5 text-fg-muted">{description}</p>
      ) : null}
    </article>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-fg-soft">{eyebrow}</p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            {title}
          </h2>

          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children}
    </section>
  );
}

function isSourceUploadDisabled(status: string) {
  return (
    status === "waiting_for_payment" ||
    status === "editing" ||
    status === "delivered" ||
    status === "closed" ||
    status === "archived"
  );
}

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
        <p className="font-semibold">Brak identyfikatora sesji</p>
        <p className="mt-1 text-sm opacity-80">
          Adres strony nie zawiera ID sesji.
        </p>
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

        <p className="mt-1 text-sm leading-6 opacity-80">
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
            Wróć do listy sesji
          </Link>
        </div>
      </div>
    );
  }

  const session = sessionQuery.data;
  const stats = getSessionPhotoStats(session);
  const statusMeta = getSessionStatusMeta(session.status);
  const sourceUploadDisabled = isSourceUploadDisabled(session.status);

  const statItems = [
    {
      label: "Wszystkie",
      value: stats?.total ?? "—",
      description: "Wszystkie zdjęcia source w sesji.",
      tone: "default" as const,
    },
    {
      label: "Pending",
      value: stats?.pending_upload ?? "—",
      description: "Czekają na complete uploadu.",
      tone: "warning" as const,
    },
    {
      label: "Uploaded",
      value: stats?.uploaded ?? "—",
      description: "Upload zakończony, przed workerem.",
      tone: "main" as const,
    },
    {
      label: "Processing",
      value: stats?.processing ?? "—",
      description: "Worker generuje thumb/proof.",
      tone: "main" as const,
    },
    {
      label: "Ready",
      value: stats?.ready ?? "—",
      description: "Gotowe do pokazania klientowi.",
      tone: "success" as const,
    },
    {
      label: "Failed",
      value: stats?.failed ?? "—",
      description: "Wymagają uwagi fotografa.",
      tone: stats?.failed ? ("danger" as const) : ("default" as const),
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link
          to="/app/sessions"
          className="inline-flex items-center text-sm font-semibold text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
        >
          ← Wróć do listy sesji
        </Link>
      </div>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SessionStatusBadge status={session.status} />

              <span className="text-sm text-fg-soft">
                Utworzono: {formatDate(session.created_at)}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              {session.title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              {statusMeta.description}
            </p>

            <div className="mt-5 grid gap-3 text-sm text-fg-muted md:grid-cols-2">
              <p>
                Email klienta:{" "}
                <span className="font-semibold text-fg">
                  {session.client_email || "—"}
                </span>
              </p>

              <p>
                ID sesji:{" "}
                <span className="break-all font-mono text-xs text-fg">
                  {session.id}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
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

      <section
        aria-label="Cennik sesji"
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Cena bazowa"
          value={formatMoney(session.base_price_cents, session.currency)}
          description="Kwota za pakiet podstawowy."
          tone="main"
        />

        <MetricCard
          label="Zdjęcia w pakiecie"
          value={session.included_count}
          description="Liczba zdjęć w cenie bazowej."
        />

        <MetricCard
          label="Dopłata za kolejne"
          value={formatMoney(session.extra_price_cents, session.currency)}
          description="Cena każdego zdjęcia ponad pakiet."
        />

        <MetricCard
          label="Minimum wyboru"
          value={session.min_select_count}
          description="Minimalna liczba zdjęć do submitu."
        />
      </section>

      <div className="mt-8">
        <SourcePhotoUploader
          sessionId={session.id}
          disabled={sourceUploadDisabled}
        />
      </div>

      <div className="mt-8">
        <SectionCard
          eyebrow="Processing"
          title="Status przetwarzania zdjęć do selekcji"
          description="Ten widok odświeża się automatycznie. Po zakończeniu workera zdjęcia ready pojawią się klientowi w selekcji."
          action={
            sessionQuery.isFetching ? (
              <div className="flex items-center gap-2 rounded-button bg-bg px-3 py-2 text-sm font-semibold text-fg-muted">
                <Spinner size="sm" />
                Odświeżam
              </div>
            ) : null
          }
        >
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statItems.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                description={item.description}
                tone={item.tone}
              />
            ))}
          </div>
        </SectionCard>
      </div>

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
            i stary link klienta. Nowe dane dostępu pokażemy tylko raz po
            wygenerowaniu.
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
