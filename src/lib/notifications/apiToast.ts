import { toast } from "sonner";
import { ApiError } from "../api/client";

const apiErrorMessages: Record<string, string> = {
  unauthorized: "Musisz się zalogować.",
  forbidden: "Nie masz dostępu do tej operacji.",
  not_found: "Nie znaleziono zasobu.",
  validation_error: "Sprawdź poprawność danych formularza.",
  captcha_required: "Potwierdź CAPTCHA i spróbuj ponownie.",
  invalid_captcha: "CAPTCHA jest niepoprawna. Spróbuj ponownie.",
  request_failed: "Nie udało się wykonać operacji.",
};

export function toastApiError(error: unknown, fallbackMessage?: string) {
  if (error instanceof ApiError) {
    const message =
      apiErrorMessages[error.errorCode] ??
      error.message ??
      fallbackMessage ??
      "Wystąpił błąd.";

    toast.error(message);
    return;
  }

  if (error instanceof Error) {
    toast.error(fallbackMessage ?? error.message);
    return;
  }

  toast.error(fallbackMessage ?? "Wystąpił nieznany błąd.");
}
