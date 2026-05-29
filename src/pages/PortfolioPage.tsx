import { useState } from "react";
import { Link } from "react-router";
import { Button, EmptyState, Spinner } from "../components/ui";
import { GalleryFormModal } from "../features/portfolio/components/GalleryFormModal";
import {
  useCreateGalleryMutation,
  useDeleteGalleryMutation,
  useGalleriesQuery,
  useUpdateGalleryMutation,
} from "../features/portfolio/hooks";
import type { Gallery, UpsertGalleryInput } from "../features/portfolio/types";
import { useMeProfileQuery } from "../features/auth/hooks";
import { formatDate } from "../features/sessions/utils";

function GalleryCard({
  gallery,
  username,
  onEdit,
  onDelete,
}: {
  gallery: Gallery;
  username?: string;
  onEdit: (gallery: Gallery) => void;
  onDelete: (gallery: Gallery) => void;
}) {
  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card-sm">
      <Link
        to={`/app/portfolio/${gallery.id}`}
        className="block aspect-4/3 bg-bg"
      >
        {gallery.cover_url ? (
          <img
            src={gallery.cover_url}
            alt={gallery.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-main-subtle text-sm font-semibold text-main-active">
            Brak zdjęć
          </div>
        )}
      </Link>

      <div className="p-5">
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

        <h2 className="mt-3 text-xl font-semibold text-fg">{gallery.title}</h2>

        <p className="mt-1 text-sm text-fg-muted">/{gallery.slug}</p>

        <p className="mt-2 text-xs text-fg-soft">
          Utworzono: {formatDate(gallery.created_at)}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to={`/app/portfolio/${gallery.id}`}
            className="inline-flex h-9 items-center justify-center rounded-button bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
          >
            Otwórz
          </Link>

          <Button size="sm" variant="outline" onClick={() => onEdit(gallery)}>
            Edytuj
          </Button>

          {username && gallery.is_public ? (
            <Link
              to={`/${username}/${gallery.slug}`}
              target="_blank"
              className="inline-flex h-9 items-center justify-center rounded-button border border-border bg-surface px-3 text-sm font-semibold text-fg transition hover:bg-bg-muted"
            >
              Publiczny link
            </Link>
          ) : null}

          <Button size="sm" variant="danger" onClick={() => onDelete(gallery)}>
            Usuń
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PortfolioPage() {
  const galleriesQuery = useGalleriesQuery();
  const meQuery = useMeProfileQuery();

  const createMutation = useCreateGalleryMutation();
  const deleteMutation = useDeleteGalleryMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);

  const updateMutation = useUpdateGalleryMutation(editingGallery?.id ?? "");

  const username = meQuery.data?.profile?.username;

  function handleCreate(input: UpsertGalleryInput) {
    createMutation.mutate(input, {
      onSuccess: () => setCreateOpen(false),
    });
  }

  function handleUpdate(input: UpsertGalleryInput) {
    if (!editingGallery) {
      return;
    }

    updateMutation.mutate(input, {
      onSuccess: () => setEditingGallery(null),
    });
  }

  function handleDelete(gallery: Gallery) {
    const confirmed = window.confirm(
      `Usunąć galerię "${gallery.title}"? Tej akcji nie da się cofnąć.`,
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(gallery.id);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Portfolio</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
            Galerie portfolio
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
            Twórz publiczne galerie fotografa, wrzucaj zdjęcia bez watermarków i
            publikuj je na publicznym profilu.
          </p>

          {username ? (
            <Link
              to={`/${username}`}
              target="_blank"
              className="mt-3 inline-flex text-sm font-semibold text-main-active transition hover:text-main-hover"
            >
              Zobacz publiczny profil: /{username}
            </Link>
          ) : null}
        </div>

        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          Utwórz galerię
        </Button>
      </div>

      <div className="mt-8">
        {galleriesQuery.isLoading ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="text-sm text-fg-muted">Ładuję galerie...</p>
            </div>
          </div>
        ) : null}

        {galleriesQuery.isError ? (
          <div className="rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
            <p className="font-semibold">Nie udało się pobrać galerii</p>
            <p className="mt-1 text-sm opacity-80">
              Sprawdź backend albo spróbuj ponownie.
            </p>

            <Button
              className="mt-4"
              variant="outline"
              onClick={() => galleriesQuery.refetch()}
            >
              Spróbuj ponownie
            </Button>
          </div>
        ) : null}

        {galleriesQuery.isSuccess && galleriesQuery.data.length === 0 ? (
          <EmptyState
            title="Nie masz jeszcze galerii"
            description="Utwórz pierwszą galerię portfolio i dodaj zdjęcia bez watermarków."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                Utwórz pierwszą galerię
              </Button>
            }
          />
        ) : null}

        {galleriesQuery.data && galleriesQuery.data.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {galleriesQuery.data.map((gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                username={username}
                onEdit={setEditingGallery}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : null}
      </div>

      <GalleryFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Utwórz galerię"
        submitLabel="Utwórz"
        isPending={createMutation.isPending}
        onSubmit={handleCreate}
      />

      <GalleryFormModal
        open={Boolean(editingGallery)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGallery(null);
          }
        }}
        title="Edytuj galerię"
        submitLabel="Zapisz"
        gallery={editingGallery}
        isPending={updateMutation.isPending}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
