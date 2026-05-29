import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Button, EmptyState, Modal, Spinner } from "../components/ui";
import { usePublicGalleryQuery } from "../features/portfolio/hooks";
import type { GalleryPhoto } from "../features/portfolio/types";
import { cn } from "../lib/utils/cn";

function GalleryPhotoCard({
  photo,
  index,
  galleryTitle,
  onOpen,
}: {
  photo: GalleryPhoto;
  index: number;
  galleryTitle: string;
  onOpen: () => void;
}) {
  const hasImage = Boolean(photo.image_url);

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <button
        type="button"
        onClick={onOpen}
        disabled={!hasImage}
        className={cn(
          "group block aspect-[4/3] w-full bg-bg text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft",
          !hasImage && "cursor-not-allowed",
        )}
        aria-label={`Otwórz zdjęcie ${index + 1} z galerii ${galleryTitle}`}
      >
        {hasImage ? (
          <img
            src={photo.image_url}
            alt={`${galleryTitle} — zdjęcie ${index + 1}`}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-warning-soft px-4 text-center text-sm font-semibold text-warning">
            Zdjęcie chwilowo niedostępne
          </div>
        )}
      </button>

      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-fg">Zdjęcie {index + 1}</p>

          {photo.width > 0 && photo.height > 0 ? (
            <p className="mt-1 text-xs text-fg-soft">
              {photo.width} × {photo.height}
            </p>
          ) : (
            <p className="mt-1 text-xs text-fg-soft">Brak wymiarów</p>
          )}
        </div>

        <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs font-semibold text-fg-muted">
          #{index + 1}
        </span>
      </div>
    </article>
  );
}

