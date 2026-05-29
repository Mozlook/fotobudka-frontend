import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Button, EmptyState, Spinner } from "../components/ui";
import { useMeProfileQuery } from "../features/auth/hooks";
import { GalleryFormModal } from "../features/portfolio/components/GalleryFormModal";
import { GalleryPhotoUploader } from "../features/portfolio/components/GalleryPhotoUploader";
import {
  useDeleteGalleryPhotoMutation,
  useGalleryQuery,
  useUpdateGalleryMutation,
} from "../features/portfolio/hooks";
import type {
  GalleryPhoto,
  UpsertGalleryInput,
} from "../features/portfolio/types";
import { formatDate } from "../features/sessions/utils";
import { cn } from "../lib/utils/cn";

function MetricCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "main" | "success" | "warning";
}) {
  const toneClassName = {
    default: "bg-surface",
    main: "bg-main-subtle",
    success: "bg-success-soft",
    warning: "bg-warning-soft",
  }[tone];

  return (
    <article
      className={cn(
        "rounded-card border border-border p-5 shadow-card-sm",
        toneClassName,
      )}
    >
      <p className="text-sm font-medium text-fg-muted">{label}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-fg">{value}</p>

      <p className="mt-2 text-xs leading-5 text-fg-muted">{description}</p>
    </article>
  );
}

