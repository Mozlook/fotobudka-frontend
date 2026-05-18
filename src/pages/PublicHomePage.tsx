import { Link } from "react-router";
import { toast } from "sonner";
import { Button, EmptyState, Input } from "../components/ui";
import { ClientAccessCard } from "../features/client-access/components/ClientAccessCard";

const featuredProfiles = [
  {
    name: "Anna Nowak Fotografia",
    username: "anna-nowak",
    description: "Sesje rodzinne, portrety i naturalne reportaże.",
  },
  {
    name: "Studio Lightbox",
    username: "studio-lightbox",
    description: "Portrety biznesowe, branding i fotografia produktowa.",
  },
  {
    name: "Michał Kowalski",
    username: "michal-kowalski",
    description: "Śluby, narzeczeńskie i reportaż okolicznościowy.",
  },
];

export function PublicHomePage() {
  function handleClientCodeSubmit() {
    toast.info("Wejście kodem podłączymy w FE-4.");
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-main text-main-foreground">
              <span className="text-sm font-bold">FB</span>
            </div>

            <div>
              <p className="text-sm font-bold leading-none text-fg">
                FotoBudka
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Galerie i selekcje zdjęć
              </p>
            </div>
          </Link>

          <Link
            to="/login"
            className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
          >
            Panel fotografa
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit rounded-full bg-main-soft px-3 py-1 text-sm font-semibold text-fg">
            Dla klientów i fotografów
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-fg md:text-6xl">
            Odbieraj, wybieraj i pobieraj zdjęcia z sesji w jednym miejscu.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-fg-muted">
            FotoBudka pomaga fotografom udostępniać klientom proofy ze znakiem
            wodnym, zbierać wybory i dostarczać gotowe zdjęcia w paczce ZIP.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#client-access"
              className="rounded-button bg-main px-5 py-3 text-sm font-semibold text-main-foreground transition hover:bg-main-hover"
            >
              Mam kod sesji
            </a>

            <Link
              to="/login"
              className="rounded-button bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
            >
              Jestem fotografem
            </Link>
          </div>
        </div>

        <div id="client-access">
          <ClientAccessCard />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-fg-soft">
                Publiczne profile
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg">
                Fotografowie
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
                Docelowo pokażemy tutaj publiczne profile i galerie portfolio.
                Backendowe portfolio jest późniejszym zakresem, więc na razie
                zostawiamy placeholdery.
              </p>
            </div>

            <Button variant="outline" disabled>
              Zobacz wszystkie
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {featuredProfiles.map((profile) => (
              <article
                key={profile.username}
                className="rounded-card border border-border bg-bg p-5"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-main-soft text-sm font-bold text-main-active">
                  {profile.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-fg">
                  {profile.name}
                </h3>

                <p className="mt-1 text-sm font-medium text-fg-soft">
                  /{profile.username}
                </p>

                <p className="mt-3 text-sm leading-6 text-fg-muted">
                  {profile.description}
                </p>

                <Button className="mt-5 w-full" variant="soft" disabled>
                  Profil wkrótce
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <EmptyState
          title="Publiczne galerie będą później"
          description="Najpierw domykamy P0: sesje, upload, wybór klienta, płatność manualną, finale i pobieranie ZIP. Portfolio jest zakresem P1."
          action={
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-button bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
            >
              Przejdź do panelu fotografa
            </Link>
          }
        />
      </section>
    </main>
  );
}
