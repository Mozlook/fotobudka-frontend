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

        <p className="mt-1 truncate text-sm text-fg-muted">
          {photographerName}
        </p>

        <p className="mt-4 text-sm font-semibold text-main-active">
          Otwórz galerię →
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
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-fg-soft">
            Publiczne galerie
          </p>

          <h2
            id="featured-galleries-title"
            className="mt-2 text-3xl font-bold tracking-tight text-fg"
          >
            Wyróżnione galerie fotografów
          </h2>

          <p className="mt-3 text-sm leading-6 text-fg-muted">
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
        <p className="text-sm font-semibold text-fg-soft">Jak to działa</p>

        <h2
          id="how-it-works-title"
          className="mt-2 text-3xl font-bold tracking-tight text-fg"
        >
          Prosty proces od wyboru zdjęć do gotowego ZIP-a
        </h2>

        <p className="mt-3 text-sm leading-6 text-fg-muted">
          FotoBudka porządkuje komunikację między fotografem i klientem:
          selekcja, notatki, płatność manualna i dostawa finalnych zdjęć są w
          jednym miejscu.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {howItWorksSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-card border border-border bg-surface p-6 shadow-card-sm"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-main-soft text-sm font-bold text-main-active">
              {index + 1}
            </div>

            <h3 className="mt-5 text-lg font-semibold text-fg">{step.title}</h3>

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
      <div className="rounded-card border border-border bg-secondary p-8 text-secondary-foreground shadow-card">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-white/65">
              Dla fotografów
            </p>

            <h2
              id="photographer-title"
              className="mt-2 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl"
            >
              Zarządzaj sesjami, wyborem klienta i portfolio z jednego panelu.
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
              Panel fotografa pozwala tworzyć sesje, wysyłać proofy, zbierać
              wybory, oznaczać płatność, wgrywać finale i publikować galerie
              portfolio.
            </p>

            <ul className="mt-6 grid gap-3 text-sm text-white/75 md:grid-cols-3">
              {photographerFeatures.map((feature) => (
                <li
                  key={feature}
                  className="rounded-card bg-white/10 px-4 py-3"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/login"
            className="inline-flex h-12 items-center justify-center rounded-button bg-main px-5 text-sm font-semibold text-main-foreground transition hover:bg-main-hover"
          >
            Przejdź do panelu
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

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_440px] lg:py-16">
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <div className="inline-flex w-fit rounded-full bg-main-soft px-3 py-1 text-sm font-semibold text-fg">
            Dla klientów i fotografów
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-fg md:text-6xl">
            Wybierz zdjęcia z sesji i odbierz gotową paczkę ZIP.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-fg-muted">
            FotoBudka pomaga fotografom udostępniać proofy klientom, zbierać
            wybory i notatki, a później dostarczać finalne zdjęcia w jednej
            paczce ZIP.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#client-access"
              className="rounded-button bg-main px-5 py-3 text-sm font-semibold text-main-foreground transition hover:bg-main-hover"
            >
              Mam kod sesji
            </a>

            <a
              href="#featured-galleries"
              className="rounded-button border border-border bg-surface px-5 py-3 text-sm font-semibold text-fg transition hover:bg-bg-muted"
            >
              Zobacz galerie
            </a>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-6 text-fg-muted">
            Masz link od fotografa? Otwórz go bezpośrednio z wiadomości — nie
            musisz wtedy wpisywać kodu ręcznie.
          </p>
        </div>

        <div id="client-access" className="order-1 lg:order-2">
          <ClientAccessCard />
        </div>
      </section>

      <FeaturedGalleriesSection />

      <HowItWorksSection />

      <PhotographerSection />
    </main>
  );
}
