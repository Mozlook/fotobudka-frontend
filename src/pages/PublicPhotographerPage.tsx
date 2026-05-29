import { Link, useParams } from "react-router";
import { EmptyState, Spinner } from "../components/ui";
import { usePublicPhotographerQuery } from "../features/portfolio/hooks";

function SocialLinks({ links }: { links: Record<string, string> }) {
  const items = Object.entries(links).filter(([, value]) => Boolean(value));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map(([key, value]) => (
        <a
          key={key}
          href={value}
          target="_blank"
          rel="noreferrer"
          className="rounded-button border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
        >
          {key}
        </a>
      ))}
    </div>
  );
}

export function PublicPhotographerPage() {
  const { username } = useParams<{ username: string }>();
  const profileQuery = usePublicPhotographerQuery(username);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="font-bold text-fg">
            FotoBudka
          </Link>

          <Link
            to="/client"
            className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
          >
            Mam kod sesji
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {profileQuery.isLoading ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="text-sm text-fg-muted">Ładuję portfolio...</p>
            </div>
          </div>
        ) : null}

        {profileQuery.isError ? (
          <EmptyState
            title="Nie znaleziono fotografa"
            description="Profil publiczny nie istnieje albo nie został jeszcze uzupełniony."
          />
        ) : null}

        {profileQuery.data ? (
          <>
            <section className="rounded-card border border-border bg-surface p-8 shadow-card">
              <p className="text-sm font-semibold text-fg-soft">
                Portfolio fotografa
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg md:text-5xl">
                {profileQuery.data.profile.display_name ||
                  profileQuery.data.profile.username}
              </h1>

              {profileQuery.data.profile.bio ? (
                <p className="mt-5 max-w-3xl text-base leading-8 text-fg-muted">
                  {profileQuery.data.profile.bio}
                </p>
              ) : null}

              <SocialLinks links={profileQuery.data.profile.social_links} />
            </section>

            <section className="mt-8">
              <div>
                <p className="text-sm font-semibold text-fg-soft">Galerie</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-fg">
                  Publiczne galerie
                </h2>
              </div>

              {profileQuery.data.galleries.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="Brak publicznych galerii"
                    description="Fotograf nie opublikował jeszcze żadnej galerii."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {profileQuery.data.galleries.map((gallery) => (
                    <Link
                      key={gallery.id}
                      to={`/${profileQuery.data.profile.username}/${gallery.slug}`}
                      className="group overflow-hidden rounded-card border border-border bg-surface shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <div className="aspect-[4/3] bg-bg">
                        {gallery.cover_url ? (
                          <img
                            src={gallery.cover_url}
                            alt={gallery.title}
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-main-subtle text-sm font-semibold text-main-active">
                            Brak okładki
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-fg">
                          {gallery.title}
                        </h3>

                        <p className="mt-2 text-sm text-fg-muted">
                          {gallery.photo_count} zdjęć
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
