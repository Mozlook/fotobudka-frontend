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

function InfoPanel({
  title,
  description,
  tone = "main",
}: {
  title: string;
  description: string;
  tone?: "main" | "warning" | "success";
}) {
  const toneClassName = {
    main: "border-main/20 bg-main-subtle text-fg",
    warning: "border-warning/20 bg-warning-soft text-warning",
    success: "border-success/20 bg-success-soft text-success",
  }[tone];

  return (
    <div className={cn("rounded-card border p-4", toneClassName)}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
    </div>
  );
}

function canManageSourcePhotos(status: string) {
  return (
    status === "draft" ||
    status === "processing" ||
    status === "selecting" ||
    status === "failed"
  );
}

function shouldShowSelectionReview(status: string) {
  return (
    status === "waiting_for_payment" ||
    status === "editing" ||
    status === "delivered" ||
    status === "closed" ||
    status === "archived"
  );
}

function shouldShowFinalDelivery(status: string) {
  return status === "editing" || status === "delivered";
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

  const showSourceStage = canManageSourcePhotos(session.status);
  const showSelectionStage = shouldShowSelectionReview(session.status);
  const showFinalStage = shouldShowFinalDelivery(session.status);

  const statItems = [
    {
      label: "Wszystkie",
      value: stats?.total ?? "—",
      description: "Wszystkie zdjęcia dodane do sesji.",
      tone: "default" as const,
    },
    {
      label: "Czekają",
      value: stats?.pending_upload ?? "—",
      description: "Pliki dodane do kolejki uploadu.",
      tone: "warning" as const,
    },
    {
      label: "Wgrane",
      value: stats?.uploaded ?? "—",
      description: "Zdjęcia czekające na przygotowanie proofów.",
      tone: "main" as const,
    },
    {
      label: "W przygotowaniu",
      value: stats?.processing ?? "—",
      description: "Trwa przygotowanie miniaturek i proofów.",
      tone: "main" as const,
    },
    {
      label: "Gotowe",
      value: stats?.ready ?? "—",
      description: "Widoczne dla klienta w wyborze zdjęć.",
      tone: "success" as const,
    },
    {
      label: "Błędy",
      value: stats?.failed ?? "—",
      description: "Zdjęcia, których nie udało się przygotować.",
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
          description="Minimalna liczba zdjęć do zatwierdzenia przez klienta."
        />
      </section>

      {showSourceStage ? (
        <>
          <div className="mt-8">
            <SourcePhotoUploader sessionId={session.id} />
          </div>

          <div className="mt-8">
            <SectionCard
              eyebrow="Zdjęcia do selekcji"
              title="Postęp przygotowania zdjęć"
              description="Po wgraniu zdjęć system przygotowuje miniatury i proofy dla klienta. Gdy zdjęcia będą gotowe, klient będzie mógł je zobaczyć i wybrać."
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

              {session.status === "selecting" ? (
                <div className="mt-6">
                  <InfoPanel
                    title="Klient może już wybierać zdjęcia"
                    description="Możesz nadal dodać zdjęcia do sesji, ale pamiętaj, że klient zobaczy je dopiero po przygotowaniu proofów."
                    tone="success"
                  />
                </div>
              ) : null}
            </SectionCard>
          </div>
        </>
      ) : null}

      {!showSourceStage && stats ? (
        <div className="mt-8">
          <SectionCard
            eyebrow="Zdjęcia do selekcji"
            title="Zdjęcia zostały przygotowane"
            description="Ten etap jest już zakończony dla tej sesji. Poniżej zobaczysz wybór klienta i dalsze kroki."
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
      ) : null}

      {session.status === "selecting" ? (
        <div className="mt-8">
          <InfoPanel
            title="Czekamy na wybór klienta"
            description="Gdy klient zatwierdzi zdjęcia, w tym miejscu pojawi się lista zdjęć do obróbki, notatki oraz podsumowanie płatności."
            tone="main"
          />
        </div>
      ) : null}

      {session.status === "waiting_for_payment" ? (
        <div className="mt-8">
          <InfoPanel
            title="Klient zatwierdził wybór"
            description="Sprawdź wybrane zdjęcia i notatki. Po otrzymaniu płatności oznacz ją jako opłaconą, żeby przejść do uploadu finalnych zdjęć."
            tone="warning"
          />
        </div>
      ) : null}

      {showSelectionStage ? (
        <div className="mt-8">
          <PhotographerSelectionPanel
            sessionId={session.id}
            currency={session.currency}
            includedCount={session.included_count}
            extraPriceCents={session.extra_price_cents}
            basePriceCents={session.base_price_cents}
          />
        </div>
      ) : null}

      {showFinalStage ? (
        <div className="mt-8">
          <FinalDeliveryPanel
            sessionId={session.id}
            sessionStatus={session.status}
            latestDelivery={session.latest_delivery ?? null}
          />
        </div>
      ) : null}

      {session.status === "waiting_for_payment" ? (
        <div className="mt-8">
          <InfoPanel
            title="Finalne zdjęcia będą dostępne po płatności"
            description="Po oznaczeniu płatności jako opłaconej pojawi się sekcja uploadu finalnych zdjęć i generowania paczki ZIP."
            tone="main"
          />
        </div>
      ) : null}

      <Modal
        open={confirmRegenerateOpen}
        onOpenChange={setConfirmRegenerateOpen}
        title="Regenerować dostęp klienta?"
        description="Nowy kod i link unieważnią poprzedni dostęp. Klient korzystający ze starego linku albo kodu nie wejdzie już do tej sesji."
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
