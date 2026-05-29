import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button, Input } from "../components/ui";
import { ClientAccessCard } from "../features/client-access/components/ClientAccessCard";

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

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^\/+/, "")
    .split("/")[0];
}

function isValidUsername(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(value);
}

function PortfolioLookupCard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
      toast.error("Wpisz username fotografa.");
      return;
    }

    if (!isValidUsername(normalizedUsername)) {
      toast.error("Username może zawierać małe litery, cyfry i myślniki.");
      return;
    }

    navigate(`/${normalizedUsername}`);
  }

  return (
    <section
      id="portfolio-lookup"
      aria-labelledby="portfolio-lookup-title"
      className="rounded-card border border-border bg-surface p-6 shadow-card"
    >
      <div>
        <p className="text-sm font-semibold text-fg-soft">
          Portfolio fotografa
        </p>

        <h2
          id="portfolio-lookup-title"
          className="mt-2 text-3xl font-bold tracking-tight text-fg"
        >
          Otwórz publiczne galerie
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
          Wpisz username fotografa, żeby przejść do jego publicznego profilu i
          galerii portfolio.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]"
      >
        <Input
          label="Username fotografa"
          placeholder="np. ziutson"
          value={username}
          autoComplete="off"
          inputMode="text"
          onChange={(event) => setUsername(event.target.value)}
          hint="Username znajdziesz w linku od fotografa, np. /ziutson."
        />

        <div className="flex items-end">
          <Button
            type="submit"
            variant="secondary"
            className="w-full md:w-auto"
          >
            Otwórz portfolio
          </Button>
        </div>
      </form>

      <div className="mt-5 rounded-card border border-main/20 bg-main-subtle p-4">
        <p className="text-sm font-semibold text-fg">Masz pełny link?</p>

        <p className="mt-1 text-sm leading-6 text-fg-muted">
          Linki w formacie <span className="font-medium">/username</span> albo{" "}
          <span className="font-medium">/username/galeria</span> możesz otworzyć
          bezpośrednio w przeglądarce.
        </p>
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
              <p className="mt-1 text-xs text-fg-muted">
                Selekcja zdjęć i portfolio
              </p>
            </div>
          </Link>

          <nav
            aria-label="Główna nawigacja"
            className="flex flex-wrap items-center gap-2"
          >
            <a
              href="#client-access"
              className="rounded-button bg-main-soft px-3 py-2 text-sm font-semibold text-fg transition hover:bg-main-subtle"
            >
              Mam kod
            </a>

            <a
              href="#portfolio-lookup"
              className="rounded-button border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
            >
              Portfolio
            </a>

            <Link
              to="/login"
              className="rounded-button bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover"
            >
              Panel fotografa
            </Link>
          </nav>
        </div>
      </header>

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
              href="#portfolio-lookup"
              className="rounded-button border border-border bg-surface px-5 py-3 text-sm font-semibold text-fg transition hover:bg-bg-muted"
            >
              Otwórz portfolio
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

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <PortfolioLookupCard />
      </section>

      <HowItWorksSection />

      <PhotographerSection />
    </main>
  );
}
