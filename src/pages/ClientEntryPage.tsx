import { Link } from "react-router";
import { ClientAccessCard } from "../features/client-access/components/ClientAccessCard";

export function ClientEntryPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="font-bold text-fg">
            FotoBudka
          </Link>

          <Link
            to="/login"
            className="rounded-button border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
          >
            Panel fotografa
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-5xl items-center px-6 py-10">
        <ClientAccessCard />
      </section>
    </main>
  );
}
