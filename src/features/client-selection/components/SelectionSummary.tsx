import { Button } from "../../../components/ui";
import type { ClientSessionAccessResult } from "../../client-access/types";
import type { SubmitSelectionResult } from "../types";
import { formatMoney } from "../../sessions/utils";

type SelectionSummaryProps = {
  session: ClientSessionAccessResult;
  selectedCount: number;
  loadedCount: number;
  totalCount?: number;
  isLocked: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  submittedResult: SubmitSelectionResult | null;
  onSubmitClick: () => void;
};

export function SelectionSummary({
  session,
  selectedCount,
  loadedCount,
  totalCount,
  isLocked,
  isSaving,
  isSubmitting,
  submittedResult,
  onSubmitClick,
}: SelectionSummaryProps) {
  const extraCount = Math.max(0, selectedCount - session.included_count);

  const estimatedAmountCents =
    session.base_price_cents + extraCount * session.extra_price_cents;

  const hasMinimumSelection = selectedCount >= session.min_select_count;

  const finalAmountCents =
    submittedResult?.amount_cents ?? estimatedAmountCents;

  return (
    <aside className="rounded-card border border-border bg-surface p-5 shadow-card-sm lg:sticky lg:top-8">
      <p className="text-sm font-semibold text-fg-soft">Podsumowanie wyboru</p>

      <h2 className="mt-2 text-2xl font-bold text-fg">
        {selectedCount} wybranych
      </h2>

      <div className="mt-5 grid gap-3">
        <div className="rounded-card bg-bg p-4">
          <p className="text-xs font-medium text-fg-soft">Zdjęcia w pakiecie</p>
          <p className="mt-1 font-semibold text-fg">{session.included_count}</p>
        </div>

        <div className="rounded-card bg-bg p-4">
          <p className="text-xs font-medium text-fg-soft">Minimum wyboru</p>
          <p className="mt-1 font-semibold text-fg">
            {session.min_select_count}
          </p>
        </div>

        <div className="rounded-card bg-bg p-4">
          <p className="text-xs font-medium text-fg-soft">Dopłata</p>
          <p className="mt-1 font-semibold text-fg">
            {extraCount} ×{" "}
            {formatMoney(session.extra_price_cents, session.currency)}
          </p>
        </div>

        <div className="rounded-card bg-main-subtle p-4">
          <p className="text-xs font-medium text-fg-soft">Kwota razem</p>
          <p className="mt-1 text-2xl font-bold text-fg">
            {formatMoney(finalAmountCents, session.currency)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-card border border-border bg-bg p-4">
        <p className="text-sm text-fg-muted">
          Załadowano zdjęć:{" "}
          <span className="font-semibold text-fg">
            {loadedCount}
            {totalCount !== undefined ? ` / ${totalCount}` : ""}
          </span>
        </p>

        {isSaving ? (
          <p className="mt-2 text-sm text-info">Zapisuję zmiany...</p>
        ) : (
          <p className="mt-2 text-sm text-success">
            Zmiany zapisują się automatycznie.
          </p>
        )}
      </div>

      {!hasMinimumSelection && !isLocked ? (
        <div className="mt-5 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Za mało zdjęć</p>
          <p className="mt-1 text-sm opacity-80">
            Minimalna liczba wyboru dla tej sesji to {session.min_select_count}.
          </p>
        </div>
      ) : null}

      {submittedResult ? (
        <div className="mt-5 rounded-card border border-success/20 bg-success-soft p-4 text-success">
          <p className="font-semibold">Wybór zatwierdzony</p>
          <p className="mt-1 text-sm opacity-80">
            Fotograf otrzymał wybór. Status sesji: waiting for payment.
          </p>
        </div>
      ) : null}

      {session.status !== "selecting" && !submittedResult ? (
        <div className="mt-5 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Wybór zablokowany</p>
          <p className="mt-1 text-sm opacity-80">
            Ta sesja nie jest już w statusie wyboru.
          </p>
        </div>
      ) : null}

      <Button
        className="mt-6 w-full"
        variant="secondary"
        disabled={!hasMinimumSelection || isLocked}
        isLoading={isSubmitting}
        onClick={onSubmitClick}
      >
        Zatwierdź wybór
      </Button>
    </aside>
  );
}
