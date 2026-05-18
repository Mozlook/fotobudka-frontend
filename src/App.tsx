import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  ModalCloseButton,
  Spinner,
  Textarea,
} from "./components/ui";

export function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-fg">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-card border border-border bg-surface p-8 shadow-card">
          <p className="text-sm font-semibold text-fg-soft">FotoBudka UI</p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg">
            Komponenty bazowe FE-0.2
          </h1>

          <p className="mt-4 max-w-2xl text-fg-muted">
            Testujemy Button, Input, Textarea, Modal, Spinner, EmptyState i
            Toast oparty o Sonnera.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => toast.success("Sesja została utworzona.")}>
              Toast success
            </Button>

            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Otwórz modal
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.error("Nie udało się zapisać zmian.")}
            >
              Toast error
            </Button>
          </div>
        </header>

        <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card-sm">
          <p className="text-sm font-medium text-fg-soft">Buttons</p>
          <h2 className="mt-1 text-2xl font-semibold text-fg">
            Warianty przycisków
          </h2>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Zapisywanie</Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <p className="text-sm font-medium text-fg-soft">Forms</p>
            <h2 className="mt-1 text-2xl font-semibold text-fg">
              Formularz sesji
            </h2>

            <div className="mt-6 grid gap-5">
              <Input
                label="Tytuł sesji"
                placeholder="Sesja rodzinna — maj"
                hint="Nazwa widoczna w panelu fotografa i dla klienta."
              />

              <Input
                label="Email klienta"
                type="email"
                placeholder="klient@example.com"
              />

              <Input
                label="Cena bazowa"
                placeholder="35000"
                rightElement={
                  <span className="text-sm font-medium text-fg-soft">
                    groszy
                  </span>
                }
              />

              <Input
                label="Kod testowy"
                placeholder="AB12-CD34"
                error="Kod ma niepoprawny format."
              />

              <Textarea
                label="Opis sesji"
                placeholder="Krótki opis sesji..."
                hint="To pole później możemy pokazać klientowi."
              />

              <div className="flex flex-wrap gap-3">
                <Button>Utwórz sesję</Button>
                <Button variant="outline">Anuluj</Button>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
            <p className="text-sm font-medium text-fg-soft">States</p>
            <h2 className="mt-1 text-2xl font-semibold text-fg">Stany UI</h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-card border border-border bg-bg p-5">
                <div className="flex items-center gap-3">
                  <Spinner />
                  <div>
                    <p className="font-semibold text-fg">Przetwarzanie zdjęć</p>
                    <p className="text-sm text-fg-muted">
                      Worker generuje miniatury i proofy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-card border border-success/20 bg-success-soft p-5 text-success">
                <p className="font-semibold">Gotowe</p>
                <p className="mt-1 text-sm opacity-80">
                  Proofy są dostępne dla klienta.
                </p>
              </div>

              <div className="rounded-card border border-warning/20 bg-warning-soft p-5 text-warning">
                <p className="font-semibold">Oczekuje na płatność</p>
                <p className="mt-1 text-sm opacity-80">
                  Klient zatwierdził wybór, fotograf musi oznaczyć płatność.
                </p>
              </div>

              <div className="rounded-card border border-danger/20 bg-danger-soft p-5 text-danger">
                <p className="font-semibold">Błąd</p>
                <p className="mt-1 text-sm opacity-80">
                  Nie udało się wygenerować paczki ZIP.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <EmptyState
            title="Brak sesji"
            description="Po utworzeniu pierwszej sesji pojawi się tutaj lista projektów fotografa."
            action={<Button>Utwórz pierwszą sesję</Button>}
          />
        </section>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Regeneracja dostępu"
        description="Nowy kod i link unieważnią poprzedni dostęp klienta."
        footer={
          <>
            <ModalCloseButton onClick={() => setModalOpen(false)} />
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast.success("Dostęp został zregenerowany.");
              }}
            >
              Regeneruj dostęp
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-fg-muted">
            Tego typu modal wykorzystamy później przy akcjach, które są
            nieodwracalne albo zmieniają dostęp klienta do sesji.
          </p>

          <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
            <p className="font-semibold">Uwaga</p>
            <p className="mt-1 text-sm opacity-80">
              Stary kod i stary link przestaną działać natychmiast.
            </p>
          </div>
        </div>
      </Modal>
    </main>
  );
}
