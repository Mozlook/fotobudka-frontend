import { apiFetch } from "../../lib/api/client";
import type { ClientDeliveryDownload } from "./types";

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

function normalizeClientDeliveryDownload(
  response: unknown,
): ClientDeliveryDownload {
  const source = getDataSource(response);

  if (!isRecord(source)) {
    throw new Error("Backend zwrócił pustą odpowiedź downloadu.");
  }

  const deliveryId =
    asString(
      pick(source, ["DeliveryID", "DeliveryId", "delivery_id", "deliveryId"]),
    ) ?? asString(pick(source, ["ID", "id"]));

  const version = asNumber(pick(source, ["Version", "version"]));

  const downloadUrl =
    asString(
      pick(source, [
        "DownloadURL",
        "DownloadUrl",
        "download_url",
        "downloadUrl",
      ]),
    ) ?? asString(pick(source, ["URL", "url"]));

  if (!deliveryId || version === undefined || !downloadUrl) {
    const fields = Object.keys(source).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił delivery_id, version albo download_url. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    delivery_id: deliveryId,
    version,
    download_url: downloadUrl,
    zip_size_bytes:
      asNumber(pick(source, ["ZipSizeBytes", "zip_size_bytes"])) ?? null,
    generated_at:
      asString(pick(source, ["GeneratedAt", "generated_at"])) ?? null,
  };
}

export async function getClientDeliveryDownload(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/client/session/${encodeURIComponent(sessionId)}/download`,
  );

  return normalizeClientDeliveryDownload(response);
}
