import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button, EmptyState, Input, Spinner } from "../components/ui";
import { useMeProfileQuery } from "../features/auth/hooks";
import { GalleryFormModal } from "../features/portfolio/components/GalleryFormModal";
import {
  useCreateGalleryMutation,
  useDeleteGalleryMutation,
  useGalleriesQuery,
  useUpdateGalleryMutation,
} from "../features/portfolio/hooks";
import type { Gallery, UpsertGalleryInput } from "../features/portfolio/types";
import { formatDate } from "../features/sessions/utils";
import { cn } from "../lib/utils/cn";

type VisibilityFilter = "all" | "public" | "hidden";

const visibilityFilters: Array<{
  value: VisibilityFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Wszystkie",
  },
  {
    value: "public",
    label: "Publiczne",
  },
  {
    value: "hidden",
    label: "Ukryte",
  },
];

function MetricCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: number;
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
  const publicUrl =
    username && gallery.is_public ? `/${username}/${gallery.slug}` : null;

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <Link
        to={`/app/portfolio/${gallery.id}`}
        className="group block aspect-4/3 bg-bg"
        aria-label={`Otwórz galerię ${gallery.title}`}
      >
        {gallery.cover_url ? (
          <img
            src={gallery.cover_url}
            alt={gallery.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
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

        <h2 className="mt-3 line-clamp-2 text-xl font-semibold text-fg">
          {gallery.title}
        </h2>

        <p className="mt-1 truncate text-sm text-fg-muted">/{gallery.slug}</p>

        <p className="mt-2 text-xs text-fg-soft">
          Utworzono: {formatDate(gallery.created_at)}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            to={`/app/portfolio/${gallery.id}`}
            className="inline-flex h-9 items-center justify-center rounded-button bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-soft"
          >
            Otwórz
          </Link>

          <Button size="sm" variant="outline" onClick={() => onEdit(gallery)}>
            Edytuj
          </Button>

          {publicUrl ? (
            <Link
              to={publicUrl}
              target="_blank"
              className="inline-flex h-9 items-center justify-center rounded-button border border-border bg-surface px-3 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft sm:col-span-2"
            >
              Zobacz publicznie
            </Link>
          ) : null}

          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(gallery)}
            className="sm:col-span-2"
          >
            Usuń galerię
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
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");

  const updateMutation = useUpdateGalleryMutation(editingGallery?.id ?? "");

  const username = meQuery.data?.profile?.username;
  const profileReady = Boolean(username);

  const galleries = useMemo(
    () => galleriesQuery.data ?? [],
    [galleriesQuery.data],
  );

  const stats = useMemo(() => {
    const publicCount = galleries.filter((gallery) => gallery.is_public).length;
    const hiddenCount = galleries.length - publicCount;
    const photosCount = galleries.reduce(
      (sum, gallery) => sum + gallery.photo_count,
      0,
    );

    return {
      total: galleries.length,
      publicCount,
      hiddenCount,
      photosCount,
    };
  }, [galleries]);

  const filteredGalleries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return galleries.filter((gallery) => {
      const matchesSearch =
        !normalizedSearch ||
        gallery.title.toLowerCase().includes(normalizedSearch) ||
        gallery.slug.toLowerCase().includes(normalizedSearch);

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && gallery.is_public) ||
        (visibilityFilter === "hidden" && !gallery.is_public);

      return matchesSearch && matchesVisibility;
    });
  }, [galleries, search, visibilityFilter]);

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
    <div className="mx-auto max-w-7xl">
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-fg-soft">Portfolio</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              Galerie portfolio
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              Twórz publiczne galerie fotografa, wrzucaj zdjęcia bez watermarków
              i publikuj je na publicznym profilu.
            </p>

            {username ? (
              <Link
                to={`/${username}`}
                target="_blank"
                className="mt-4 inline-flex text-sm font-semibold text-main-active transition hover:text-main-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                Zobacz publiczny profil: /{username}
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              isLoading={galleriesQuery.isFetching}
              onClick={() => galleriesQuery.refetch()}
            >
              Odśwież
            </Button>

            <Button variant="secondary" onClick={() => setCreateOpen(true)}>
              Utwórz galerię
            </Button>
          </div>
        </div>
      </section>

      {!profileReady ? (
        <section className="mt-6 rounded-card border border-warning/20 bg-warning-soft p-5 text-warning shadow-card-sm">
          <p className="font-semibold">Uzupełnij profil publiczny</p>

          <p className="mt-1 max-w-3xl text-sm leading-6 opacity-80">
            Żeby publiczne portfolio działało pod adresem /username, musisz
            uzupełnić username i nazwę wyświetlaną w profilu fotografa.
          </p>

          <Link
            to="/app/profile"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-button bg-surface px-4 text-sm font-semibold text-warning transition hover:bg-warning-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
          >
            Uzupełnij profil
          </Link>
        </section>
      ) : null}

      <section
        aria-label="Podsumowanie portfolio"
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Wszystkie galerie"
          value={stats.total}
          description="Galerie utworzone w panelu fotografa."
        />

        <MetricCard
          label="Publiczne"
          value={stats.publicCount}
          description="Widoczne na publicznym profilu."
          tone="success"
        />

        <MetricCard
          label="Ukryte"
          value={stats.hiddenCount}
          description="Niewidoczne publicznie."
          tone="warning"
        />

        <MetricCard
          label="Zdjęcia portfolio"
          value={stats.photosCount}
          description="Łączna liczba zdjęć w galeriach."
          tone="main"
        />
      </section>

      <section className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Input
            label="Szukaj galerii"
            placeholder="Tytuł albo slug galerii"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="text-sm text-fg-muted lg:text-right">
            {galleriesQuery.isFetching && !galleriesQuery.isLoading ? (
              <span>Odświeżam dane...</span>
            ) : (
              <span>
                Pokazuję
                <span className="font-semibold text-fg">
                  {filteredGalleries.length}
                </span>
                z
                <span className="font-semibold text-fg">
                  {galleries.length}
                </span>
                galerii
              </span>
            )}
          </div>
        </div>

        <div
          role="list"
          aria-label="Filtry widoczności galerii"
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
        >
          {visibilityFilters.map((filter) => {
            const active = visibilityFilter === filter.value;

            const count =
              filter.value === "all"
                ? stats.total
                : filter.value === "public"
                  ? stats.publicCount
                  : stats.hiddenCount;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setVisibilityFilter(filter.value)}
                className={cn(
                  "whitespace-nowrap rounded-button px-3 py-2 text-sm font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft",
                  active
                    ? "bg-main-soft text-fg"
                    : "border border-border bg-surface text-fg-muted hover:bg-bg-muted hover:text-fg",
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    active
                      ? "bg-surface/80 text-fg"
                      : "bg-bg-muted text-fg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6" aria-label="Lista galerii portfolio">
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

        {galleriesQuery.isSuccess && galleries.length === 0 ? (
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

        {galleriesQuery.isSuccess &&
        galleries.length > 0 &&
        filteredGalleries.length === 0 ? (
          <EmptyState
            title="Brak galerii dla tego widoku"
            description="Zmień filtr widoczności albo wyczyść wyszukiwanie."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setVisibilityFilter("all");
                }}
              >
                Wyczyść filtry
              </Button>
            }
          />
        ) : null}

        {filteredGalleries.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredGalleries.map((gallery) => (
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
      </section>

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
