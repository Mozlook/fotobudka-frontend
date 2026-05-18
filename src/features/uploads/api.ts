import { apiFetch } from "../../lib/api/client";
import type {
  PresignSourcePhotosInput,
  SourcePhotoUploadTarget,
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

  const wantedKeys = new Set(keys.map((key) => key.toLowerCase()));

  for (const [key, value] of Object.entries(record)) {
    if (wantedKeys.has(key.toLowerCase())) {
      return value;
    }
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function extractUploadList(response: unknown): unknown[] {
  if (!isRecord(response)) {
    return [];
  }

  const data = pick(response, ["data", "Data"]);
  const root = isRecord(data) ? data : response;

  const uploads = pick(root, ["uploads", "Uploads"]);

  if (Array.isArray(uploads)) {
    return uploads;
  }

  return [];
}

function normalizeUploadTarget(value: unknown): SourcePhotoUploadTarget {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny element uploadu.");
  }

  const photoId = asString(
    pick(value, ["photo_id", "photoId", "PhotoID", "PhotoId", "id", "ID"]),
  );

  const putUrl = asString(
    pick(value, ["put_url", "putUrl", "PutURL", "PutUrl", "url", "URL"]),
  );

  if (!photoId || !putUrl) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił photo_id albo put_url. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    photo_id: photoId,
    put_url: putUrl,
    object_key: asString(pick(value, ["object_key", "objectKey", "ObjectKey"])),
  };
}

export async function presignSourcePhotoUploads(
  sessionId: string,
  input: PresignSourcePhotosInput,
) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}/photos/presign`,
    {
      method: "POST",
      json: input,
    },
  );

  const uploads = extractUploadList(response).map(normalizeUploadTarget);

  if (uploads.length !== input.files.length) {
    throw new Error(
      `Backend zwrócił ${uploads.length} presignów dla ${input.files.length} plików.`,
    );
  }

  return uploads;
}

export function completeSourcePhotoUpload(sessionId: string, photoId: string) {
  return apiFetch<void>(
    `/api/sessions/${encodeURIComponent(
      sessionId,
    )}/photos/${encodeURIComponent(photoId)}/complete`,
    {
      method: "POST",
    },
  );
}
