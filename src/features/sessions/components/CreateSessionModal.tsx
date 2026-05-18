import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button, Input, Modal } from "../../../components/ui";
import type { CreateSessionInput, CreateSessionResult } from "../types";
import { moneyToCents } from "../utils";
import { useCreateSessionMutation } from "../hooks";

type CreateSessionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: CreateSessionResult) => void;
};

type FormState = {
  title: string;
  client_email: string;
  base_price_pln: string;
  included_count: string;
  extra_price_pln: string;
  min_select_count: string;
};

const defaultForm: FormState = {
  title: "",
  client_email: "",
  base_price_pln: "350",
  included_count: "6",
  extra_price_pln: "15",
  min_select_count: "6",
};

function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function CreateSessionModal({
  open,
  onOpenChange,
  onCreated,
}: CreateSessionModalProps) {
  const createSessionMutation = useCreateSessionMutation();

  const [form, setForm] = useState<FormState>(defaultForm);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(defaultForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const clientEmail = form.client_email.trim();
    const basePriceCents = moneyToCents(form.base_price_pln);
    const extraPriceCents = moneyToCents(form.extra_price_pln);
    const includedCount = parsePositiveInteger(form.included_count);
    const minSelectCount = parsePositiveInteger(form.min_select_count);

    if (!title) {
      toast.error("Podaj tytuł sesji.");
      return;
    }

    if (basePriceCents === null) {
      toast.error("Podaj poprawną cenę bazową.");
      return;
    }

    if (extraPriceCents === null) {
      toast.error("Podaj poprawną cenę za dodatkowe zdjęcie.");
      return;
    }

    if (includedCount === null) {
      toast.error("Podaj poprawną liczbę zdjęć w pakiecie.");
      return;
    }

    if (minSelectCount === null || minSelectCount < 1) {
      toast.error("Minimalna liczba wyboru musi być większa od zera.");
      return;
    }

    const payload: CreateSessionInput = {
      title,
      client_email: clientEmail || undefined,
      base_price_cents: basePriceCents,
      included_count: includedCount,
      extra_price_cents: extraPriceCents,
      min_select_count: minSelectCount,
      currency: "PLN",
      payment_mode: "manual",
    };

    createSessionMutation.mutate(payload, {
      onSuccess: (result) => {
        resetForm();
        onOpenChange(false);

        if (result.access) {
          onCreated(result);
        }
      },
    });
  }

  const isPending = createSessionMutation.isPending;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Utwórz sesję"
      description="Po utworzeniu sesji wygenerujemy kod i link dla klienta."
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Anuluj
          </Button>

          <Button
            type="submit"
            form="create-session-form"
            variant="secondary"
            isLoading={isPending}
          >
            Utwórz sesję
          </Button>
        </>
      }
    >
      <form id="create-session-form" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Tytuł sesji"
            placeholder="Sesja rodzinna — maj"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            containerClassName="md:col-span-2"
          />

          <Input
            label="Email klienta"
            type="email"
            placeholder="klient@example.com"
            value={form.client_email}
            onChange={(event) =>
              updateField("client_email", event.target.value)
            }
            hint="Opcjonalnie. Mailer podepniemy później."
            containerClassName="md:col-span-2"
          />

          <Input
            label="Cena bazowa"
            inputMode="decimal"
            placeholder="350"
            value={form.base_price_pln}
            onChange={(event) =>
              updateField("base_price_pln", event.target.value)
            }
            rightElement={
              <span className="text-sm font-medium text-fg-soft">PLN</span>
            }
          />

          <Input
            label="Cena za dodatkowe zdjęcie"
            inputMode="decimal"
            placeholder="15"
            value={form.extra_price_pln}
            onChange={(event) =>
              updateField("extra_price_pln", event.target.value)
            }
            rightElement={
              <span className="text-sm font-medium text-fg-soft">PLN</span>
            }
          />

          <Input
            label="Zdjęcia w pakiecie"
            inputMode="numeric"
            placeholder="6"
            value={form.included_count}
            onChange={(event) =>
              updateField("included_count", event.target.value)
            }
          />

          <Input
            label="Minimalna liczba wyboru"
            inputMode="numeric"
            placeholder="6"
            value={form.min_select_count}
            onChange={(event) =>
              updateField("min_select_count", event.target.value)
            }
          />

          <div className="md:col-span-2 rounded-card border border-main/20 bg-main-subtle p-4">
            <p className="text-sm font-semibold text-fg">
              Tryb płatności: manual
            </p>
            <p className="mt-1 text-sm leading-6 text-fg-muted">
              W MVP fotograf ręcznie oznacza płatność jako opłaconą po
              zatwierdzeniu wyboru przez klienta.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
