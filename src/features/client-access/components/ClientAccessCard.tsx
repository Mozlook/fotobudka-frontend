import { type FormEvent, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";
import { Button, Input } from "../../../components/ui";
import { ApiError } from "../../../lib/api/client";
import { env } from "../../../lib/config/env";
import { toastApiError } from "../../../lib/notifications/apiToast";
import { queryKeys } from "../../../lib/query/keys";
import { accessClientSessionByCode } from "../api";
import type {
  ClientAccessByCodeInput,
  ClientSessionAccessResult,
} from "../types";
import { storeClientSession } from "../storage";

export function ClientAccessCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  const [code, setCode] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const accessMutation = useMutation<
    ClientSessionAccessResult,
    unknown,
    ClientAccessByCodeInput
  >({
    mutationFn: accessClientSessionByCode,

    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.client.session(session.id), session);

      storeClientSession(session);

      toast.success("Dostęp do sesji przyznany.");

      navigate(`/client/session/${session.id}`, {
        replace: true,
        state: {
          session,
        },
      });
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.errorCode === "captcha_required") {
          setCaptchaRequired(true);
          setCaptchaToken(null);
          recaptchaRef.current?.reset();

          toast.warning("Potwierdź CAPTCHA i spróbuj ponownie.");
          return;
        }

        if (error.errorCode === "invalid_captcha") {
          setCaptchaRequired(true);
          setCaptchaToken(null);
          recaptchaRef.current?.reset();

          toast.error("CAPTCHA jest niepoprawna. Spróbuj ponownie.");
          return;
        }
      }

      toastApiError(error, "Nie udało się wejść do sesji.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      toast.error("Wpisz kod sesji.");
      return;
    }

    if (captchaRequired && !captchaToken) {
      toast.error("Potwierdź CAPTCHA.");
      return;
    }

    accessMutation.mutate({
      code: normalizedCode,
      captcha_token: captchaRequired ? captchaToken : null,
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <p className="text-sm font-semibold text-fg-soft">Wejście klienta</p>

      <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg">
        Wpisz kod od fotografa
      </h2>

      <p className="mt-3 text-sm leading-6 text-fg-muted">
        Kod znajdziesz w wiadomości od fotografa. Po poprawnym kodzie backend
        ustawi bezpieczne cookie klienta i przeniesiemy Cię do sesji.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <Input
          label="Kod sesji"
          placeholder="AB12-CD34"
          value={code}
          autoComplete="off"
          inputMode="text"
          onChange={(event) => setCode(event.target.value)}
        />

        {captchaRequired ? (
          <div className="rounded-card border border-warning/20 bg-warning-soft p-4">
            <p className="font-semibold text-warning">Wymagana CAPTCHA</p>

            <p className="mt-1 text-sm leading-6 text-warning/80">
              Po kilku błędnych próbach backend wymaga dodatkowego
              potwierdzenia.
            </p>

            {env.RECAPTCHA_SITE_KEY ? (
              <div className="mt-4 overflow-hidden">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={env.RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  onErrored={() => {
                    setCaptchaToken(null);
                    toast.error("Nie udało się załadować CAPTCHA.");
                  }}
                />
              </div>
            ) : (
              <div className="mt-4 rounded-card border border-danger/20 bg-danger-soft p-4 text-danger">
                <p className="font-semibold">Brak site key</p>
                <p className="mt-1 text-sm opacity-80">
                  Dodaj `VITE_RECAPTCHA_SITE_KEY` w `.env.local` i zrestartuj
                  frontend.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="secondary"
          isLoading={accessMutation.isPending}
        >
          Wejdź do sesji
        </Button>
      </form>

      <div className="mt-6 rounded-card border border-main/20 bg-main-subtle p-4">
        <p className="text-sm font-semibold text-fg">Masz link do sesji?</p>

        <p className="mt-1 text-sm leading-6 text-fg-muted">
          Link od fotografa otworzy się automatycznie przez ścieżkę `/s/...`,
          bez wpisywania kodu.
        </p>
      </div>
    </section>
  );
}
