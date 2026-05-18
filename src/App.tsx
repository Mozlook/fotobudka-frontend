import { toast } from "sonner";
const colorSwatches = [
  {
    name: "main",
    hex: "#EBB89B",
    usage: "Główny kolor marki, CTA, akcenty",
    className: "bg-main",
    textClassName: "text-main-foreground",
  },
  {
    name: "main-soft",
    hex: "#F8E5DA",
    usage: "Delikatne tła, focus ring, hover sekcji",
    className: "bg-main-soft",
    textClassName: "text-fg",
  },
  {
    name: "main-subtle",
    hex: "#FFF1E9",
    usage: "Najlżejsze tło brandowe",
    className: "bg-main-subtle",
    textClassName: "text-fg",
  },
  {
    name: "secondary",
    hex: "#2F3A3D",
    usage: "Mocne CTA, sidebar, nagłówki",
    className: "bg-secondary",
    textClassName: "text-secondary-foreground",
  },
  {
    name: "secondary-soft",
    hex: "#E8EEEC",
    usage: "Tła sekcji pomocniczych",
    className: "bg-secondary-soft",
    textClassName: "text-fg",
  },
  {
    name: "tertiary",
    hex: "#6F8F7A",
    usage: "Spokojny akcent, statusy neutralne",
    className: "bg-tertiary",
    textClassName: "text-tertiary-foreground",
  },
  {
    name: "tertiary-soft",
    hex: "#E9F0EA",
    usage: "Delikatne zielonkawe tło",
    className: "bg-tertiary-soft",
    textClassName: "text-fg",
  },
  {
    name: "bg",
    hex: "#FFF8F4",
    usage: "Tło całej aplikacji",
    className: "bg-bg",
    textClassName: "text-fg",
  },
  {
    name: "bg-muted",
    hex: "#F6ECE7",
    usage: "Tła bloków i hover",
    className: "bg-bg-muted",
    textClassName: "text-fg",
  },
  {
    name: "surface",
    hex: "#FFFFFF",
    usage: "Karty, formularze, modale",
    className: "bg-surface",
    textClassName: "text-fg",
  },
  {
    name: "border",
    hex: "#E8D4C8",
    usage: "Ramki i separatory",
    className: "bg-border",
    textClassName: "text-fg",
  },
  {
    name: "fg",
    hex: "#241C18",
    usage: "Główny tekst",
    className: "bg-fg",
    textClassName: "text-fg-inverted",
  },
  {
    name: "fg-muted",
    hex: "#6E5E56",
    usage: "Opisy i tekst drugorzędny",
    className: "bg-fg-muted",
    textClassName: "text-fg-inverted",
  },
  {
    name: "fg-soft",
    hex: "#9A8174",
    usage: "Placeholdery, drobne etykiety",
    className: "bg-fg-soft",
    textClassName: "text-fg-inverted",
  },
];

const statusSwatches = [
  {
    name: "success",
    className: "border-success/20 bg-success-soft text-success",
    title: "Sukces",
    description: "Zdjęcia zostały zapisane poprawnie.",
  },
  {
    name: "warning",
    className: "border-warning/20 bg-warning-soft text-warning",
    title: "Ostrzeżenie",
    description: "Klient wybrał mniej zdjęć niż minimalna liczba.",
  },
  {
    name: "danger",
    className: "border-danger/20 bg-danger-soft text-danger",
    title: "Błąd",
    description: "Nie udało się wygenerować paczki ZIP.",
  },
  {
    name: "info",
    className: "border-info/20 bg-info-soft text-info",
    title: "Informacja",
    description: "Sesja jest aktualnie w trakcie przetwarzania.",
  },
];

