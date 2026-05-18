import { Button, EmptyState } from "../components/ui";

export function SessionsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-fg-soft">Sesje</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
            Sesje zdjęciowe
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
            Tutaj w FE-2 dodamy listę sesji, filtry po statusach, tworzenie
            sesji oraz regenerację kodu i linku klienta.
          </p>
        </div>

        <Button disabled>Utwórz sesję</Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Aktywne sesje</p>
          <p className="mt-2 text-3xl font-bold text-fg">—</p>
        </div>

        <div className="rounded-card border border-border bg-main-subtle p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Oczekują na płatność</p>
          <p className="mt-2 text-3xl font-bold text-fg">—</p>
        </div>

        <div className="rounded-card border border-border bg-secondary-soft p-5 shadow-card-sm">
          <p className="text-sm text-fg-muted">Dostarczone ZIP-y</p>
          <p className="mt-2 text-3xl font-bold text-fg">—</p>
        </div>
      </div>

      <div className="mt-8">
        <EmptyState
          title="Lista sesji jeszcze niepodpięta"
          description="W następnym etapie podłączymy GET /api/sessions, statusy, tworzenie sesji i widok szczegółów."
          action={<Button disabled>Utwórz pierwszą sesję</Button>}
        />
      </div>
    </div>
  );
}
