import type { PhotoStats, SessionStatus, SessionSummary } from "./types";

export const sessionStatusFilters = [
  { value: "all", label: "Wszystkie" },
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Processing" },
  { value: "selecting", label: "Selekcja" },
  { value: "waiting_for_payment", label: "Płatność" },
  { value: "editing", label: "Obróbka" },
  { value: "delivered", label: "Dostarczone" },
  { value: "closed", label: "Zamknięte" },
  { value: "failed", label: "Błąd" },
];

const statusMeta: Record<
  string,
  {
    label: string;
    description: string;
    className: string;
  }
> = {
  draft: {
    label: "Draft",
    description: "Sesja utworzona, trwa przygotowanie materiału.",
    className: "bg-bg-muted text-fg-muted",
  },
  processing: {
    label: "Processing",
    description: "Worker generuje miniatury i proofy.",
    className: "bg-info-soft text-info",
  },
  selecting: {
    label: "Selekcja",
    description: "Klient może wybierać zdjęcia.",
    className: "bg-main-soft text-main-active",
  },
  waiting_for_payment: {
    label: "Płatność",
    description: "Wybór zatwierdzony, oczekiwanie na płatność manualną.",
    className: "bg-warning-soft text-warning",
  },
  editing: {
    label: "Obróbka",
    description: "Płatność oznaczona, fotograf obrabia zdjęcia.",
    className: "bg-tertiary-soft text-tertiary",
  },
  delivered: {
    label: "Dostarczone",
    description: "ZIP jest gotowy do pobrania.",
    className: "bg-success-soft text-success",
  },
  closed: {
    label: "Zamknięte",
    description: "Sesja zamknięta.",
    className: "bg-secondary-soft text-secondary",
  },
  archived: {
    label: "Archiwum",
    description: "Sesja zarchiwizowana.",
    className: "bg-secondary-soft text-secondary",
  },
  failed: {
    label: "Błąd",
    description: "Sesja wymaga uwagi.",
    className: "bg-danger-soft text-danger",
  },
};

export function getSessionStatusMeta(status: SessionStatus) {
  return (
    statusMeta[status] ?? {
      label: status,
      description: "Status sesji.",
      className: "bg-bg-muted text-fg-muted",
    }
  );
}

export function getSessionPhotoStats(
  session: SessionSummary,
): PhotoStats | undefined {
  return session.photo_stats ?? session.photos_stats;
}

export function formatMoney(cents?: number, currency: string = "PLN") {
  const safeCents = cents ?? 0;

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
  }).format(safeCents / 100);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function moneyToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");

  if (!normalized) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}