function ButtonPreview() {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div>
        <p className="text-sm font-medium text-fg-soft">Buttons</p>
        <h2 className="mt-1 text-2xl font-semibold text-fg">
          Przyciski i akcje
        </h2>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-button bg-main px-4 py-2 text-sm font-semibold text-main-foreground transition hover:bg-main-hover active:bg-main-active">
          Primary / main
        </button>

        <button className="rounded-button bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover active:bg-secondary-active">
          Secondary strong
        </button>

        <button className="rounded-button bg-tertiary px-4 py-2 text-sm font-semibold text-tertiary-foreground transition hover:bg-tertiary-hover active:bg-tertiary-active">
          Tertiary
        </button>

        <button className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted">
          Outline
        </button>

        <button className="rounded-button bg-main-soft px-4 py-2 text-sm font-semibold text-fg transition hover:bg-main-subtle">
          Soft
        </button>

        <button className="rounded-button bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition hover:opacity-90">
          Danger
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-6">
        <button
          onClick={() => toast("Zwykła notyfikacja FotoBudki.")}
          className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
        >
          Toast default
        </button>

        <button
          onClick={() => toast.success("Sesja została utworzona.")}
          className="rounded-button bg-success px-4 py-2 text-sm font-semibold text-success-foreground transition hover:opacity-90"
        >
          Toast success
        </button>

        <button
          onClick={() =>
            toast.info(
              "Zdjęcia są przetwarzane. Odświeżymy status automatycznie.",
            )
          }
          className="rounded-button bg-info px-4 py-2 text-sm font-semibold text-info-foreground transition hover:opacity-90"
        >
          Toast info
        </button>

        <button
          onClick={() =>
            toast.warning("Regeneracja kodu unieważni poprzedni link klienta.")
          }
          className="rounded-button bg-warning px-4 py-2 text-sm font-semibold text-warning-foreground transition hover:opacity-90"
        >
          Toast warning
        </button>

        <button
          onClick={() => toast.error("Nie udało się wygenerować paczki ZIP.")}
          className="rounded-button bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition hover:opacity-90"
        >
          Toast error
        </button>
      </div>
    </section>
  );
}

function FormPreview() {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div>
        <p className="text-sm font-medium text-fg-soft">Forms</p>
        <h2 className="mt-1 text-2xl font-semibold text-fg">
          Inputy i formularz
        </h2>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-fg">Tytuł sesji</span>
          <input
            className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-fg outline-none transition placeholder:text-fg-soft focus:border-main focus:ring-4 focus:ring-main-soft"
            placeholder="Sesja rodzinna — maj"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-fg">Email klienta</span>
          <input
            className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-fg outline-none transition placeholder:text-fg-soft focus:border-main focus:ring-4 focus:ring-main-soft"
            placeholder="klient@example.com"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-fg">Opis</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-none rounded-input border border-border bg-surface px-3 py-2 text-fg outline-none transition placeholder:text-fg-soft focus:border-main focus:ring-4 focus:ring-main-soft"
            placeholder="Krótki opis sesji dla klienta..."
          />
        </label>
      </div>
    </section>
  );
}

