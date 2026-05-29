import { Link, useParams } from "react-router";
import { EmptyState, Spinner } from "../components/ui";
import { usePublicGalleryQuery } from "../features/portfolio/hooks";

export function PublicGalleryPage() {
  const { username, gallerySlug } = useParams<{
    username: string;
    gallerySlug: string;
  }>();

  const galleryQuery = usePublicGalleryQuery(username, gallerySlug);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="font-bold text-fg">
            FotoBudka
          </Link>

          {username ? (
            <Link
              to={`/${username}`}
              className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
            >
              Profil fotografa
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {galleryQuery.isLoading ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="text-sm text-fg-muted">Ładuję galerię...</p>
            </div>
          </div>
        ) : null}

        {galleryQuery.isError ? (
          <EmptyState
            title="Nie znaleziono galerii"
            description="Galeria nie istnieje albo nie jest publiczna."
          />
        ) : null}

        {galleryQuery.data ? (
          <>
            <section className="rounded-card border border-border bg-surface p-8 shadow-card">
              <p className="text-sm font-semibold text-fg-soft">
                {galleryQuery.data.profile.display_name ||
                  galleryQuery.data.profile.username}
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg md:text-5xl">
                {galleryQuery.data.gallery.title}
              </h1>

              <p className="mt-4 text-sm text-fg-muted">
                /{galleryQuery.data.profile.username}/
                {galleryQuery.data.gallery.slug}
              </p>
            </section>

            {galleryQuery.data.photos.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  title="Brak zdjęć"
                  description="Ta galeria nie ma jeszcze publicznych zdjęć."
                />
              </div>
            ) : (
              <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryQuery.data.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-card border border-border bg-surface shadow-card-sm"
                  >
                    <div className="aspect-[4/3] bg-bg">
                      {photo.image_url ? (
                        <img
                          src={photo.image_url}
                          alt=""
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-fg-soft">
                          Zdjęcie niedostępne
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </section>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
