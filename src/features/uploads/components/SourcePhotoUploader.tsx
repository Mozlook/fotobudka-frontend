import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../../../components/ui";
import { toastApiError } from "../../../lib/notifications/apiToast";
import { queryKeys } from "../../../lib/query/keys";
import { cn } from "../../../lib/utils/cn";
import { completeSourcePhotoUpload, presignSourcePhotoUploads } from "../api";
import { uploadFileToPresignedUrl } from "../uploadToPresignedUrl";

const PRESIGN_BATCH_SIZE = 50;
const MAX_CONCURRENT_UPLOADS = 4;

type UploadItemStatus =
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
  status: UploadItemStatus;
  progress: number;
  photoId?: string;
  error?: string;
};

type UploadJob = {
  item: UploadItem;
  photoId: string;
  putUrl: string;
};

type SourcePhotoUploaderProps = {
  sessionId: string;
  disabled?: boolean;
};

const statusMeta: Record<
  UploadItemStatus,
  {
    label: string;
    className: string;
  }
> = {
  queued: {
    label: "W kolejce",
    className: "bg-bg-muted text-fg-muted",
  },
  presigning: {
    label: "Presign",
    className: "bg-info-soft text-info",
  },
  uploading: {
    label: "Upload",
    className: "bg-main-soft text-main-active",
  },
  completing: {
    label: "Complete",
    className: "bg-tertiary-soft text-tertiary",
  },
  done: {
    label: "Gotowe",
    className: "bg-success-soft text-success",
  },
  error: {
    label: "Błąd",
    className: "bg-danger-soft text-danger",
  },
};

function createLocalId() {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
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

  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    /\.(jpe?g|png)$/i.test(file.name)
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function runWithConcurrency<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<void>,
) {
  const queue = [...values];

  const workers = Array.from(
    {
      length: Math.min(concurrency, queue.length),
    },
    async () => {
      while (queue.length > 0) {
        const value = queue.shift();

        if (value) {
          await worker(value);
        }
      }
    },
  );

  await Promise.all(workers);
}

