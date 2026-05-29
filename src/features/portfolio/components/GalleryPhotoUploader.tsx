import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../../../components/ui";
import { toastApiError } from "../../../lib/notifications/apiToast";
import { queryKeys } from "../../../lib/query/keys";
import { cn } from "../../../lib/utils/cn";
import { uploadFileToPresignedUrl } from "../../uploads/uploadToPresignedUrl";
import { completeGalleryPhoto, presignGalleryPhotos } from "../api";

type UploadStatus =
  | "queued"
  | "presigning"
  | "uploading"
  | "completing"
  | "done"
  | "error";

type UploadItem = {
  localId: string;
  file: File;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: UploadStatus;
  progress: number;
  error?: string;
};

type GalleryPhotoUploaderProps = {
  galleryId: string;
};

const statusLabel: Record<UploadStatus, string> = {
  queued: "W kolejce",
  presigning: "Presign",
  uploading: "Upload",
  completing: "Complete",
  done: "Gotowe",
  error: "Błąd",
};

function createLocalId() {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getMimeType(file: File) {
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

function isSupportedImage(file: File) {
  const mimeType = getMimeType(file);

  return mimeType === "image/jpeg" || mimeType === "image/png";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function GalleryPhotoUploader({ galleryId }: GalleryPhotoUploaderProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.status === "done").length;
    const failed = items.filter((item) => item.status === "error").length;

    const progress =
      total === 0
        ? 0
        : Math.round(
            items.reduce((sum, item) => sum + item.progress, 0) / total,
          );

    return {
      total,
      done,
      failed,
      progress,
    };
  }, [items]);

  function updateItem(localId: string, patch: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function addFiles(files: FileList | File[]) {
    const incomingFiles = Array.from(files);
    const supportedFiles = incomingFiles.filter(isSupportedImage);

    if (supportedFiles.length !== incomingFiles.length) {
      toast.warning("Pominięto pliki inne niż JPG/PNG.");
    }

    const nextItems = supportedFiles.map<UploadItem>((file) => ({
      localId: createLocalId(),
      file,
      filename: file.name,
      mimeType: getMimeType(file),
      sizeBytes: file.size,
      status: "queued",
      progress: 0,
    }));

    setItems((current) => [...current, ...nextItems]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  }

  async function handleUpload() {
    const queuedItems = items.filter(
      (item) => item.status === "queued" || item.status === "error",
    );

    if (queuedItems.length === 0) {
      toast.info("Nie ma plików do wysłania.");
      return;
    }

    setIsUploading(true);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const item of queuedItems) {
        updateItem(item.localId, {
          status: "presigning",
          progress: 0,
          error: undefined,
        });

        try {
          const [target] = await presignGalleryPhotos(galleryId, {
            files: [
              {
                filename: item.filename,
                mime_type: item.mimeType,
                size_bytes: item.sizeBytes,
              },
            ],
          });

          updateItem(item.localId, {
            status: "uploading",
            progress: 1,
          });

          await uploadFileToPresignedUrl({
            file: item.file,
            putUrl: target.put_url,
            mimeType: item.mimeType,
            onProgress: (progress) => {
              updateItem(item.localId, {
                progress,
              });
            },
          });

          updateItem(item.localId, {
            status: "completing",
            progress: 100,
          });

          await completeGalleryPhoto(galleryId, target.photo_id);

          updateItem(item.localId, {
            status: "done",
            progress: 100,
          });

          successCount += 1;
        } catch (error) {
          updateItem(item.localId, {
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Nie udało się wysłać pliku.",
          });

          failedCount += 1;
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio.gallery(galleryId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio.galleries(),
        }),
      ]);

      if (successCount > 0 && failedCount === 0) {
        toast.success(`Wysłano ${successCount} zdjęć do galerii.`);
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(
          `Wysłano ${successCount} zdjęć, ale ${failedCount} zakończyło się błędem.`,
        );
      } else {
        toast.error("Nie udało się wysłać zdjęć.");
      }
    } catch (error) {
      toastApiError(error, "Nie udało się wysłać zdjęć.");
    } finally {
      setIsUploading(false);
    }
  }

  function clearDone() {
    setItems((current) => current.filter((item) => item.status !== "done"));
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Upload zdjęć</p>
          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Zdjęcia portfolio
          </h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Wybierz JPG/PNG. Pliki idą bezpośrednio do storage przez presigned
            URL, a backend zapisuje zdjęcie w galerii po `complete`.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            Dodaj zdjęcia
          </Button>

          <Button
            variant="secondary"
            disabled={isUploading || items.length === 0}
            isLoading={isUploading}
            onClick={handleUpload}
          >
            Rozpocznij upload
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className="mt-6 cursor-pointer rounded-card border border-dashed border-border bg-bg p-8 text-center transition hover:bg-main-subtle"
        onClick={() => {
          if (!isUploading) {
            inputRef.current?.click();
          }
        }}
      >
        <p className="text-lg font-semibold text-fg">
          Kliknij, żeby wybrać zdjęcia
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          Zdjęcia portfolio są publiczne i bez watermarków.
        </p>
      </div>

      {items.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">Pliki</p>
              <p className="mt-1 text-2xl font-bold text-fg">{stats.total}</p>
            </div>

            <div className="rounded-card bg-success-soft p-4">
              <p className="text-xs font-medium text-fg-muted">Gotowe</p>
              <p className="mt-1 text-2xl font-bold text-success">
                {stats.done}
              </p>
            </div>

            <div className="rounded-card bg-danger-soft p-4">
              <p className="text-xs font-medium text-fg-muted">Błędy</p>
              <p className="mt-1 text-2xl font-bold text-danger">
                {stats.failed}
              </p>
            </div>

            <div className="rounded-card bg-main-subtle p-4">
              <p className="text-xs font-medium text-fg-muted">Progress</p>
              <p className="mt-1 text-2xl font-bold text-fg">
                {stats.progress}%
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-bg-muted">
            <div
              className="h-full rounded-full bg-main transition-all"
              style={{
                width: `${stats.progress}%`,
              }}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={isUploading}
              onClick={clearDone}
            >
              Wyczyść gotowe
            </Button>
          </div>

          <div className="mt-6 rounded-card border border-border">
            {items.map((item) => (
              <div
                key={item.localId}
                className="grid gap-3 border-b border-border p-4 last:border-b-0 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-fg">{item.filename}</p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        item.status === "done"
                          ? "bg-success-soft text-success"
                          : item.status === "error"
                            ? "bg-danger-soft text-danger"
                            : "bg-main-soft text-main-active",
                      )}
                    >
                      {statusLabel[item.status]}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-fg-soft">
                    {formatFileSize(item.sizeBytes)} · {item.mimeType}
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.status === "error" ? "bg-danger" : "bg-main",
                      )}
                      style={{
                        width: `${item.progress}%`,
                      }}
                    />
                  </div>

                  {item.error ? (
                    <p className="mt-2 text-xs font-medium text-danger">
                      {item.error}
                    </p>
                  ) : null}
                </div>

                <p className="text-sm font-semibold text-fg-muted">
                  {item.progress}%
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
