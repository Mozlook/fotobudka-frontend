import { useState } from "react";
import { Button, EmptyState, Modal, Spinner } from "../../../components/ui";
import { useMarkSessionPaidMutation } from "../../payments/hooks";
import { formatDate, formatMoney } from "../../sessions/utils";
import { usePhotographerSelectionOverviewQuery } from "../hooks";
import type { PhotographerSelectedPhoto } from "../types";

type PhotographerSelectionPanelProps = {
  sessionId: string;
  currency: string;
  includedCount: number;
  extraPriceCents: number;
  basePriceCents: number;
};

function SelectedPhotoRow({
  photo,
  index,
}: {
  photo: PhotographerSelectedPhoto;
  index: number;
}) {
  return (
    <article className="grid gap-4 rounded-card border border-border bg-bg p-4 md:grid-cols-[120px_1fr_auto]">
      <div className="aspect-4/3 overflow-hidden rounded-card bg-bg-muted">
        {photo.thumb_url ? (
          <img
            src={photo.thumb_url}
            alt={photo.original_filename}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-fg-soft">
            #{index + 1}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-fg">
          {photo.original_filename}
        </p>

        <p className="mt-1 text-xs text-fg-soft">
          Wybrane: {formatDate(photo.selected_at)}
        </p>

        {photo.note ? (
          <div className="mt-3 rounded-card border border-main/20 bg-main-subtle p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
              Notatka klienta
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-fg">
              {photo.note}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">
            Brak notatki do tego zdjęcia.
          </p>
        )}
      </div>

      <div className="flex items-start justify-end">
        {photo.final_uploaded ? (
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            Final uploaded
          </span>
        ) : (
          <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
            Czeka na final
          </span>
        )}
      </div>
    </article>
  );
}

export function PhotographerSelectionPanel({
  sessionId,
  currency,
  includedCount,
  extraPriceCents,
  basePriceCents,
}: PhotographerSelectionPanelProps) {
  const selectionQuery = usePhotographerSelectionOverviewQuery(sessionId);
  const markPaidMutation = useMarkSessionPaidMutation(sessionId);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const overview = selectionQuery.data;

  const selectedCount = overview?.selected_count ?? 0;
  const extraCount = Math.max(0, selectedCount - includedCount);

  const calculatedAmount = basePriceCents + extraCount * extraPriceCents;

  const amountCents = overview?.amount_cents ?? calculatedAmount;

  const canMarkPaid =
    overview?.session_status === "waiting_for_payment" &&
    overview?.payment_status !== "paid";

  const alreadyPaid =
    overview?.payment_status === "paid" ||
    overview?.session_status === "editing" ||
    overview?.session_status === "delivered";

  function handleMarkPaid() {
    markPaidMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        selectionQuery.refetch();
      },
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Wybór klienta</p>

          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Zdjęcia do obróbki i płatność
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
            Klient zatwierdził zdjęcia do obróbki. Sprawdź wybrane kadry,
            notatki i podsumowanie płatności.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            isLoading={selectionQuery.isFetching}
            onClick={() => selectionQuery.refetch()}
          >
            Odśwież
          </Button>

          <Button
            variant="secondary"
            disabled={!canMarkPaid}
            onClick={() => setConfirmOpen(true)}
          >
            Oznacz jako opłacone
          </Button>
        </div>
      </div>

      {selectionQuery.isLoading ? (
        <div className="mt-6 rounded-card border border-border bg-bg p-5">
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm text-fg-muted">Ładuję wybór klienta...</p>
          </div>
        </div>
      ) : null}

      {selectionQuery.isError ? (
        <div className="mt-6 rounded-card border border-danger/20 bg-danger-soft p-5 text-danger">
          <p className="font-semibold">Nie udało się pobrać wyboru klienta</p>
          <p className="mt-1 text-sm opacity-80">Spróbuj odświeżyć widok.</p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => selectionQuery.refetch()}
          >
            Spróbuj ponownie
          </Button>
        </div>
      ) : null}

      {overview ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">
                Wybrane zdjęcia
              </p>
              <p className="mt-1 text-2xl font-bold text-fg">{selectedCount}</p>
            </div>

            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">
                Zdjęcia w pakiecie
              </p>
              <p className="mt-1 text-2xl font-bold text-fg">{includedCount}</p>
            </div>

            <div className="rounded-card bg-main-subtle p-4">
              <p className="text-xs font-medium text-fg-soft">Kwota</p>
              <p className="mt-1 text-2xl font-bold text-fg">
                {formatMoney(amountCents, currency)}
              </p>
            </div>

            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">
                Status płatności
              </p>
              <p className="mt-1 text-2xl font-bold text-fg">
                {overview.payment_status ?? "—"}
              </p>
            </div>
          </div>

          {canMarkPaid ? (
            <div className="mt-6 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
              <p className="font-semibold">Oczekiwanie na płatność</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Po otrzymaniu płatności oznacz ją jako opłaconą. Wtedy będzie
                można wgrać finalne zdjęcia dla klienta.
              </p>
            </div>
          ) : null}

          {alreadyPaid ? (
            <div className="mt-6 rounded-card border border-success/20 bg-success-soft p-4 text-success">
              <p className="font-semibold">Płatność została potwierdzona</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Możesz wgrać finalne zdjęcia i przygotować paczkę ZIP dla
                klienta.
              </p>{" "}
            </div>
          ) : null}

          <div className="mt-8">
            {overview.photos.length > 0 ? (
              <div className="grid gap-4">
                {overview.photos.map((photo, index) => (
                  <SelectedPhotoRow
                    key={photo.photo_id}
                    photo={photo}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={
                  selectedCount > 0
                    ? "Backend zwrócił liczbę wybranych, ale nie zwrócił listy zdjęć"
                    : "Klient nie zatwierdził jeszcze wyboru"
                }
                description={
                  selectedCount > 0
                    ? "Mark-paid nadal działa, ale do pełnego FE-6.1 potrzebujemy, żeby GET /api/sessions/{sessionId} zwracał listę SelectedPhotos/selections z note i filename."
                    : "Gdy klient zatwierdzi wybór, pojawi się tutaj lista wybranych zdjęć i notatek."
                }
              />
            )}
          </div>
        </>
      ) : null}

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Potwierdzić płatność?"
        description="Potwierdź tylko wtedy, gdy płatność została przyjęta poza FotoBudką. Po tej akcji będzie można wgrać finalne zdjęcia."
        footer={
          <>
            <Button
              variant="outline"
              disabled={markPaidMutation.isPending}
              onClick={() => setConfirmOpen(false)}
            >
              Anuluj
            </Button>

            <Button
              variant="secondary"
              isLoading={markPaidMutation.isPending}
              onClick={handleMarkPaid}
            >
              Oznacz jako opłacone
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-card border border-border bg-bg p-4">
            <p className="text-sm text-fg-muted">Wybrane zdjęcia</p>
            <p className="mt-1 text-3xl font-bold text-fg">{selectedCount}</p>
          </div>

          <div className="rounded-card border border-main/20 bg-main-subtle p-4">
            <p className="text-sm text-fg-muted">Kwota płatności</p>
            <p className="mt-1 text-3xl font-bold text-fg">
              {formatMoney(amountCents, currency)}
            </p>
          </div>

          <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
            <p className="font-semibold">Po potwierdzeniu</p>
            <p className="mt-1 text-sm leading-6 opacity-80">
              Wybór klienta pozostanie zablokowany, a Ty przejdziesz do etapu
              przygotowania finalnych zdjęć.
            </p>
          </div>
        </div>
      </Modal>
    </section>
  );
}