export function SourcePhotoUploader({
  sessionId,
  disabled = false,
}: SourcePhotoUploaderProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.status === "done").length;
    const failed = items.filter((item) => item.status === "error").length;
    const queued = items.filter(
      (item) => item.status === "queued" || item.status === "error",
    ).length;

    const globalProgress =
      total === 0
        ? 0
        : Math.round(
            items.reduce((sum, item) => sum + item.progress, 0) / total,
          );

    return {
      total,
      done,
      failed,
      queued,
      globalProgress,
    };
  }, [items]);

  const canUpload = stats.queued > 0 && !isUploading && !disabled;

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

  function updateMany(localIds: string[], patch: Partial<UploadItem>) {
    const ids = new Set(localIds);

    setItems((current) =>
      current.map((item) =>
        ids.has(item.localId)
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function addFiles(fileList: FileList | File[]) {
    const incomingFiles = Array.from(fileList);
    const supportedFiles = incomingFiles.filter(isSupportedImage);
    const rejectedCount = incomingFiles.length - supportedFiles.length;

    if (rejectedCount > 0) {
      toast.warning(
        `Pominięto ${rejectedCount} plików. Na tym etapie obsługujemy JPG i PNG.`,
      );
    }

    setItems((current) => {
      const existingKeys = new Set(
        current.map((item) => getFileKey(item.file)),
      );

      const nextItems = supportedFiles
        .filter((file) => !existingKeys.has(getFileKey(file)))
        .map<UploadItem>((file) => ({
          localId: createLocalId(),
          file,
          filename: file.name,
          mimeType: getMimeType(file),
          sizeBytes: file.size,
          status: "queued",
          progress: 0,
        }));

      const duplicatedCount = supportedFiles.length - nextItems.length;

      if (duplicatedCount > 0) {
        toast.info(`Pominięto ${duplicatedCount} duplikatów.`);
      }

      return [...current, ...nextItems];
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) {
      return;
    }

    addFiles(event.dataTransfer.files);
  }

  async function uploadOne(job: UploadJob) {
    const { item, photoId, putUrl } = job;

    try {
      updateItem(item.localId, {
        status: "uploading",
        progress: 1,
        photoId,
        error: undefined,
      });

      await uploadFileToPresignedUrl({
        file: item.file,
        putUrl,
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

      await completeSourcePhotoUpload(sessionId, photoId);

      updateItem(item.localId, {
        status: "done",
        progress: 100,
        error: undefined,
      });
    } catch (error) {
      updateItem(item.localId, {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się wysłać pliku.",
      });

      throw error;
    }
  }

  async function handleStartUpload() {
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
      for (
        let index = 0;
        index < queuedItems.length;
        index += PRESIGN_BATCH_SIZE
      ) {
        const batch = queuedItems.slice(index, index + PRESIGN_BATCH_SIZE);
        const batchIds = batch.map((item) => item.localId);

        updateMany(batchIds, {
          status: "presigning",
          progress: 0,
          error: undefined,
        });

        let uploadTargets;

        try {
          uploadTargets = await presignSourcePhotoUploads(sessionId, {
            files: batch.map((item) => ({
              filename: item.filename,
              mime_type: item.mimeType,
              size_bytes: item.sizeBytes,
            })),
          });
        } catch (error) {
          failedCount += batch.length;

          updateMany(batchIds, {
            status: "error",
            error: "Nie udało się przygotować uploadu.",
          });

          toastApiError(error, "Nie udało się przygotować uploadu.");
          continue;
        }

        const jobs: UploadJob[] = batch.map((item, uploadIndex) => ({
          item,
          photoId: uploadTargets[uploadIndex].photo_id,
          putUrl: uploadTargets[uploadIndex].put_url,
        }));

        await runWithConcurrency(jobs, MAX_CONCURRENT_UPLOADS, async (job) => {
          try {
            await uploadOne(job);
            successCount += 1;
          } catch {
            failedCount += 1;
          }
        });

        await queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.detail(sessionId),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all,
      });

      if (successCount > 0 && failedCount === 0) {
        toast.success(`Wysłano ${successCount} zdjęć.`);
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(
          `Wysłano ${successCount} zdjęć, ale ${failedCount} zakończyło się błędem.`,
        );
      } else {
        toast.error("Nie udało się wysłać zdjęć.");
      }
    } finally {
      setIsUploading(false);
    }
  }

  function clearDone() {
    setItems((current) => current.filter((item) => item.status !== "done"));
  }

  function clearAll() {
    setItems([]);
  }

  function removeItem(localId: string) {
    setItems((current) => current.filter((item) => item.localId !== localId));
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-fg-soft">
            Upload zdjęć źródłowych
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Zdjęcia do selekcji
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
            Wybierz pliki JPG/PNG. Po wysłaniu zdjęć system przygotuje miniatury
            i podglądy dla klienta.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={items.length === 0 || isUploading}
            onClick={clearDone}
          >
            Wyczyść gotowe
          </Button>

          <Button
            variant="outline"
            disabled={items.length === 0 || isUploading}
            onClick={clearAll}
          >
            Wyczyść wszystko
          </Button>
        </div>
      </div>

      {disabled ? (
        <div className="mt-5 rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
          <p className="font-semibold">Upload niedostępny</p>
          <p className="mt-1 text-sm opacity-80">
            Ta sesja jest w statusie, który nie pozwala na dodawanie zdjęć
            źródłowych.
          </p>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();

          if (!disabled && !isUploading) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-6 rounded-card border border-dashed p-8 text-center transition",
          isDragging ? "border-main bg-main-subtle" : "border-border bg-bg",
          disabled || isUploading
            ? "cursor-not-allowed opacity-70"
            : "cursor-pointer hover:bg-main-subtle",
        )}
        onClick={() => {
          if (!disabled && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-main-soft text-main-active">
          <svg
            viewBox="0 0 24 24"
            className="size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M20 16.5v1A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-1" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-fg">
          Przeciągnij zdjęcia tutaj
        </h3>
        <p className="mt-2 text-sm text-fg-muted">
          albo kliknij, żeby wybrać pliki z dysku.
        </p>
        <p className="mt-3 text-xs text-fg-soft">
          Możesz dodać wiele zdjęć naraz. Postęp uploadu zobaczysz poniżej.
        </p>
      </div>

      {items.length > 0 ? (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-card bg-bg p-4">
              <p className="text-xs font-medium text-fg-soft">Pliki</p>
              <p className="mt-1 text-2xl font-bold text-fg">{stats.total}</p>
            </div>

            <div className="rounded-card bg-success-soft p-4">
              <p className="text-xs font-medium text-fg-muted">Wysłane</p>
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
                {stats.globalProgress}%
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-3 overflow-hidden rounded-full bg-bg-muted">
              <div
                className="h-full rounded-full bg-main transition-all"
                style={{
                  width: `${stats.globalProgress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              isLoading={isUploading}
              disabled={!canUpload}
              onClick={handleStartUpload}
            >
              Rozpocznij upload
            </Button>

            <Button
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Dodaj kolejne pliki
            </Button>
          </div>

          <div className="mt-6 max-h-96 overflow-y-auto rounded-card border border-border">
            {items.map((item) => {
              const meta = statusMeta[item.status];

              return (
                <div
                  key={item.localId}
                  className="grid gap-3 border-b border-border p-4 last:border-b-0 md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-fg">
                        {item.filename}
                      </p>

                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          meta.className,
                        )}
                      >
                        {meta.label}
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

                  <div className="flex items-start justify-end gap-2">
                    <span className="min-w-12 text-right text-sm font-semibold text-fg-muted">
                      {item.progress}%
                    </span>

                    {!isUploading ? (
                      <button
                        type="button"
                        className="rounded-full px-2 text-lg leading-none text-fg-soft transition hover:bg-bg-muted hover:text-fg"
                        aria-label={`Usuń ${item.filename}`}
                        onClick={() => removeItem(item.localId)}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
