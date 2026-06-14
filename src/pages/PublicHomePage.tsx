import { Link } from "react-router";
import { Button, EmptyState, Spinner } from "../components/ui";
import { ClientAccessCard } from "../features/client-access/components/ClientAccessCard";
import { PublicHeader } from "../components/layout/PublicHeader";
import { useFeaturedPublicGalleriesQuery } from "../features/portfolio/hooks";
import type { FeaturedPublicGallery } from "../features/portfolio/types";

const howItWorksSteps = [
  {
    title: "Wejdź kodem albo linkiem",
    description:
      "Kod lub link znajdziesz w wiadomości od fotografa. Klient nie musi zakładać konta.",
  },
  {
    title: "Wybierz zdjęcia",
    description:
      "Przeglądasz proofy, zaznaczasz zdjęcia do obróbki i dopisujesz notatki.",
  },
  {
    title: "Pobierz gotową paczkę",
    description:
      "Po obróbce fotograf udostępnia jedną paczkę ZIP z finalnymi zdjęciami.",
  },
];

const photographerFeatures = [
  "Sesje zdjęciowe i dostęp klienta kodem/linkiem",
  "Selekcja zdjęć, notatki i płatność manualna",
  "Upload finali, generowanie ZIP i publiczne portfolio",
];

function FeaturedGalleryCard({ gallery }: { gallery: FeaturedPublicGallery }) {
  const photographerName =
    gallery.photographer.display_name || gallery.photographer.username;

  return (
    <Link
      to={`/${gallery.photographer.username}/${gallery.slug}`}
      className="group overflow-hidden rounded-card border border-border bg-surface shadow-card-sm transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-bg-muted">
        {gallery.cover_url ? (
          <img
            src={gallery.cover_url}
            alt={gallery.title}
            className="h-full w-full object-cover transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-main-subtle px-4 text-center font-display text-sm font-semibold text-main-active">
            Brak okładki
          </div>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-success shadow-card-sm backdrop-blur">
          <span className="size-1.5 rounded-full bg-success" />
          Publiczna
        </span>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-xl font-semibold text-fg">
          {gallery.title}
        </h3>

        <p className="mt-1.5 truncate text-sm text-fg-muted">
          {photographerName} · {gallery.photo_count} zdjęć
        </p>

        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-main-active">
          Otwórz galerię
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </p>
      </div>
    </Link>
  );
}

function FeaturedGalleriesSection() {
  const featuredQuery = useFeaturedPublicGalleriesQuery(4);

  return (
    <section
      id="featured-galleries"
      aria-labelledby="featured-galleries-title"
      className="mx-auto max-w-7xl px-6 pb-12"
    >
      <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-main-active">
            <span aria-hidden="true" className="h-px w-7 bg-main/50" />
            Publiczne galerie
          </p>

          <h2
            id="featured-galleries-title"
            className="mt-4 text-3xl font-semibold text-fg sm:text-4xl"
          >
            Wyróżnione galerie fotografów
          </h2>

          <p className="mt-3 text-base leading-7 text-fg-muted">
            Zobacz wybrane publiczne galerie opublikowane przez fotografów w
            FotoBudce.
          </p>
        </div>

        <div className="mt-6">
          {featuredQuery.isLoading ? (
            <div className="rounded-card border border-border bg-bg p-5">
              <div className="flex items-center gap-3">
                <Spinner />
                <p className="text-sm text-fg-muted">
                  Ładuję wyróżnione galerie...
                </p>
              </div>
            </div>
          ) : null}

          {featuredQuery.isError ? (
            <EmptyState
              title="Nie udało się pobrać galerii"
              description="Spróbuj odświeżyć stronę albo wróć później."
              action={
                <Button
                  variant="outline"
                  onClick={() => featuredQuery.refetch()}
                >
                  Spróbuj ponownie
                </Button>
              }
            />
          ) : null}

          {featuredQuery.isSuccess && featuredQuery.data.length === 0 ? (
            <EmptyState
              title="Brak publicznych galerii"
              description="Gdy fotografowie opublikują portfolio, wybrane galerie pojawią się tutaj."
            />
          ) : null}

          {featuredQuery.data && featuredQuery.data.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featuredQuery.data.map((gallery) => (
                <FeaturedGalleryCard key={gallery.id} gallery={gallery} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="mx-auto max-w-7xl px-6 py-12"
    >
      <div className="max-w-3xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-main-active">
          <span aria-hidden="true" className="h-px w-7 bg-main/50" />
          Jak to działa
        </p>

        <h2
          id="how-it-works-title"
          className="mt-4 text-3xl font-semibold text-fg sm:text-4xl"
        >
          Prosty proces od wyboru zdjęć do gotowego ZIP-a
        </h2>

        <p className="mt-3 text-base leading-7 text-fg-muted">
          FotoBudka porządkuje komunikację między fotografem i klientem:
          selekcja, notatki, płatność manualna i dostawa finalnych zdjęć są w
          jednym miejscu.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {howItWorksSteps.map((step, index) => (
          <article
            key={step.title}
            className="group relative overflow-hidden rounded-card border border-border bg-surface p-6 shadow-card-sm transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-card"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-3 font-display text-6xl font-semibold text-main/10 transition-colors duration-300 group-hover:text-main/20"
            >
              {index + 1}
            </span>

            <div className="flex size-11 items-center justify-center rounded-xl bg-main-soft font-display text-base font-semibold text-main-active">
              {index + 1}
            </div>

            <h3 className="mt-5 text-xl font-semibold text-fg">{step.title}</h3>

            <p className="mt-2 text-sm leading-6 text-fg-muted">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PhotographerSection() {
  return (
    <section
      aria-labelledby="photographer-title"
      className="mx-auto max-w-7xl px-6 pb-16"
    >
      <div className="relative overflow-hidden rounded-card border border-secondary-active bg-secondary p-8 text-secondary-foreground shadow-card sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-[28rem] rounded-full bg-main/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-0 size-[24rem] rounded-full bg-tertiary/15 blur-3xl"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-main">
              <span aria-hidden="true" className="h-px w-7 bg-main/60" />
              Dla fotografów
            </p>

            <h2
              id="photographer-title"
              className="mt-4 max-w-3xl text-3xl font-semibold md:text-[2.6rem] md:leading-[1.08]"
            >
              Zarządzaj sesjami, wyborem klienta i portfolio z jednego panelu.
            </h2>

            <p className="mt-5 max-w-3xl text-base leading-7 text-secondary-foreground/70">
              Panel fotografa pozwala tworzyć sesje, wysyłać proofy, zbierać
              wybory, oznaczać płatność, wgrywać finale i publikować galerie
              portfolio.
            </p>

            <ul className="mt-7 grid gap-3 text-sm text-secondary-foreground/80 md:grid-cols-3">
              {photographerFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 rounded-card border border-white/10 bg-white/[0.06] px-4 py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-main text-[10px] font-bold text-main-foreground"
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/login"
            className="group inline-flex h-12 items-center gap-2 rounded-button bg-main px-6 text-sm font-semibold text-main-foreground shadow-[0_14px_30px_-12px_var(--color-main)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-main-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main/40 focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
          >
            Przejdź do panelu
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PublicHomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg text-fg">
      <a
        href="#client-access"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
      >
        Przejdź do formularza kodu sesji
      </a>

      <PublicHeader
        subtitle="Selekcja zdjęć i portfolio"
        actions={[
          {
            label: "Mam kod",
            href: "#client-access",
            variant: "soft",
          },
          {
            label: "Panel fotografa",
            to: "/login",
            variant: "primary",
          },
        ]}
      />

      <section className="relative overflow-hidden">
        {/* atmospheric accent glow behind the hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-24 size-[34rem] rounded-full bg-main/15 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_440px] lg:items-center lg:py-20">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <div className="fb-rise inline-flex w-fit items-center gap-2.5 rounded-full border border-border bg-surface/70 py-1.5 pl-2.5 pr-4 text-sm font-semibold text-fg-muted backdrop-blur">
              <span className="size-2 rounded-full bg-main" />
              Dla klientów i fotografów
            </div>

            <h1
              className="fb-rise mt-7 max-w-3xl text-[2.75rem] font-semibold leading-[1.04] text-fg sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              Wybierz zdjęcia z sesji i odbierz{" "}
              <span className="italic text-main">gotową paczkę</span> ZIP.
            </h1>

            <p
              className="fb-rise mt-6 max-w-xl text-lg leading-8 text-fg-muted"
              style={{ animationDelay: "120ms" }}
            >
              FotoBudka pomaga fotografom udostępniać proofy klientom, zbierać
              wybory i notatki, a później dostarczać finalne zdjęcia w jednej
              paczce ZIP.
            </p>

            <div
              className="fb-rise mt-9 flex flex-wrap gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <a
                href="#client-access"
                className="inline-flex h-12 items-center rounded-button bg-main px-6 text-sm font-semibold text-main-foreground shadow-[0_12px_28px_-12px_var(--color-main)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-main-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Mam kod sesji
              </a>

              <a
                href="#featured-galleries"
                className="inline-flex h-12 items-center rounded-button border border-border-strong/70 bg-surface px-6 text-sm font-semibold text-fg transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-border-strong hover:bg-bg-muted active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Zobacz galerie
              </a>
            </div>

            <p
              className="fb-rise mt-7 flex max-w-xl items-start gap-2 text-sm leading-6 text-fg-muted"
              style={{ animationDelay: "240ms" }}
            >
              <span aria-hidden="true" className="mt-0.5 text-main-active">
                ↳
              </span>
              Masz link od fotografa? Otwórz go bezpośrednio z wiadomości — nie
              musisz wtedy wpisywać kodu ręcznie.
            </p>
          </div>

          <div
            id="client-access"
            className="fb-rise order-1 lg:order-2"
            style={{ animationDelay: "140ms" }}
          >
            <ClientAccessCard />
          </div>
        </div>
      </section>

      <FeaturedGalleriesSection />

      <HowItWorksSection />

      <PhotographerSection />
    </main>
  );
}
