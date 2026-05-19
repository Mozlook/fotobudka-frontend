import { apiFetch } from "../../lib/api/client";
import type {
  ClientPhoto,
  ClientPhotosPage,
  ProofUrlResult,
  SelectionUpdateItem,
  SubmitSelectionResult,
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

function extractPhotosList(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  const photos = pick(response, ["Photos", "photos"]);

  if (Array.isArray(photos)) {
    return photos;
  }

  const items = pick(response, ["Items", "items"]);

  if (Array.isArray(items)) {
    return items;
  }

  const data = pick(response, ["Data", "data"]);

  if (Array.isArray(data)) {
    return data;
  }

  if (isRecord(data)) {
    const dataPhotos = pick(data, ["Photos", "photos"]);

    if (Array.isArray(dataPhotos)) {
      return dataPhotos;
    }

    const dataItems = pick(data, ["Items", "items"]);

    if (Array.isArray(dataItems)) {
      return dataItems;
    }
  }

  return [];
}

function getPageSource(response: unknown): AnyRecord {
  if (!isRecord(response)) {
    return {};
  }

  const data = pick(response, ["Data", "data"]);

  if (isRecord(data)) {
    return data;
  }

  return response;
}

function normalizeClientPhoto(value: unknown): ClientPhoto {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny obiekt zdjęcia.");
  }

  const id =
    asString(pick(value, ["ID", "id"])) ??
    asString(pick(value, ["PhotoID", "photo_id"]));

  if (!id) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił identyfikatora zdjęcia. Pola odpowiedzi: ${fields}.`,
    );
  }

  const thumbUrl =
    asString(pick(value, ["ThumbURL", "thumb_url"])) ??
    asString(pick(value, ["ThumbUrl", "thumbUrl"]));

  if (!thumbUrl) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił thumb_url. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    id,

    original_filename:
      asString(pick(value, ["OriginalFilename", "original_filename"])) ??
      asString(pick(value, ["Filename", "filename"])) ??
      "photo.jpg",

    thumb_url: thumbUrl,

    selected: asBoolean(pick(value, ["Selected", "selected"])) ?? false,

    note: asNullableString(pick(value, ["Note", "note"])) ?? "",

    created_at:
      asString(pick(value, ["CreatedAt", "created_at"])) ??
      asString(pick(value, ["createdAt"])),
  };
}

function normalizePhotosPage(
  response: unknown,
  offset: number,
  limit: number,
): ClientPhotosPage {
  const pageSource = getPageSource(response);
  const rawPhotos = extractPhotosList(response);

  const photos = rawPhotos
    .map((item, index) => {
      try {
        return normalizeClientPhoto(item);
      } catch (error) {
        if (import.meta.env.DEV) {
          const fields = isRecord(item)
            ? Object.keys(item).join(", ") || "brak pól"
            : typeof item;

          console.warn(
            `[client-photos] Pominięto zdjęcie na pozycji ${index}. Pola: ${fields}`,
            error instanceof Error ? error.message : error,
          );
        }

        return null;
      }
    })
    .filter((photo): photo is ClientPhoto => Boolean(photo));

  const totalCount =
    asNumber(pick(pageSource, ["TotalCount", "total_count"])) ??
    asNumber(pick(pageSource, ["Total", "total"]));

  const nextOffset =
    asNumber(pick(pageSource, ["NextOffset", "next_offset"])) ??
    asNumber(pick(pageSource, ["nextOffset"]));

  const hasMore =
    asBoolean(pick(pageSource, ["HasMore", "has_more"])) ??
    asBoolean(pick(pageSource, ["hasMore"])) ??
    photos.length === limit;

  return {
    photos,
    offset,
    limit,
    total_count: totalCount,
    next_offset: nextOffset ?? offset + photos.length,
    has_more: hasMore,
  };
}

function normalizeProofUrl(response: unknown): ProofUrlResult {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź proof URL.");
  }

  const data = pick(response, ["Data", "data"]);
  const source = isRecord(data) ? data : response;

  const proofUrl =
    asString(pick(source, ["ProofURL", "proof_url"])) ??
    asString(pick(source, ["ProofUrl", "proofUrl"])) ??
    asString(pick(source, ["URL", "url"]));

  if (!proofUrl) {
    const fields = Object.keys(source).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił proof_url. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    proof_url: proofUrl,
  };
}

function normalizeSubmitResult(response: unknown): SubmitSelectionResult {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź submit.");
  }

  const data = pick(response, ["Data", "data"]);
  const source = isRecord(data) ? data : response;

  return {
    status:
      asString(pick(source, ["Status", "status"])) ?? "waiting_for_payment",

    selected_count:
      asNumber(pick(source, ["SelectedCount", "selected_count"])) ?? 0,

    amount_cents: asNumber(pick(source, ["AmountCents", "amount_cents"])) ?? 0,
  };
}

export async function listClientPhotos({
  sessionId,
  offset,
  limit,
}: {
  sessionId: string;
  offset: number;
  limit: number;
}) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  const response = await apiFetch<unknown>(
    `/api/client/session/${encodeURIComponent(sessionId)}/photos?${params}`,
  );

  return normalizePhotosPage(response, offset, limit);
}

export async function getClientProofUrl(photoId: string) {
  const response = await apiFetch<unknown>(
    `/api/client/photos/${encodeURIComponent(photoId)}/proof-url`,
  );

  return normalizeProofUrl(response);
}

export function updateClientSelections(
  sessionId: string,
  items: SelectionUpdateItem[],
) {
  return apiFetch<void>(
    `/api/client/session/${encodeURIComponent(sessionId)}/selections`,
    {
      method: "PUT",
      json: {
        items,
      },
    },
  );
}

export async function submitClientSelection(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/client/session/${encodeURIComponent(sessionId)}/submit`,
    {
      method: "POST",
    },
  );

  return normalizeSubmitResult(response);
}
