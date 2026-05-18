import { apiFetch } from "../../lib/api/client";
import type {
  CreateSessionInput,
  PhotoStats,
  SessionAccessResult,
  SessionSummary,
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
  if (typeof value === "string") {
    return value;
  }

  return undefined;
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

function hasSessionIdentity(record: AnyRecord) {
  return Boolean(
    pick(record, [
      "id",
      "ID",
      "Id",
      "session_id",
      "sessionId",
      "SessionID",
      "SessionId",
    ]),
  );
}

function findSessionSource(record: AnyRecord): AnyRecord {
  const directWrappers = ["session", "Session", "item", "Item"];

  for (const wrapperKey of directWrappers) {
    const candidate = pick(record, [wrapperKey]);

    if (isRecord(candidate)) {
      return candidate;
    }
  }

  const data = pick(record, ["data", "Data"]);

  if (isRecord(data)) {
    for (const wrapperKey of directWrappers) {
      const candidate = pick(data, [wrapperKey]);

      if (isRecord(candidate)) {
        return candidate;
      }
    }

    if (hasSessionIdentity(data)) {
      return data;
    }
  }

  return record;
}

function normalizePhotoStats(value: unknown): PhotoStats | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    total: asNumber(pick(value, ["total", "Total"])) ?? 0,
    pending_upload: asNumber(
      pick(value, [
        "pending_upload",
        "pendingUpload",
        "PendingUpload",
        "PendingUploadCount",
      ]),
    ),
    uploaded: asNumber(pick(value, ["uploaded", "Uploaded"])) ?? 0,
    processing: asNumber(pick(value, ["processing", "Processing"])) ?? 0,
    ready: asNumber(pick(value, ["ready", "Ready"])) ?? 0,
    failed: asNumber(pick(value, ["failed", "Failed"])) ?? 0,
  };
}

