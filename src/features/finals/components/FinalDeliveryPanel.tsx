import { ChangeEvent, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, EmptyState, Modal, Spinner } from "../../../components/ui";
import { toastApiError } from "../../../lib/notifications/apiToast";
import { queryKeys } from "../../../lib/query/keys";
import { cn } from "../../../lib/utils/cn";
import { uploadFileToPresignedUrl } from "../../uploads/uploadToPresignedUrl";
import { usePhotographerSelectionOverviewQuery } from "../../photographer-selection/hooks";
import type { PhotographerSelectedPhoto } from "../../photographer-selection/types";
import { formatDate } from "../../sessions/utils";
import { useCloseSessionMutation } from "../../sessions/hooks";
import { completeFinalUpload, presignFinalUploads } from "../api";
import { useGenerateDeliveryZipMutation } from "../hooks";
import type { GenerateDeliveryZipResult } from "../types";

type DeliverySummaryLike = {
  id?: string;
  version?: number;
  status?: string;
  zip_size_bytes?: number | null;
  generated_at?: string | null;
} | null;

type FinalUploadStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "completing"
  | "done"
  | "error";

type FinalUploadState = {
  status: FinalUploadStatus;
  progress: number;
  error?: string;
  filename?: string;
};

type FinalDeliveryPanelProps = {
  sessionId: string;
  sessionStatus: string;
  latestDelivery?: DeliverySummaryLike;
};

const uploadStatusLabel: Record<FinalUploadStatus, string> = {
  idle: "Brak finala",
  presigning: "Przygotowanie",
  uploading: "Upload",
  completing: "Complete",
  done: "Final wgrany",
  error: "Błąd",
};

function getFileMimeType(file: File) {
  if (file.type) {
    return file.type;
  }

  if (/\.(jpe?g)$/i.test(file.name)) {
    return "image/jpeg";
  }

  if (/\.png$/i.test(file.name)) {
    return "image/png";
  }

  return "application/octet-stream";
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return "—";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isFinalUploadAllowed(sessionStatus: string) {
  return sessionStatus === "editing" || sessionStatus === "delivered";
}

function isPhotoFinalUploaded(
  photo: PhotographerSelectedPhoto,
  uploadState?: FinalUploadState,
) {
  return photo.final_uploaded || uploadState?.status === "done";
}

function FinalPhotoCard({
  photo,
  index,
  disabled,
  uploadState,
  onFileSelected,
}: {
  photo: PhotographerSelectedPhoto;
  index: number;
  disabled: boolean;
  uploadState?: FinalUploadState;
  onFileSelected: (photo: PhotographerSelectedPhoto, file: File) => void;
}) {
  const isUploaded = isPhotoFinalUploaded(photo, uploadState);
  const status =
    uploadState?.status ?? (photo.final_uploaded ? "done" : "idle");
  const progress = uploadState?.progress ?? (isUploaded ? 100 : 0);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelected(photo, file);
    }

    event.target.value = "";
  }

  return (
    <article
      className={cn(
        "grid gap-4 rounded-card border bg-bg p-4 md:grid-cols-[120px_1fr_auto]",
        isUploaded ? "border-success/30" : "border-border",
      )}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-card bg-bg-muted">
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-fg">
            {photo.original_filename}
          </p>

          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              isUploaded
                ? "bg-success-soft text-success"
                : status === "error"
                  ? "bg-danger-soft text-danger"
                  : "bg-warning-soft text-warning",
            )}
          >
            {uploadStatusLabel[status]}
          </span>
        </div>

        {photo.note ? (
          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">
            Notatka klienta: {photo.note}
          </p>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">Brak notatki klienta.</p>
        )}

        {uploadState?.filename ? (
          <p className="mt-2 text-xs text-fg-soft">
            Plik finalny: {uploadState.filename}
          </p>
        ) : null}

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              status === "error" ? "bg-danger" : "bg-main",
            )}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {uploadState?.error ? (
          <p className="mt-2 text-xs font-medium text-danger">
            {uploadState.error}
          </p>
        ) : null}
      </div>

      <div className="flex items-start justify-end">
        <label
          className={cn(
            "inline-flex h-10 cursor-pointer items-center justify-center rounded-button px-4 text-sm font-semibold transition",
            disabled
              ? "pointer-events-none bg-bg-muted text-fg-soft"
              : isUploaded
                ? "border border-border bg-surface text-fg hover:bg-bg-muted"
                : "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
          )}
        >
          {isUploaded ? "Podmień final" : "Wgraj final"}
          <input
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            className="hidden"
            disabled={disabled}
            onChange={handleChange}
          />
        </label>
      </div>
    </article>
  );
}

