import { apiFetch } from "../../lib/api/client";
import type {
  PhotographerSelectedPhoto,
  PhotographerSelectionOverview,
} from "./types";

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function pick(record: AnyRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key];
    }
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return asString(value);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return undefined;
}

function findSessionSource(response: AnyRecord): AnyRecord {
  const session = pick(response, ["Session", "session"]);

  if (isRecord(session)) {
    return session;
  }

  const data = pick(response, ["Data", "data"]);

  if (isRecord(data)) {
    const dataSession = pick(data, ["Session", "session"]);

    if (isRecord(dataSession)) {
      return dataSession;
    }

    return data;
  }

  return response;
}

function findPaymentSource(response: AnyRecord): AnyRecord | null {
  const payment = pick(response, ["Payment", "payment"]);

  if (isRecord(payment)) {
    return payment;
  }

  const data = pick(response, ["Data", "data"]);

  if (isRecord(data)) {
    const dataPayment = pick(data, ["Payment", "payment"]);

    if (isRecord(dataPayment)) {
      return dataPayment;
    }
  }

  return null;
}

function extractSelectedPhotoList(response: AnyRecord): unknown[] {
  const direct = pick(response, [
    "SelectedPhotos",
    "selected_photos",
    "Selections",
    "selections",
  ]);

  if (Array.isArray(direct)) {
    return direct;
  }

  const data = pick(response, ["Data", "data"]);

  if (isRecord(data)) {
    const fromData = pick(data, [
      "SelectedPhotos",
      "selected_photos",
      "Selections",
      "selections",
    ]);

    if (Array.isArray(fromData)) {
      return fromData;
    }
  }

  return [];
}

function normalizeSelectedPhoto(value: unknown): PhotographerSelectedPhoto {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny obiekt wyboru.");
  }

  const photoId =
    asString(pick(value, ["PhotoID", "photo_id"])) ??
    asString(pick(value, ["ID", "id"]));

  if (!photoId) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił photo_id dla wyboru. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    photo_id: photoId,

    original_filename:
      asString(pick(value, ["OriginalFilename", "original_filename"])) ??
      asString(pick(value, ["Filename", "filename"])) ??
      "photo.jpg",

    thumb_url:
      asString(pick(value, ["ThumbURL", "thumb_url"])) ??
      asString(pick(value, ["ThumbUrl", "thumbUrl"])),

    proof_url:
      asString(pick(value, ["ProofURL", "proof_url"])) ??
      asString(pick(value, ["ProofUrl", "proofUrl"])),

    note: asString(pick(value, ["Note", "note"])) ?? "",

    selected_at:
      asString(pick(value, ["SelectedAt", "selected_at"])) ??
      asString(pick(value, ["CreatedAt", "created_at"])),

    final_id: asNullableString(pick(value, ["FinalID", "final_id"])) ?? null,

    final_uploaded:
      asBoolean(pick(value, ["FinalUploaded", "final_uploaded"])) ??
      Boolean(asNullableString(pick(value, ["FinalID", "final_id"]))),
  };
}

function normalizeSelectionOverview(
  response: unknown,
): PhotographerSelectionOverview {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź szczegółów sesji.");
  }

  const session = findSessionSource(response);
  const payment = findPaymentSource(response);

  const sessionId =
    asString(pick(session, ["ID", "id"])) ??
    asString(pick(session, ["SessionID", "session_id"]));

  if (!sessionId) {
    throw new Error("Backend nie zwrócił ID sesji.");
  }

  const photos = extractSelectedPhotoList(response)
    .map((item, index) => {
      try {
        return normalizeSelectedPhoto(item);
      } catch (error) {
        if (import.meta.env.DEV) {
          const fields = isRecord(item)
            ? Object.keys(item).join(", ") || "brak pól"
            : typeof item;

          console.warn(
            `[photographer-selection] Pominięto wybrane zdjęcie na pozycji ${index}. Pola: ${fields}`,
            error instanceof Error ? error.message : error,
          );
        }

        return null;
      }
    })
    .filter((photo): photo is PhotographerSelectedPhoto => Boolean(photo));

  const selectedCount =
    asNumber(pick(response, ["SelectedCount", "selected_count"])) ??
    asNumber(pick(session, ["SelectedCount", "selected_count"])) ??
    photos.length;

  const amountCents = payment
    ? asNumber(pick(payment, ["AmountCents", "amount_cents"]))
    : asNumber(pick(response, ["AmountCents", "amount_cents"]));

  const paymentStatus = payment
    ? asString(pick(payment, ["Status", "status"]))
    : asString(pick(response, ["PaymentStatus", "payment_status"]));

  const paidAt = payment
    ? asNullableString(pick(payment, ["PaidAt", "paid_at"]))
    : asNullableString(pick(response, ["PaidAt", "paid_at"]));

  return {
    session_id: sessionId,

    session_status:
      asString(pick(session, ["Status", "status"])) ??
      asString(pick(response, ["Status", "status"])) ??
      "draft",

    selected_count: selectedCount,
    amount_cents: amountCents ?? null,
    payment_status: paymentStatus ?? null,
    payment_paid_at: paidAt ?? null,
    photos,
  };
}

export async function getPhotographerSelectionOverview(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}/selections`,
  );

  return normalizeSelectionOverview(response);
}
