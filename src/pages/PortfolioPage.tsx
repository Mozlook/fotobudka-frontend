import { Button, EmptyState } from "../components/ui";

export function PortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-semibold text-fg-soft">Portfolio</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
          Portfolio fotografa
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
          To będzie sekcja P1 pod publiczny profil i galerie. Na razie
          zostawiamy ją jako część nawigacji shellowej.
        </p>
      </div>

      <div className="mt-8">
        <EmptyState
          title="Portfolio będzie później"
          description="Najpierw domkniemy MVP sesji: upload proofów, selekcję klienta, płatność manualną, finale i ZIP."
          action={<Button disabled>Dodaj galerię</Button>}
        />
      </div>
    </div>
  );
}