export function FinalDeliveryPanel({
  sessionId,
  sessionStatus,
  latestDelivery,
}: FinalDeliveryPanelProps) {
  const queryClient = useQueryClient();

  const selectionQuery = usePhotographerSelectionOverviewQuery(sessionId);
  const generateZipMutation = useGenerateDeliveryZipMutation(sessionId);
  const closeSessionMutation = useCloseSessionMutation(sessionId);

  const [uploadStates, setUploadStates] = useState<
    Record<string, FinalUploadState>
  >({});

  const [generatedDelivery, setGeneratedDelivery] =
    useState<GenerateDeliveryZipResult | null>(null);

  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const photos = selectionQuery.data?.photos ?? [];

  const canUploadFinals = isFinalUploadAllowed(sessionStatus);

  const missingFinals = useMemo(() => {
    return photos.filter(
      (photo) => !isPhotoFinalUploaded(photo, uploadStates[photo.photo_id]),
    );
  }, [photos, uploadStates]);

  const uploadedCount = photos.length - missingFinals.length;
  const allFinalsUploaded = photos.length > 0 && missingFinals.length === 0;

  const deliveryStatus =
    latestDelivery?.status ?? generatedDelivery?.status ?? null;

  const deliveryVersion =
    latestDelivery?.version ?? generatedDelivery?.version ?? null;

  const canGenerateZip =
    canUploadFinals &&
    allFinalsUploaded &&
    !generateZipMutation.isPending &&
    deliveryStatus !== "generating";

  const canCloseSession =
    sessionStatus === "delivered" && !closeSessionMutation.isPending;

  function updateUploadState(
    photoId: string,
    patch: Partial<FinalUploadState>,
  ) {
    setUploadStates((current) => ({
      ...current,
      [photoId]: {
        status: current[photoId]?.status ?? "idle",
        progress: current[photoId]?.progress ?? 0,
        ...current[photoId],
        ...patch,
      },
    }));
  }

  async function handleFinalFileSelected(
    photo: PhotographerSelectedPhoto,
    file: File,
  ) {
    if (!canUploadFinals) {
      toast.error(
        "Finale można wgrywać tylko w statusie editing albo delivered.",
      );
      return;
    }

    const mimeType = getFileMimeType(file);

    updateUploadState(photo.photo_id, {
      status: "presigning",
      progress: 0,
      error: undefined,
      filename: file.name,
    });

    try {
      const [target] = await presignFinalUploads(sessionId, {
        files: [
          {
            photo_id: photo.photo_id,
            filename: file.name,
            mime_type: mimeType,
            size_bytes: file.size,
          },
        ],
      });

      updateUploadState(photo.photo_id, {
        status: "uploading",
        progress: 1,
      });

      await uploadFileToPresignedUrl({
        file,
        putUrl: target.put_url,
        mimeType,
        onProgress: (progress) => {
          updateUploadState(photo.photo_id, {
            progress,
          });
        },
      });

      updateUploadState(photo.photo_id, {
        status: "completing",
        progress: 100,
      });

      await completeFinalUpload(sessionId, target.final_id);

      updateUploadState(photo.photo_id, {
        status: "done",
        progress: 100,
        error: undefined,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.detail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.all,
        }),
      ]);

      toast.success(`Final dla ${photo.original_filename} został wgrany.`);
    } catch (error) {
      updateUploadState(photo.photo_id, {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się wgrać finala.",
      });

      toastApiError(error, "Nie udało się wgrać finala.");
    }
  }

  function handleGenerateZip() {
    generateZipMutation.mutate(undefined, {
      onSuccess: (result) => {
        setGeneratedDelivery(result);
        setGenerateConfirmOpen(false);
      },
    });
  }

  function handleCloseSession() {
    closeSessionMutation.mutate(undefined, {
      onSuccess: () => {
        setCloseConfirmOpen(false);
      },
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-fg-soft">
            Finale i dostawa ZIP
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Upload finalnych zdjęć
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
            Wgraj gotowy plik pod każde zdjęcie wybrane przez klienta. Gdy
            wszystkie wybrane zdjęcia mają final, możesz wygenerować
            wersjonowaną paczkę ZIP.
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
            disabled={!canGenerateZip}
            isLoading={generateZipMutation.isPending}
            onClick={() => setGenerateConfirmOpen(true)}
          >
            Generuj ZIP
          </Button>

          <Button
            variant="outline"
            disabled={!canCloseSession}
            isLoading={closeSessionMutation.isPending}
            onClick={() => setCloseConfirmOpen(true)}
          >
            Zamknij sesję
          </Button>
        </div>
      </div>

      {!canUploadFinals ? (
        <div className="mt-6 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Upload finali niedostępny</p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            Finale można wgrywać po oznaczeniu płatności jako opłaconej, gdy
            sesja jest w statusie editing. Dla kolejnych wersji paczki backend
            dopuszcza także status delivered.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-card bg-bg p-4">
          <p className="text-xs font-medium text-fg-soft">Wybrane zdjęcia</p>
          <p className="mt-1 text-2xl font-bold text-fg">{photos.length}</p>
        </div>

        <div className="rounded-card bg-success-soft p-4">
          <p className="text-xs font-medium text-fg-muted">Finale wgrane</p>
          <p className="mt-1 text-2xl font-bold text-success">
            {uploadedCount}
          </p>
        </div>

        <div className="rounded-card bg-warning-soft p-4">
          <p className="text-xs font-medium text-fg-muted">Brakuje finali</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {missingFinals.length}
          </p>
        </div>

        <div className="rounded-card bg-main-subtle p-4">
          <p className="text-xs font-medium text-fg-muted">ZIP</p>
          <p className="mt-1 text-2xl font-bold text-fg">
            {deliveryVersion ? `v${deliveryVersion}` : "—"}
          </p>
          <p className="mt-1 text-xs font-medium text-fg-muted">
            {deliveryStatus ?? "brak paczki"}
          </p>
        </div>
      </div>

      {latestDelivery ? (
        <div className="mt-6 rounded-card border border-border bg-bg p-4">
          <p className="text-sm font-semibold text-fg">Ostatnia paczka ZIP</p>

          <p className="mt-2 text-sm text-fg-muted">
            Wersja:{" "}
            <span className="font-semibold text-fg">
              v{latestDelivery.version ?? "—"}
            </span>
            {" · "}
            Status:{" "}
            <span className="font-semibold text-fg">
              {latestDelivery.status ?? "—"}
            </span>
            {" · "}
            Rozmiar:{" "}
            <span className="font-semibold text-fg">
              {formatFileSize(latestDelivery.zip_size_bytes)}
            </span>
            {" · "}
            Wygenerowano:{" "}
            <span className="font-semibold text-fg">
              {formatDate(latestDelivery.generated_at)}
            </span>
          </p>
        </div>
      ) : null}

      {selectionQuery.isLoading ? (
        <div className="mt-6 rounded-card border border-border bg-bg p-5">
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm text-fg-muted">Ładuję wybrane zdjęcia...</p>
          </div>
        </div>
      ) : null}

      {selectionQuery.isError ? (
        <div className="mt-6 rounded-card border border-danger/20 bg-danger-soft p-5 text-danger">
          <p className="font-semibold">Nie udało się pobrać wybranych zdjęć</p>
          <p className="mt-1 text-sm opacity-80">
            Bez listy wyboru nie da się przypisać finali do zdjęć.
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => selectionQuery.refetch()}
          >
            Spróbuj ponownie
          </Button>
        </div>
      ) : null}

      {selectionQuery.isSuccess && photos.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Brak wybranych zdjęć"
            description="Klient musi najpierw zatwierdzić wybór, a fotograf oznaczyć płatność jako opłaconą."
          />
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {photos.map((photo, index) => (
            <FinalPhotoCard
              key={photo.photo_id}
              photo={photo}
              index={index}
              disabled={!canUploadFinals}
              uploadState={uploadStates[photo.photo_id]}
              onFileSelected={handleFinalFileSelected}
            />
          ))}
        </div>
      ) : null}

      {allFinalsUploaded ? (
        <div className="mt-6 rounded-card border border-success/20 bg-success-soft p-4 text-success">
          <p className="font-semibold">Wszystkie finale są gotowe</p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            Możesz wygenerować paczkę ZIP. Worker utworzy nową wersję dostawy.
          </p>
        </div>
      ) : null}

      <Modal
        open={generateConfirmOpen}
        onOpenChange={setGenerateConfirmOpen}
        title="Wygenerować paczkę ZIP?"
        description="Backend utworzy nową wersję delivery i zleci workerowi wygenerowanie ZIP-a ze wszystkich finalnych zdjęć."
        footer={
          <>
            <Button
              variant="outline"
              disabled={generateZipMutation.isPending}
              onClick={() => setGenerateConfirmOpen(false)}
            >
              Anuluj
            </Button>

            <Button
              variant="secondary"
              isLoading={generateZipMutation.isPending}
              onClick={handleGenerateZip}
            >
              Generuj ZIP
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-card border border-border bg-bg p-4">
            <p className="text-sm text-fg-muted">Finale w paczce</p>
            <p className="mt-1 text-3xl font-bold text-fg">{photos.length}</p>
          </div>

          <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
            <p className="font-semibold">Wersjonowanie</p>
            <p className="mt-1 text-sm leading-6 opacity-80">
              Każde kliknięcie tworzy kolejną wersję ZIP-a, np. v1, v2, v3.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="Zamknąć sesję?"
        description="Zamknięcie sesji ustawia retencję. Po czasie cleanup usunie dane zgodnie z backendową polityką retencji."
        footer={
          <>
            <Button
              variant="outline"
              disabled={closeSessionMutation.isPending}
              onClick={() => setCloseConfirmOpen(false)}
            >
              Anuluj
            </Button>

            <Button
              variant="danger"
              isLoading={closeSessionMutation.isPending}
              onClick={handleCloseSession}
            >
              Zamknij sesję
            </Button>
          </>
        }
      >
        <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Uwaga</p>
          <p className="mt-1 text-sm leading-6 opacity-80">
            Zamykaj sesję dopiero wtedy, gdy klient odebrał finalną paczkę ZIP.
          </p>
        </div>
      </Modal>
    </section>
  );
}
