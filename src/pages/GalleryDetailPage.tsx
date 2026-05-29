import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button, EmptyState, Spinner } from "../components/ui";
import { GalleryFormModal } from "../features/portfolio/components/GalleryFormModal";
import { GalleryPhotoUploader } from "../features/portfolio/components/GalleryPhotoUploader";
import {
  useDeleteGalleryPhotoMutation,
  useGalleryQuery,
  useUpdateGalleryMutation,
} from "../features/portfolio/hooks";
import type { UpsertGalleryInput } from "../features/portfolio/types";
import { useMeProfileQuery } from "../features/auth/hooks";

export function GalleryDetailPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const galleryQuery = useGalleryQuery(galleryId);
  const meQuery = useMeProfileQuery();

  const updateMutation = useUpdateGalleryMutation(galleryId ?? "");
  const deletePhotoMutation = useDeleteGalleryPhotoMutation(galleryId ?? "");

  const [editOpen, setEditOpen] = useState(false);

  const username = meQuery.data?.profile?.username;

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

    deletePhotoMutation.mutate(photoId);
  }

  if (!galleryId) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
        Brak ID galerii w adresie.
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
        <p className="mt-1 text-sm opacity-80">
          Galeria nie istnieje albo nie masz do niej dostępu.
        </p>

        <Link
          to="/app/portfolio"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-button bg-surface px-4 text-sm font-semibold text-danger"
        >
          Wróć do portfolio
        </Link>
      </div>
    );
  }

  const { gallery, photos } = galleryQuery.data;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          to="/app/portfolio"
          className="text-sm font-semibold text-fg-muted transition hover:text-fg"
        >
          ← Wróć do portfolio
        </Link>
      </div>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  gallery.is_public
                    ? "rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                    : "rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning"
                }
              >
                {gallery.is_public ? "Publiczna" : "Ukryta"}
              </span>

              <span className="text-xs text-fg-soft">
                {gallery.photo_count} zdjęć
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">
              {gallery.title}
            </h1>

            <p className="mt-2 text-sm text-fg-muted">/{gallery.slug}</p>

            {username && gallery.is_public ? (
              <Link
                to={`/${username}/${gallery.slug}`}
                target="_blank"
                className="mt-4 inline-flex text-sm font-semibold text-main-active transition hover:text-main-hover"
              >
                Otwórz publiczną galerię
              </Link>
            ) : null}
          </div>

          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edytuj galerię
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <GalleryPhotoUploader galleryId={gallery.id} />
      </div>

      <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Zdjęcia</p>
          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Zawartość galerii
          </h2>
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
              <article
                key={photo.id}
                className="overflow-hidden rounded-card border border-border bg-bg"
              >
                <div className="aspect-[4/3] bg-bg-muted">
                  {photo.image_url ? (
                    <img
                      src={photo.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-fg-soft">
                      Zdjęcie niedostępne
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      {photo.width} × {photo.height}
                    </p>
                    <p className="text-xs text-fg-soft">
                      Sort: {photo.sort_order}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={deletePhotoMutation.isPending}
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    Usuń
                  </Button>
                </div>
              </article>
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
