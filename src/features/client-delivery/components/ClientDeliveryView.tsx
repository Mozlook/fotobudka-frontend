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
      return "Paczka ZIP nie jest jeszcze gotowa albo nie istnieje.";
    }

    if (error.status === 409) {
      return "Sesja nie jest jeszcze gotowa do pobrania.";
    }
  }

  return "Nie udało się pobrać informacji o paczce ZIP.";
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
    <div className="mx-auto max-w-5xl">
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <p className="text-sm font-semibold text-fg-soft">Dostawa ZIP</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
          {sessionTitle ?? "Twoje zdjęcia są gotowe"}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
          Fotograf przygotował finalną paczkę ZIP. Pobierasz jedną paczkę ze
          wszystkimi gotowymi zdjęciami, bez pojedynczych plików.
        </p>
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
          <div>
            <EmptyState
              title="Paczka nie jest jeszcze dostępna"
              description={getDownloadErrorMessage(downloadQuery.error)}
              action={
                <Button
                  variant="outline"
                  isLoading={downloadQuery.isFetching}
                  onClick={() => downloadQuery.refetch()}
                >
                  Sprawdź ponownie
                </Button>
              }
            />
          </div>
        ) : null}

        {downloadQuery.data ? (
          <div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-card bg-main-subtle p-5">
                <p className="text-xs font-medium text-fg-soft">
                  Wersja paczki
                </p>
                <p className="mt-2 text-3xl font-bold text-fg">
                  v{downloadQuery.data.version}
                </p>
              </div>

              <div className="rounded-card bg-bg p-5">
                <p className="text-xs font-medium text-fg-soft">Rozmiar</p>
                <p className="mt-2 text-3xl font-bold text-fg">
                  {formatFileSize(downloadQuery.data.zip_size_bytes)}
                </p>
              </div>

              <div className="rounded-card bg-bg p-5">
                <p className="text-xs font-medium text-fg-soft">Wygenerowano</p>
                <p className="mt-2 text-lg font-bold text-fg">
                  {formatDate(downloadQuery.data.generated_at)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-card border border-success/20 bg-success-soft p-5 text-success">
              <p className="font-semibold">ZIP gotowy do pobrania</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Link jest podpisany czasowo przez backend. Jeśli pobieranie
                wygaśnie, wróć tutaj i kliknij „Sprawdź ponownie”.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
