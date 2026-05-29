import { Link } from "react-router";
import { toast } from "sonner";
import { Button, EmptyState, Spinner } from "../../../components/ui";
import { ApiError } from "../../../lib/api/client";
import { formatDate } from "../../sessions/utils";
import { useClientDeliveryDownloadQuery } from "../hooks";

type ClientDeliveryViewProps = {
  sessionId: string;
  sessionTitle?: string;
};

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return "—";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getDownloadErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Dostęp wygasł albo został unieważniony. Wejdź ponownie kodem lub linkiem od fotografa.";
    }

    if (error.status === 404) {
      return "Paczka ZIP nie jest jeszcze gotowa albo została już usunięta.";
    }

    if (error.status === 409) {
      return "Sesja nie jest jeszcze gotowa do pobrania. Spróbuj ponownie za chwilę.";
    }
  }

  return "Nie udało się pobrać informacji o paczce ZIP.";
}

function DownloadMetricCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string;
  description: string;
  tone?: "default" | "main" | "success";
}) {
  const className = {
    default: "bg-surface",
    main: "bg-main-subtle",
    success: "bg-success-soft",
  }[tone];

  return (
    <article
      className={`rounded-card border border-border p-5 shadow-card-sm ${className}`}
    >
      <p className="text-sm font-medium text-fg-muted">{label}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-fg">{value}</p>

      <p className="mt-2 text-xs leading-5 text-fg-muted">{description}</p>
    </article>
  );
}

export function ClientDeliveryView({
  sessionId,
  sessionTitle,
}: ClientDeliveryViewProps) {
  const downloadQuery = useClientDeliveryDownloadQuery(sessionId);

  function handleDownload() {
    const url = downloadQuery.data?.download_url;

    if (!url) {
      toast.error("Brak linku do pobrania.");
      return;
    }

    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      window.location.assign(url);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <div className="inline-flex rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
              Dostarczone
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              {sessionTitle ?? "Twoje zdjęcia są gotowe"}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              Fotograf przygotował finalną paczkę ZIP. Pobierasz jedną paczkę ze
              wszystkimi gotowymi zdjęciami, bez pojedynczych plików.
            </p>
          </div>

          <aside className="rounded-card border border-border bg-bg p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
              Co dalej?
            </p>

            <ol className="mt-4 grid gap-3 text-sm leading-6 text-fg-muted">
              <li>
                <span className="font-semibold text-fg">1.</span> Kliknij
                „Pobierz ZIP”.
              </li>

              <li>
                <span className="font-semibold text-fg">2.</span> Zapisz paczkę
                na swoim urządzeniu.
              </li>

              <li>
                <span className="font-semibold text-fg">3.</span> Jeśli link
                wygaśnie, wróć tutaj i odśwież link.
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card-sm">
        {downloadQuery.isLoading ? (
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm text-fg-muted">
              Sprawdzam dostępność paczki ZIP...
            </p>
          </div>
        ) : null}

        {downloadQuery.isError ? (
          <EmptyState
            title="Paczka nie jest jeszcze dostępna"
            description={getDownloadErrorMessage(downloadQuery.error)}
            action={
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  isLoading={downloadQuery.isFetching}
                  onClick={() => downloadQuery.refetch()}
                >
                  Sprawdź ponownie
                </Button>

                <Link
                  to="/client"
                  className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
                >
                  Wejdź ponownie kodem
                </Link>
              </div>
            }
          />
        ) : null}

        {downloadQuery.data ? (
          <div>
            <div className="grid gap-4 md:grid-cols-3">
              <DownloadMetricCard
                label="Wersja paczki"
                value={`v${downloadQuery.data.version}`}
                description="Najnowsza gotowa wersja dostawy."
                tone="main"
              />

              <DownloadMetricCard
                label="Rozmiar"
                value={formatFileSize(downloadQuery.data.zip_size_bytes)}
                description="Rozmiar pliku ZIP do pobrania."
              />

              <DownloadMetricCard
                label="Wygenerowano"
                value={formatDate(downloadQuery.data.generated_at)}
                description="Data przygotowania paczki."
                tone="success"
              />
            </div>

            <div className="mt-6 rounded-card border border-success/20 bg-success-soft p-5 text-success">
              <p className="font-semibold">ZIP gotowy do pobrania</p>

              <p className="mt-1 text-sm leading-6 opacity-80">
                Link jest podpisany czasowo przez backend. Jeśli pobieranie nie
                wystartuje albo link wygaśnie, kliknij „Odśwież link”.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[auto_auto_1fr]">
              <Button size="lg" variant="secondary" onClick={handleDownload}>
                Pobierz ZIP
              </Button>

              <Button
                size="lg"
                variant="outline"
                isLoading={downloadQuery.isFetching}
                onClick={() => downloadQuery.refetch()}
              >
                Odśwież link
              </Button>

              <Link
                to="/client"
                className="inline-flex h-12 items-center justify-center rounded-button border border-border bg-surface px-5 text-base font-semibold text-fg transition hover:bg-bg-muted sm:justify-self-end"
              >
                Mam inny kod
              </Link>
            </div>

            <div className="mt-6 rounded-card border border-main/20 bg-main-subtle p-4">
              <p className="text-sm font-semibold text-fg">
                Nie widzisz pobierania?
              </p>

              <p className="mt-1 text-sm leading-6 text-fg-muted">
                Przeglądarka może blokować nowe okna. W takim przypadku kliknij
                ponownie „Pobierz ZIP” albo odśwież link i spróbuj jeszcze raz.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
