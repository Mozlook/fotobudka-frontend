import { Link } from "react-router";
import { toast } from "sonner";
import { Button, Modal } from "../../../components/ui";
import type { SessionAccessResult } from "../types";
import { formatDate } from "../utils";

type AccessResultModalProps = {
  open: boolean;
  access: SessionAccessResult | null;
  sessionId?: string;
  onOpenChange: (open: boolean) => void;
};

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} skopiowano.`);
  } catch {
    toast.error("Nie udało się skopiować do schowka.");
  }
}

export function AccessResultModal({
  open,
  access,
  sessionId,
  onOpenChange,
}: AccessResultModalProps) {
  if (!access) {
    return null;
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Dane dostępu klienta"
      description="Skopiuj kod lub link i przekaż je klientowi. Kod/link pokazujemy tylko w UI po utworzeniu albo regeneracji."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zamknij
          </Button>

          {sessionId ? (
            <Link
              to={`/app/sessions/${sessionId}`}
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
            >
              Otwórz sesję
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid gap-5">
        <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Ważne</p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            Nie zapisujemy kodów ani tokenów w logach. Jeżeli zamkniesz to okno
            i utracisz dane, wygeneruj nowy dostęp.
          </p>
        </div>

        <div className="rounded-card border border-border bg-bg p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold text-fg-soft">Kod klienta</p>
              <p className="mt-2 break-all font-mono text-2xl font-bold tracking-wide text-fg">
                {access.code}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(access.code, "Kod")}
            >
              Kopiuj kod
            </Button>
          </div>
        </div>

        <div className="rounded-card border border-border bg-bg p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg-soft">Link klienta</p>
              <p className="mt-2 break-all font-mono text-sm leading-6 text-fg">
                {access.link}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(access.link, "Link")}
              className="shrink-0"
            >
              Kopiuj link
            </Button>
          </div>
        </div>

        <p className="text-sm text-fg-muted">
          Utworzono: {formatDate(access.created_at)}
        </p>
      </div>
    </Modal>
  );
}