function StatusPreview() {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
      <div>
        <p className="text-sm font-medium text-fg-soft">Status</p>
        <h2 className="mt-1 text-2xl font-semibold text-fg">
          Alerty i komunikaty
        </h2>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {statusSwatches.map((item) => (
          <div
            key={item.name}
            className={`rounded-card border p-4 ${item.className}`}
          >
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm opacity-80">{item.description}</p>
            <p className="mt-3 text-xs font-medium opacity-70">{item.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SwatchesPreview() {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div>
        <p className="text-sm font-medium text-fg-soft">Palette</p>
        <h2 className="mt-1 text-2xl font-semibold text-fg">
          Kolory systemowe
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          Te nazwy będą działały jako normalne klasy Tailwinda, np.{" "}
          <code className="rounded-md bg-bg-muted px-1.5 py-0.5 text-xs text-fg">
            bg-main
          </code>
          ,{" "}
          <code className="rounded-md bg-bg-muted px-1.5 py-0.5 text-xs text-fg">
            text-fg
          </code>
          ,{" "}
          <code className="rounded-md bg-bg-muted px-1.5 py-0.5 text-xs text-fg">
            border-border
          </code>
          .
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colorSwatches.map((color) => (
          <div
            key={color.name}
            className="overflow-hidden rounded-card border border-border bg-surface shadow-card-sm"
          >
            <div
              className={`flex min-h-28 items-end p-4 ${color.className} ${color.textClassName}`}
            >
              <div>
                <p className="text-lg font-semibold">{color.name}</p>
                <p className="text-sm opacity-80">{color.hex}</p>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-fg-muted">{color.usage}</p>
              <code className="mt-3 inline-block rounded-md bg-bg-muted px-2 py-1 text-xs text-fg">
                {color.className}
              </code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-medium text-fg-soft">Mock UI</p>
          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Mini dashboard FotoBudki
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Szybki podgląd, jak paleta zachowuje się w realnym układzie
            aplikacji.
          </p>
        </div>

        <button className="rounded-button bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary-hover">
          Utwórz sesję
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-border bg-bg p-5">
          <p className="text-sm text-fg-muted">Aktywne sesje</p>
          <p className="mt-2 text-3xl font-bold text-fg">12</p>
          <p className="mt-2 text-sm text-success">+3 w tym tygodniu</p>
        </div>

        <div className="rounded-card border border-border bg-main-subtle p-5">
          <p className="text-sm text-fg-muted">Do płatności</p>
          <p className="mt-2 text-3xl font-bold text-fg">4</p>
          <p className="mt-2 text-sm text-warning">Czekają na mark-paid</p>
        </div>

        <div className="rounded-card border border-border bg-secondary-soft p-5">
          <p className="text-sm text-fg-muted">Gotowe ZIP-y</p>
          <p className="mt-2 text-3xl font-bold text-fg">8</p>
          <p className="mt-2 text-sm text-tertiary">Dostarczone klientom</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border">
        <div className="grid grid-cols-4 bg-bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-soft">
          <span>Sesja</span>
          <span>Status</span>
          <span>Wybrane</span>
          <span className="text-right">Akcja</span>
        </div>

        {[
          {
            title: "Sesja rodzinna — maj",
            status: "selecting",
            badge: "bg-main-soft text-fg",
            selected: "0 / 24",
          },
          {
            title: "Ślub — Ania i Marek",
            status: "waiting_for_payment",
            badge: "bg-warning-soft text-warning",
            selected: "42 / 800",
          },
          {
            title: "Portret biznesowy",
            status: "delivered",
            badge: "bg-success-soft text-success",
            selected: "12 / 64",
          },
        ].map((session) => (
          <div
            key={session.title}
            className="grid grid-cols-4 items-center border-t border-border px-4 py-4 text-sm"
          >
            <span className="font-medium text-fg">{session.title}</span>
            <span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.badge}`}
              >
                {session.status}
              </span>
            </span>
            <span className="text-fg-muted">{session.selected}</span>
            <span className="text-right">
              <button className="rounded-button border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition hover:bg-bg-muted">
                Otwórz
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function App() {
  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-fg">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-card border border-border bg-surface p-8 shadow-card">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex rounded-full bg-main-soft px-3 py-1 text-sm font-semibold text-fg">
                FotoBudka design tokens
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-fg md:text-5xl">
                Test palety kolorów opartej o{" "}
                <span className="text-main-active">#EBB89B</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted">
                Ten ekran pokazuje, jak będą wyglądać kolory, przyciski,
                formularze, alerty i podstawowe karty w docelowym froncie
                FotoBudki.
              </p>
            </div>

            <div className="rounded-card bg-secondary p-5 text-secondary-foreground shadow-card-sm">
              <p className="text-sm opacity-70">Primary brand</p>
              <p className="mt-1 text-3xl font-bold">#EBB89B</p>
              <p className="mt-3 text-sm opacity-80">
                Ciepły peach / nude jako baza UI.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8">
          <SwatchesPreview />

          <div className="grid gap-8 lg:grid-cols-2">
            <ButtonPreview />
            <FormPreview />
          </div>

          <StatusPreview />

          <DashboardPreview />
        </div>
      </div>
    </main>
  );
}