function normalizeSession(response: unknown): SessionSummary {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą albo niepoprawną odpowiedź sesji.");
  }

  const wrapper = response;
  const source = findSessionSource(wrapper);
  const session = source as Partial<SessionSummary>;

  const id = asString(
    pick(source, [
      "id",
      "ID",
      "Id",
      "session_id",
      "sessionId",
      "SessionID",
      "SessionId",
    ]),
  );

  if (!id) {
    const sourceKeys = Object.keys(source).join(", ") || "brak pól";
    const wrapperKeys = Object.keys(wrapper).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił identyfikatora sesji. Pola source: ${sourceKeys}. Pola wrappera: ${wrapperKeys}.`,
    );
  }

  const photoStats =
    normalizePhotoStats(
      pick(source, [
        "photo_stats",
        "photoStats",
        "PhotoStats",
        "photos_stats",
        "photosStats",
        "PhotosStats",
      ]),
    ) ??
    normalizePhotoStats(
      pick(wrapper, [
        "photo_stats",
        "photoStats",
        "PhotoStats",
        "photos_stats",
        "photosStats",
        "PhotosStats",
      ]),
    );

  return {
    ...session,

    id,

    title:
      asString(pick(source, ["title", "Title"])) ??
      asString(pick(wrapper, ["title", "Title"])) ??
      "Sesja bez tytułu",

    client_email:
      asNullableString(
        pick(source, ["client_email", "clientEmail", "ClientEmail"]),
      ) ??
      asNullableString(
        pick(wrapper, ["client_email", "clientEmail", "ClientEmail"]),
      ) ??
      null,

    status:
      asString(pick(source, ["status", "Status"])) ??
      asString(pick(wrapper, ["status", "Status"])) ??
      "draft",

    base_price_cents:
      asNumber(
        pick(source, ["base_price_cents", "basePriceCents", "BasePriceCents"]),
      ) ??
      asNumber(
        pick(wrapper, ["base_price_cents", "basePriceCents", "BasePriceCents"]),
      ) ??
      0,

    included_count:
      asNumber(
        pick(source, ["included_count", "includedCount", "IncludedCount"]),
      ) ??
      asNumber(
        pick(wrapper, ["included_count", "includedCount", "IncludedCount"]),
      ) ??
      0,

    extra_price_cents:
      asNumber(
        pick(source, [
          "extra_price_cents",
          "extraPriceCents",
          "ExtraPriceCents",
        ]),
      ) ??
      asNumber(
        pick(wrapper, [
          "extra_price_cents",
          "extraPriceCents",
          "ExtraPriceCents",
        ]),
      ) ??
      0,

    min_select_count:
      asNumber(
        pick(source, ["min_select_count", "minSelectCount", "MinSelectCount"]),
      ) ??
      asNumber(
        pick(wrapper, ["min_select_count", "minSelectCount", "MinSelectCount"]),
      ) ??
      1,

    currency:
      asString(pick(source, ["currency", "Currency"])) ??
      asString(pick(wrapper, ["currency", "Currency"])) ??
      "PLN",

    payment_mode:
      asString(pick(source, ["payment_mode", "paymentMode", "PaymentMode"])) ??
      asString(pick(wrapper, ["payment_mode", "paymentMode", "PaymentMode"])) ??
      "manual",

    created_at:
      asString(pick(source, ["created_at", "createdAt", "CreatedAt"])) ??
      asString(pick(wrapper, ["created_at", "createdAt", "CreatedAt"])),

    updated_at:
      asString(pick(source, ["updated_at", "updatedAt", "UpdatedAt"])) ??
      asString(pick(wrapper, ["updated_at", "updatedAt", "UpdatedAt"])),

    closed_at:
      asNullableString(pick(source, ["closed_at", "closedAt", "ClosedAt"])) ??
      asNullableString(pick(wrapper, ["closed_at", "closedAt", "ClosedAt"])) ??
      null,

    delete_after:
      asNullableString(
        pick(source, ["delete_after", "deleteAfter", "DeleteAfter"]),
      ) ??
      asNullableString(
        pick(wrapper, ["delete_after", "deleteAfter", "DeleteAfter"]),
      ) ??
      null,

    photo_stats: photoStats,
    photos_stats: photoStats,

    selected_count:
      asNumber(
        pick(source, ["selected_count", "selectedCount", "SelectedCount"]),
      ) ??
      asNumber(
        pick(wrapper, ["selected_count", "selectedCount", "SelectedCount"]),
      ),

    payment:
      (pick(source, ["payment", "Payment"]) as SessionSummary["payment"]) ??
      (pick(wrapper, ["payment", "Payment"]) as SessionSummary["payment"]) ??
      null,

    latest_delivery:
      (pick(source, [
        "latest_delivery",
        "latestDelivery",
        "LatestDelivery",
      ]) as SessionSummary["latest_delivery"]) ??
      (pick(wrapper, [
        "latest_delivery",
        "latestDelivery",
        "LatestDelivery",
      ]) as SessionSummary["latest_delivery"]) ??
      null,
  };
}

function extractSessionList(response: unknown, depth = 0): unknown[] {
  if (depth > 3) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  const directList = pick(response, [
    "sessions",
    "Sessions",
    "items",
    "Items",
    "data",
    "Data",
  ]);

  if (Array.isArray(directList)) {
    return directList;
  }

  if (isRecord(directList)) {
    return extractSessionList(directList, depth + 1);
  }

  return [];
}

function findAccessSource(record: AnyRecord): AnyRecord {
  const directWrappers = ["access", "Access", "data", "Data"];

  for (const wrapperKey of directWrappers) {
    const candidate = pick(record, [wrapperKey]);

    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return record;
}

function normalizeAccess(response: unknown): SessionAccessResult {
  if (!isRecord(response)) {
    throw new Error(
      "Backend zwrócił pustą albo niepoprawną odpowiedź dostępu.",
    );
  }

  const source = findAccessSource(response);

  const code = asString(pick(source, ["code", "Code"]));

  const link = asString(
    pick(source, [
      "link",
      "Link",
      "url",
      "URL",
      "client_url",
      "clientUrl",
      "ClientURL",
      "ClientUrl",
    ]),
  );

  if (!code || !link) {
    const keys = Object.keys(source).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił kodu albo linku klienta. Pola odpowiedzi: ${keys}.`,
    );
  }

  return {
    code,
    link,
    created_at: asString(
      pick(source, ["created_at", "createdAt", "CreatedAt"]),
    ),
  };
}

export async function listSessions() {
  const response = await apiFetch<unknown>("/api/sessions");
  const rawItems = extractSessionList(response);

  return rawItems
    .map((item, index) => {
      try {
        return normalizeSession(item);
      } catch (error) {
        if (import.meta.env.DEV) {
          const keys = isRecord(item)
            ? Object.keys(item).join(", ")
            : typeof item;

          console.warn(
            `[sessions] Pominięto sesję bez poprawnego id na pozycji ${index}. Pola: ${keys}`,
            error instanceof Error ? error.message : error,
          );
        }

        return null;
      }
    })
    .filter((session): session is SessionSummary => Boolean(session));
}

export async function getSession(sessionId: string) {
  const response = await apiFetch<unknown>(`/api/sessions/${sessionId}`);

  return normalizeSession(response);
}

export async function createSession(input: CreateSessionInput) {
  const response = await apiFetch<unknown>("/api/sessions", {
    method: "POST",
    json: input,
  });

  return normalizeSession(response);
}

export async function regenerateSessionAccess(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${sessionId}/access/regenerate`,
    {
      method: "POST",
    },
  );

  return normalizeAccess(response);
}