function GalleryLightbox({
  photos,
  activeIndex,
  galleryTitle,
  onClose,
  onActiveIndexChange,
}: {
  photos: GalleryPhoto[];
  activeIndex: number | null;
  galleryTitle: string;
  onClose: () => void;
  onActiveIndexChange: (index: number) => void;
}) {
  if (activeIndex === null || activeIndex < 0 || activeIndex >= photos.length) {
    return null;
  }

  const currentIndex = activeIndex;
  const photo = photos[currentIndex];

  if (!photo) {
    return null;
  }

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < photos.length - 1;

  return (
    <Modal
      open={activeIndex !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={`${galleryTitle} — zdjęcie ${currentIndex + 1}`}
      description={`${currentIndex + 1} z ${photos.length} zdjęć w galerii.`}
      size="xl"
      footer={
        <>
          <Button
            variant="outline"
            disabled={!canGoPrev}
            onClick={() => onActiveIndexChange(currentIndex - 1)}
          >
            Poprzednie
          </Button>

          <Button
            variant="outline"
            disabled={!canGoNext}
            onClick={() => onActiveIndexChange(currentIndex + 1)}
          >
            Następne
          </Button>

          {photo.image_url ? (
            <a
              href={photo.image_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-soft"
            >
              Otwórz w nowej karcie
            </a>
          ) : null}
        </>
      }
    >
      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-card bg-bg">
        {photo.image_url ? (
          <img
            src={photo.image_url}
            alt={`${galleryTitle} — zdjęcie ${currentIndex + 1}`}
            className="max-h-[75vh] w-auto max-w-full object-contain"
          />
        ) : (
          <div className="p-8 text-center">
            <p className="font-semibold text-warning">
              Zdjęcie chwilowo niedostępne
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              Link do zdjęcia mógł wygasnąć. Odśwież stronę i spróbuj ponownie.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
function GalleryStats({
  photosCount,
  photographerName,
}: {
  photosCount: number;
  photographerName: string;
}) {
  return (
    <section
      aria-label="Podsumowanie galerii"
      className="mt-6 grid gap-4 md:grid-cols-2"
    >
      <article className="rounded-card border border-border bg-main-subtle p-5 shadow-card-sm">
        <p className="text-sm font-medium text-fg-muted">Zdjęcia</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-fg">
          {photosCount}
        </p>
        <p className="mt-2 text-xs leading-5 text-fg-muted">
          Liczba zdjęć dostępnych w tej publicznej galerii.
        </p>
      </article>

      <article className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
        <p className="text-sm font-medium text-fg-muted">Fotograf</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
          {photographerName}
        </p>
        <p className="mt-2 text-xs leading-5 text-fg-muted">
          Autor publicznego portfolio.
        </p>
      </article>
    </section>
  );
}

export function PublicGalleryPage() {
  const { username, gallerySlug } = useParams<{
    username: string;
    gallerySlug: string;
  }>();

  const galleryQuery = usePublicGalleryQuery(username, gallerySlug);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const photos = galleryQuery.data?.photos ?? [];

  const readyPhotos = useMemo(() => {
    return photos.filter((photo) => Boolean(photo.image_url));
  }, [photos]);

  const photographerName =
    galleryQuery.data?.profile.display_name ||
    galleryQuery.data?.profile.username ||
    "Fotograf";

  const galleryTitle = galleryQuery.data?.gallery.title ?? "Galeria";

  return (
    <main className="min-h-screen bg-bg text-fg">
      <a
        href="#public-gallery-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
      >
        Przejdź do galerii
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-main text-main-foreground">
              <span className="text-sm font-bold">FB</span>
            </div>

            <div>
              <p className="text-sm font-bold leading-none text-fg">
                FotoBudka
              </p>
              <p className="mt-1 text-xs text-fg-muted">Publiczna galeria</p>
            </div>
          </Link>

          <nav
            aria-label="Nawigacja publicznej galerii"
            className="flex flex-wrap gap-2"
          >
            {username ? (
              <Link
                to={`/${username}`}
                className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                Profil fotografa
              </Link>
            ) : null}

            <Link
              to="/client"
              className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
            >
              Mam kod sesji
            </Link>

            <Link
              to="/"
              className="rounded-button bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-soft"
            >
              Strona główna
            </Link>
          </nav>
        </div>
      </header>

      <section
        id="public-gallery-content"
        className="mx-auto max-w-7xl px-6 py-10"
      >
        {galleryQuery.isLoading ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="text-sm text-fg-muted">Ładuję galerię...</p>
            </div>
          </div>
        ) : null}

        {galleryQuery.isError ? (
          <div className="mx-auto max-w-3xl">
            <EmptyState
              title="Nie znaleziono galerii"
              description="Galeria nie istnieje, nie jest publiczna albo adres zawiera literówkę."
              action={
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  {username ? (
                    <Link
                      to={`/${username}`}
                      className="inline-flex h-10 items-center justify-center rounded-button border border-border bg-surface px-4 text-sm font-semibold text-fg transition hover:bg-bg-muted"
                    >
                      Profil fotografa
                    </Link>
                  ) : null}

                  <Link
                    to="/"
                    className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
                  >
                    Strona główna
                  </Link>
                </div>
              }
            />
          </div>
        ) : null}

        {galleryQuery.data ? (
          <>
            <section className="rounded-card border border-border bg-surface p-8 shadow-card">
              <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
                <div>
                  <p className="text-sm font-semibold text-fg-soft">
                    {photographerName}
                  </p>

                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg md:text-5xl">
                    {galleryQuery.data.gallery.title}
                  </h1>

                  <p className="mt-3 font-mono text-sm font-semibold text-main-active">
                    /{galleryQuery.data.profile.username}/
                    {galleryQuery.data.gallery.slug}
                  </p>

                  <p className="mt-5 max-w-3xl text-base leading-8 text-fg-muted">
                    Publiczna galeria portfolio. Zdjęcia w tej sekcji są
                    publikowane bez watermarków.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/${galleryQuery.data.profile.username}`}
                      className="inline-flex h-10 items-center justify-center rounded-button border border-border bg-surface px-4 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
                    >
                      Wróć do profilu
                    </Link>

                    {readyPhotos.length > 0 ? (
                      <Button
                        variant="secondary"
                        onClick={() => setActivePhotoIndex(0)}
                      >
                        Otwórz pierwsze zdjęcie
                      </Button>
                    ) : null}
                  </div>
                </div>

                <aside className="rounded-card border border-border bg-bg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
                    Galeria
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <p className="text-sm text-fg-muted">Zdjęcia</p>
                      <p className="mt-1 text-3xl font-bold text-fg">
                        {photos.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-fg-muted">Fotograf</p>
                      <p className="mt-1 text-lg font-bold text-fg">
                        {photographerName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-card border border-main/20 bg-main-subtle p-4">
                    <p className="text-sm font-semibold text-fg">
                      Masz kod sesji?
                    </p>

                    <p className="mt-1 text-sm leading-6 text-fg-muted">
                      Przejdź do formularza wejścia klienta, jeśli fotograf
                      wysłał Ci kod albo link do wyboru zdjęć.
                    </p>

                    <Link
                      to="/client"
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
                    >
                      Wejdź kodem
                    </Link>
                  </div>
                </aside>
              </div>
            </section>

            <GalleryStats
              photosCount={photos.length}
              photographerName={photographerName}
            />

            <section className="mt-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-sm font-semibold text-fg-soft">Zdjęcia</p>

                  <h2 className="mt-1 text-3xl font-bold tracking-tight text-fg">
                    Zawartość galerii
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
                    Kliknij zdjęcie, żeby otworzyć większy podgląd.
                  </p>
                </div>

                {photos.length > 0 ? (
                  <p className="rounded-card border border-border bg-surface px-4 py-3 text-sm font-semibold text-fg-muted">
                    {photos.length} zdjęć
                  </p>
                ) : null}
              </div>

              {photos.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="Brak zdjęć w galerii"
                    description="Ta galeria nie ma jeszcze publicznych zdjęć."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo, index) => (
                    <GalleryPhotoCard
                      key={photo.id}
                      photo={photo}
                      index={index}
                      galleryTitle={galleryTitle}
                      onOpen={() => setActivePhotoIndex(index)}
                    />
                  ))}
                </div>
              )}
            </section>

            <GalleryLightbox
              photos={photos}
              activeIndex={activePhotoIndex}
              galleryTitle={galleryTitle}
              onClose={() => setActivePhotoIndex(null)}
              onActiveIndexChange={setActivePhotoIndex}
            />
          </>
        ) : null}
      </section>
    </main>
  );
}
