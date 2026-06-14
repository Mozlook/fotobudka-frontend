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
import { storeClientSession } from "../storage";
import type {
  ClientAccessByCodeInput,
  ClientSessionAccessResult,
} from "../types";

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

      const targetPath =
        session.status === "delivered"
          ? `/client/session/${session.id}/download`
          : `/client/session/${session.id}`;

      navigate(targetPath, {
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
    <section className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-7">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-main-active">
        <span aria-hidden="true" className="h-px w-7 bg-main/50" />
        Wejście klienta
      </p>

      <h2 className="mt-4 text-[1.75rem] font-semibold leading-tight text-fg">
        Wpisz kod od fotografa
      </h2>

      <p className="mt-3 text-sm leading-6 text-fg-muted">
        Kod znajdziesz w wiadomości od fotografa. Jeśli kod zaginął, wygasł albo
        nie działa, poproś fotografa o wygenerowanie nowego dostępu.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <Input
          label="Kod sesji"
          placeholder="AB12-CD34"
          value={code}
          autoComplete="off"
          inputMode="text"
          inputSize="lg"
          className="text-center text-lg font-semibold uppercase tracking-[0.35em] placeholder:tracking-[0.25em] placeholder:normal-case"
          onChange={(event) => setCode(event.target.value)}
        />

        {captchaRequired ? (
          <div className="rounded-card border border-warning/20 bg-warning-soft p-4">
            <p className="font-semibold text-warning">Wymagana CAPTCHA</p>

            <p className="mt-1 text-sm leading-6 text-warning/80">
              Po kilku błędnych próbach prosimy o dodatkowe potwierdzenie, że
              kod wpisuje prawdziwa osoba.
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
                <p className="font-semibold">CAPTCHA nie jest skonfigurowana</p>

                <p className="mt-1 text-sm opacity-80">
                  Spróbuj ponownie później albo skontaktuj się z fotografem.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          className="w-full"
          isLoading={accessMutation.isPending}
        >
          Wejdź do sesji
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-3 rounded-card border border-main/20 bg-main-subtle p-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-main-soft text-main-active"
        >
          🔗
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">Masz link do sesji?</p>

          <p className="mt-1 text-sm leading-6 text-fg-muted">
            Otwórz link z wiadomości od fotografa. Wtedy nie musisz przepisywać
            kodu ręcznie.
          </p>
        </div>
      </div>
    </section>
  );
}
