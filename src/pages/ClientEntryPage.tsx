import { Link } from "react-router";
import { PublicHeader } from "../components/layout/PublicHeader";
import { ClientAccessCard } from "../features/client-access/components/ClientAccessCard";

const clientSteps = [
  {
    title: "Wpisz kod od fotografa",
    description:
      "Kod znajdziesz w wiadomości od fotografa. Jeśli masz link, możesz otworzyć go bezpośrednio.",
  },
  {
    title: "Wybierz zdjęcia",
    description:
      "Po wejściu do sesji zobaczysz proofy, wybierzesz zdjęcia do obróbki i dopiszesz notatki.",
  },
  {
    title: "Pobierz gotowy ZIP",
    description:
      "Gdy fotograf przygotuje finalne zdjęcia, wrócisz tutaj po jedną paczkę ZIP.",
  },
];

function ClientStepsSection() {
  return (
    <section
      aria-labelledby="client-steps-title"
      className="rounded-card border border-border bg-surface p-6 shadow-card-sm"
    >
      <p className="text-sm font-semibold text-fg-soft">Jak to działa</p>

      <h2
        id="client-steps-title"
        className="mt-2 text-2xl font-semibold tracking-tight text-fg"
      >
        Wejście klienta krok po kroku
      </h2>

      <div className="mt-6 grid gap-4">
        {clientSteps.map((step, index) => (
          <article
            key={step.title}
            className="flex gap-4 rounded-card bg-bg p-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-main-soft text-sm font-bold text-main-active">
              {index + 1}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-fg">{step.title}</h3>

              <p className="mt-1 text-sm leading-6 text-fg-muted">
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ClientEntryPage() {
  return (
    <main id="client-entry-content" className="min-h-screen bg-bg text-fg">
      <a
        href="#client-access-card"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
      >
        Przejdź do formularza kodu
      </a>

      <PublicHeader
        subtitle="Wejście klienta"
        actions={[
          {
            label: "Strona główna",
            to: "/",
            variant: "outline",
          },
          {
            label: "Panel fotografa",
            to: "/login",
            variant: "primary",
          },
        ]}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_440px] lg:py-14">
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <div className="inline-flex w-fit rounded-full bg-main-soft px-3 py-1 text-sm font-semibold text-fg">
            Klient bez konta
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-fg md:text-5xl">
            Wpisz kod sesji i przejdź do wyboru zdjęć.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-fg-muted">
            FotoBudka pozwala klientom wejść do prywatnej sesji przez kod albo
            link od fotografa. Po wejściu zobaczysz proofy, wybierzesz zdjęcia i
            pobierzesz gotową paczkę ZIP, gdy fotograf zakończy obróbkę.
          </p>

          <div className="mt-8">
            <ClientStepsSection />
          </div>
        </div>

        <div id="client-access-card" className="order-1 lg:order-2">
          <ClientAccessCard />
        </div>
      </section>
    </main>
  );
}
