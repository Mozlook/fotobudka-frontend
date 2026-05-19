import { apiFetch } from "../../lib/api/client";
import type {
  FinalUploadTarget,
  GenerateDeliveryZipResult,
  PresignFinalUploadsInput,
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

function getDataSource(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  const data = pick(response, ["Data", "data"]);

  return data ?? response;
}

function extractUploadTargets(response: unknown): unknown[] {
  const source = getDataSource(response);

  if (!isRecord(source)) {
    return [];
  }

  const uploads = pick(source, ["Uploads", "uploads"]);

  if (Array.isArray(uploads)) {
    return uploads;
  }

  const finals = pick(source, ["Finals", "finals"]);

  if (Array.isArray(finals)) {
    return finals;
  }

  return [];
}

function normalizeFinalUploadTarget(value: unknown): FinalUploadTarget {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny obiekt final uploadu.");
  }

  const finalId =
    asString(pick(value, ["FinalID", "FinalId", "final_id", "finalId"])) ??
    asString(pick(value, ["ID", "id"]));

  const photoId = asString(
    pick(value, ["PhotoID", "PhotoId", "photo_id", "photoId"]),
  );

  const putUrl =
    asString(pick(value, ["PutURL", "PutUrl", "put_url", "putUrl"])) ??
    asString(pick(value, ["URL", "url"]));

  if (!finalId || !photoId || !putUrl) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił final_id, photo_id albo put_url. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    final_id: finalId,
    photo_id: photoId,
    put_url: putUrl,
    object_key:
      asString(pick(value, ["ObjectKey", "object_key", "objectKey"])) ??
      undefined,
  };
}

function normalizeGenerateDeliveryResult(
  response: unknown,
): GenerateDeliveryZipResult {
  const source = getDataSource(response);

  if (!isRecord(source)) {
    throw new Error("Backend zwrócił pustą odpowiedź generate-zip.");
  }

  const deliveryId =
    asString(
      pick(source, ["DeliveryID", "DeliveryId", "delivery_id", "deliveryId"]),
    ) ?? asString(pick(source, ["ID", "id"]));

  const version = asNumber(pick(source, ["Version", "version"]));

  const status = asString(pick(source, ["Status", "status"])) ?? "generating";

  if (!deliveryId || version === undefined) {
    const fields = Object.keys(source).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił delivery_id albo version. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    delivery_id: deliveryId,
    version,
    status,
  };
}

export async function presignFinalUploads(
  sessionId: string,
  input: PresignFinalUploadsInput,
) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}/finals/presign`,
    {
      method: "POST",
      json: input,
    },
  );

  const uploads = extractUploadTargets(response).map(
    normalizeFinalUploadTarget,
  );

  if (uploads.length !== input.files.length) {
    throw new Error(
      `Backend zwrócił ${uploads.length} presignów dla ${input.files.length} plików.`,
    );
  }

  return uploads;
}

export function completeFinalUpload(sessionId: string, finalId: string) {
  return apiFetch<void>(
    `/api/sessions/${encodeURIComponent(
      sessionId,
    )}/finals/${encodeURIComponent(finalId)}/complete`,
    {
      method: "POST",
    },
  );
}

export async function generateDeliveryZip(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}/deliveries/generate-zip`,
    {
      method: "POST",
    },
  );

  return normalizeGenerateDeliveryResult(response);
}