function GalleryPhotoCard({
  photo,
  isDeleting,
  onDelete,
}: {
  photo: GalleryPhoto;
  isDeleting: boolean;
  onDelete: (photoId: string) => void;
}) {
  const hasImage = Boolean(photo.image_url);

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <a
        href={photo.image_url || undefined}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "group block aspect-[4/3] bg-bg",
          !hasImage && "pointer-events-none",
        )}
        aria-label={hasImage ? "Otwórz zdjęcie w nowej karcie" : undefined}
      >
        {hasImage ? (
          <img
            src={photo.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-warning-soft px-4 text-center text-sm font-semibold text-warning">
            Zdjęcie czeka na dokończenie uploadu
          </div>
        )}
      </a>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              hasImage
                ? "bg-success-soft text-success"
                : "bg-warning-soft text-warning",
            )}
          >
            {hasImage ? "Gotowe" : "Pending"}
          </span>

          {photo.width > 0 && photo.height > 0 ? (
            <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs font-semibold text-fg-muted">
              {photo.width} × {photo.height}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-fg-soft">
          Dodano: {formatDate(photo.created_at)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasImage ? (
            <a
              href={photo.image_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center rounded-button border border-border bg-surface px-3 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
            >
              Podgląd
            </a>
          ) : null}

          <Button
            size="sm"
            variant="danger"
            isLoading={isDeleting}
            onClick={() => onDelete(photo.id)}
            className={cn(hasImage ? "flex-1" : "w-full")}
          >
            Usuń
          </Button>
        </div>
      </div>
    </article>
  );
}

export function GalleryDetailPage() {
  const { galleryId } = useParams<{ galleryId: string }>();

  const galleryQuery = useGalleryQuery(galleryId);
  const meQuery = useMeProfileQuery();

  const updateMutation = useUpdateGalleryMutation(galleryId ?? "");
  const deletePhotoMutation = useDeleteGalleryPhotoMutation(galleryId ?? "");

  const [editOpen, setEditOpen] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const username = meQuery.data?.profile?.username;

  const publicUrl =
    username && galleryQuery.data?.gallery.is_public
      ? `/${username}/${galleryQuery.data.gallery.slug}`
      : null;

  const stats = useMemo(() => {
    const photos = galleryQuery.data?.photos ?? [];

    return {
      total: photos.length,
      ready: photos.filter((photo) => Boolean(photo.image_url)).length,
      pending: photos.filter((photo) => !photo.image_url).length,
    };
  }, [galleryQuery.data?.photos]);

  function handleUpdate(input: UpsertGalleryInput) {
    updateMutation.mutate(input, {
      onSuccess: () => setEditOpen(false),
    });
  }

  function handleDeletePhoto(photoId: string) {
    const confirmed = window.confirm("Usunąć to zdjęcie z galerii?");

    if (!confirmed) {
      return;
    }

    setDeletingPhotoId(photoId);

    deletePhotoMutation.mutate(photoId, {
      onSettled: () => setDeletingPhotoId(null),
    });
  }

  if (!galleryId) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
        <p className="font-semibold">Brak ID galerii</p>
        <p className="mt-1 text-sm opacity-80">
          Adres strony nie zawiera identyfikatora galerii.
        </p>
      </div>
    );
  }

  if (galleryQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm text-fg-muted">Ładuję galerię...</p>
        </div>
      </div>
    );
  }

  if (galleryQuery.isError || !galleryQuery.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
        <p className="font-semibold">Nie udało się pobrać galerii</p>

        <p className="mt-1 text-sm leading-6 opacity-80">
          Galeria nie istnieje albo nie masz do niej dostępu.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => galleryQuery.refetch()}>
            Spróbuj ponownie
          </Button>

          <Link
            to="/app/portfolio"
            className="inline-flex h-10 items-center justify-center rounded-button bg-surface px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
          >
            Wróć do portfolio
          </Link>
        </div>
      </div>
    );
  }

  const { gallery, photos } = galleryQuery.data;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link
          to="/app/portfolio"
          className="inline-flex items-center text-sm font-semibold text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
        >
          ← Wróć do portfolio
        </Link>
      </div>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  gallery.is_public
                    ? "bg-success-soft text-success"
                    : "bg-warning-soft text-warning",
                )}
              >
                {gallery.is_public ? "Publiczna" : "Ukryta"}
              </span>

              <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs font-semibold text-fg-muted">
                {gallery.photo_count} zdjęć
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              {gallery.title}
            </h1>

            <p className="mt-2 text-sm text-fg-muted">
              Slug:{" "}
              <span className="font-mono text-xs font-semibold text-fg">
                /{gallery.slug}
              </span>
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              Zarządzaj zdjęciami publicznej galerii portfolio. Zdjęcia w tej
              sekcji są publikowane bez watermarków.
            </p>

            {publicUrl ? (
              <Link
                to={publicUrl}
                target="_blank"
                className="mt-4 inline-flex text-sm font-semibold text-main-active transition hover:text-main-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                Otwórz publiczną galerię: {publicUrl}
              </Link>
            ) : (
              <p className="mt-4 text-sm font-medium text-warning">
                Galeria jest ukryta albo profil publiczny nie ma jeszcze
                username.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button
              variant="outline"
              isLoading={galleryQuery.isFetching}
              onClick={() => galleryQuery.refetch()}
            >
              Odśwież
            </Button>

            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edytuj galerię
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-label="Podsumowanie galerii"
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        <MetricCard
          label="Wszystkie zdjęcia"
          value={stats.total}
          description="Łączna liczba zdjęć przypisanych do galerii."
          tone="main"
        />

        <MetricCard
          label="Gotowe"
          value={stats.ready}
          description="Zdjęcia dostępne w publicznej galerii."
          tone="success"
        />

        <MetricCard
          label="Pending"
          value={stats.pending}
          description="Zdjęcia bez gotowego signed URL w odpowiedzi."
          tone="warning"
        />
      </section>

      <div className="mt-8">
        <GalleryPhotoUploader galleryId={gallery.id} />
      </div>

      <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold text-fg-soft">Zdjęcia</p>

            <h2 className="mt-1 text-2xl font-semibold text-fg">
              Zawartość galerii
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
              To zdjęcia, które pojawią się w publicznej galerii. Usunięcie
              zdjęcia usuwa je z portfolio, ale nie wpływa na sesje klientów.
            </p>
          </div>

          <Button
            variant="outline"
            isLoading={galleryQuery.isFetching}
            onClick={() => galleryQuery.refetch()}
          >
            Odśwież zdjęcia
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Brak zdjęć w galerii"
              description="Wgraj pierwsze zdjęcia portfolio przez uploader powyżej."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <GalleryPhotoCard
                key={photo.id}
                photo={photo}
                isDeleting={
                  deletePhotoMutation.isPending && deletingPhotoId === photo.id
                }
                onDelete={handleDeletePhoto}
              />
            ))}
          </div>
        )}
      </section>

      <GalleryFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edytuj galerię"
        submitLabel="Zapisz"
        gallery={gallery}
        isPending={updateMutation.isPending}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
