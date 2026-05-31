import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Button, EmptyState, Input, Spinner } from "../components/ui";
import { usePublicPhotographerQuery } from "../features/portfolio/hooks";
import type { Gallery } from "../features/portfolio/types";
import { cn } from "../lib/utils/cn";
import { PublicHeader } from "../components/layout/PublicHeader";

const socialMeta: Record<
  string,
  {
    label: string;
    shortLabel: string;
    className: string;
  }
> = {
  instagram: {
    label: "Instagram",
    shortLabel: "IG",
    className: "bg-[#E4405F]/10 text-[#B8325B] border-[#E4405F]/20",
  },
  tiktok: {
    label: "TikTok",
    shortLabel: "TT",
    className: "bg-[#111111]/10 text-[#111111] border-[#111111]/20",
  },
  website: {
    label: "Strona",
    shortLabel: "WWW",
    className: "bg-main-soft text-main-active border-main/20",
  },
  facebook: {
    label: "Facebook",
    shortLabel: "FB",
    className: "bg-[#1877F2]/10 text-[#1864C9] border-[#1877F2]/20",
  },
  behance: {
    label: "Behance",
    shortLabel: "BE",
    className: "bg-[#1769FF]/10 text-[#1557CC] border-[#1769FF]/20",
  },
};

function SocialLinks({ links }: { links: Record<string, string> }) {
  const items = Object.entries(links).filter(([, value]) => Boolean(value));

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Linki społecznościowe fotografa" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {items.map(([key, value]) => {
          const meta = socialMeta[key] ?? {
            label: key,
            shortLabel: key.slice(0, 2).toUpperCase(),
            className: "bg-bg-muted text-fg border-border",
          };

          return (
            <li key={key}>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-11 items-center gap-2 rounded-button border border-border bg-surface px-3 text-sm font-semibold text-fg transition hover:-translate-y-0.5 hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex size-7 items-center justify-center rounded-full border text-[10px] font-bold ${meta.className}`}
                >
                  {meta.shortLabel}
                </span>

                <span>{meta.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GalleryCard({
  gallery,
  username,
}: {
  gallery: Gallery;
  username: string;
}) {
  return (
    <Link
      to={`/${username}/${gallery.slug}`}
      className="group overflow-hidden rounded-card border border-border bg-surface shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
    >
      <div className="aspect-4/3 bg-bg">
        {gallery.cover_url ? (
          <img
            src={gallery.cover_url}
            alt={gallery.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-main-subtle px-4 text-center text-sm font-semibold text-main-active">
            Brak okładki
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            Publiczna
          </span>

          <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs font-semibold text-fg-muted">
            {gallery.photo_count} zdjęć
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-xl font-semibold text-fg">
          {gallery.title}
        </h3>

        <p className="mt-1 truncate text-sm text-fg-muted">/{gallery.slug}</p>

        <p className="mt-4 text-sm font-semibold text-main-active">
          Otwórz galerię →
        </p>
      </div>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  tone?: "default" | "main" | "success";
}) {
  const toneClassName = {
    default: "bg-surface",
    main: "bg-main-subtle",
    success: "bg-success-soft",
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

export function PublicPhotographerPage() {
  const { username } = useParams<{ username: string }>();
  const profileQuery = usePublicPhotographerQuery(username);

  const [search, setSearch] = useState("");

  const galleries = profileQuery.data?.galleries ?? [];

  const stats = useMemo(() => {
    return {
      galleries: galleries.length,
      photos: galleries.reduce((sum, gallery) => sum + gallery.photo_count, 0),
    };
  }, [galleries]);

  const filteredGalleries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return galleries;
    }

    return galleries.filter(
      (gallery) =>
        gallery.title.toLowerCase().includes(normalizedSearch) ||
        gallery.slug.toLowerCase().includes(normalizedSearch),
    );
  }, [galleries, search]);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <a
        href="#public-profile-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
      >
        Przejdź do portfolio
      </a>

      <PublicHeader
        subtitle="Publiczne portfolio"
        actions={[
          {
            label: "Mam kod sesji",
            to: "/client",
            variant: "outline",
          },
          {
            label: "Strona główna",
            to: "/",
            variant: "primary",
          },
        ]}
      />

      <section
        id="public-profile-content"
        className="mx-auto max-w-7xl px-6 py-10"
      >
        {profileQuery.isLoading ? (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <div className="flex items-center gap-3">
              <Spinner />
              <p className="text-sm text-fg-muted">Ładuję portfolio...</p>
            </div>
          </div>
        ) : null}

        {profileQuery.isError ? (
          <div className="mx-auto max-w-3xl">
            <EmptyState
              title="Nie znaleziono fotografa"
              description="Profil publiczny nie istnieje, username jest błędny albo fotograf nie uzupełnił jeszcze profilu."
              action={
                <Link
                  to="/"
                  className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
                >
                  Wróć na stronę główną
                </Link>
              }
            />
          </div>
        ) : null}

        {profileQuery.data ? (
          <>
            <section className="rounded-card border border-border bg-surface p-8 shadow-card">
              <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
                <div>
                  <p className="text-sm font-semibold text-fg-soft">
                    Portfolio fotografa
                  </p>

                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg md:text-5xl">
                    {profileQuery.data.profile.display_name ||
                      profileQuery.data.profile.username}
                  </h1>

                  <p className="mt-3 font-mono text-sm font-semibold text-main-active">
                    /{profileQuery.data.profile.username}
                  </p>

                  {profileQuery.data.profile.bio ? (
                    <p className="mt-5 max-w-3xl text-base leading-8 text-fg-muted">
                      {profileQuery.data.profile.bio}
                    </p>
                  ) : (
                    <p className="mt-5 max-w-3xl text-base leading-8 text-fg-muted">
                      Fotograf nie dodał jeszcze opisu profilu.
                    </p>
                  )}

                  <SocialLinks links={profileQuery.data.profile.social_links} />
                </div>

                <aside className="rounded-card border border-border bg-bg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
                    Profil publiczny
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <p className="text-sm text-fg-muted">Galerie</p>
                      <p className="mt-1 text-3xl font-bold text-fg">
                        {stats.galleries}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-fg-muted">Zdjęcia</p>
                      <p className="mt-1 text-3xl font-bold text-fg">
                        {stats.photos}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-card border border-main/20 bg-main-subtle p-4">
                    <p className="text-sm font-semibold text-fg">
                      Chcesz wejść do sesji?
                    </p>

                    <p className="mt-1 text-sm leading-6 text-fg-muted">
                      Jeśli masz kod od fotografa, przejdź do formularza wejścia
                      klienta.
                    </p>

                    <Link
                      to="/client"
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
                    >
                      Mam kod sesji
                    </Link>
                  </div>
                </aside>
              </div>
            </section>

            <section
              aria-label="Statystyki portfolio"
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <MetricCard
                label="Publiczne galerie"
                value={stats.galleries}
                description="Galerie opublikowane przez fotografa."
                tone="main"
              />

              <MetricCard
                label="Zdjęcia portfolio"
                value={stats.photos}
                description="Zdjęcia dostępne w publicznych galeriach."
                tone="success"
              />
            </section>

            <section className="mt-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-sm font-semibold text-fg-soft">Galerie</p>

                  <h2 className="mt-1 text-3xl font-bold tracking-tight text-fg">
                    Publiczne galerie
                  </h2>
                </div>

                {galleries.length > 0 ? (
                  <div className="w-full lg:w-80">
                    <Input
                      label="Szukaj galerii"
                      placeholder="Tytuł albo slug"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              {galleries.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="Brak publicznych galerii"
                    description="Fotograf nie opublikował jeszcze żadnej galerii portfolio."
                  />
                </div>
              ) : null}

              {galleries.length > 0 && filteredGalleries.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="Brak galerii dla tej frazy"
                    description="Zmień wyszukiwanie albo wyczyść filtr."
                    action={
                      <Button variant="outline" onClick={() => setSearch("")}>
                        Wyczyść wyszukiwanie
                      </Button>
                    }
                  />
                </div>
              ) : null}

              {filteredGalleries.length > 0 ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredGalleries.map((gallery) => (
                    <GalleryCard
                      key={gallery.id}
                      gallery={gallery}
                      username={profileQuery.data.profile.username}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
