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

function normalizePhotoStats(value: unknown): PhotoStats | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    pending_upload:
      asNumber(pick(value, ["PendingUploadCount", "pending_upload"])) ?? 0,

    total: asNumber(pick(value, ["TotalCount", "total"])) ?? 0,

    uploaded: asNumber(pick(value, ["UploadedCount", "uploaded"])) ?? 0,

    processing: asNumber(pick(value, ["ProcessingCount", "processing"])) ?? 0,

    ready: asNumber(pick(value, ["ReadyCount", "ready"])) ?? 0,

    failed: asNumber(pick(value, ["FailedCount", "failed"])) ?? 0,
  };
}

function normalizeSession(response: unknown): SessionSummary {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą albo niepoprawną odpowiedź sesji.");
  }

  const wrapper = response;
  const source = findSessionSource(wrapper);
  const session = source as Partial<SessionSummary>;

  const id =
    asString(pick(source, ["ID", "id"])) ??
    asString(pick(source, ["SessionID", "session_id"])) ??
    asString(pick(wrapper, ["ID", "id"])) ??
    asString(pick(wrapper, ["SessionID", "session_id"]));

  if (!id) {
    const sourceKeys = Object.keys(source).join(", ") || "brak pól";
    const wrapperKeys = Object.keys(wrapper).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił identyfikatora sesji. Pola source: ${sourceKeys}. Pola wrappera: ${wrapperKeys}.`,
    );
  }

  const photoStats =
    normalizePhotoStats(
      pick(source, ["PhotoStats", "photo_stats", "photos_stats"]),
    ) ??
    normalizePhotoStats(
      pick(wrapper, ["photo_stats", "PhotoStats", "photos_stats"]),
    );

  const payment =
    pick(source, ["Payment", "payment"]) ??
    pick(wrapper, ["Payment", "payment"]) ??
    null;

  const latestDelivery =
    pick(source, ["LatestDelivery", "latest_delivery"]) ??
    pick(wrapper, ["LatestDelivery", "latest_delivery"]) ??
    null;

  return {
    ...session,

    id,

    title:
      asString(pick(source, ["Title", "title"])) ??
      asString(pick(wrapper, ["Title", "title"])) ??
      "Sesja bez tytułu",

    client_email:
      asNullableString(pick(source, ["ClientEmail", "client_email"])) ??
      asNullableString(pick(wrapper, ["ClientEmail", "client_email"])) ??
      null,

    status:
      asString(pick(source, ["Status", "status"])) ??
      asString(pick(wrapper, ["Status", "status"])) ??
      "draft",

    base_price_cents:
      asNumber(pick(source, ["BasePriceCents", "base_price_cents"])) ??
      asNumber(pick(wrapper, ["BasePriceCents", "base_price_cents"])) ??
      0,

    included_count:
      asNumber(pick(source, ["IncludedCount", "included_count"])) ??
      asNumber(pick(wrapper, ["IncludedCount", "included_count"])) ??
      0,

    extra_price_cents:
      asNumber(pick(source, ["ExtraPriceCents", "extra_price_cents"])) ??
      asNumber(pick(wrapper, ["ExtraPriceCents", "extra_price_cents"])) ??
      0,

    min_select_count:
      asNumber(pick(source, ["MinSelectCount", "min_select_count"])) ??
      asNumber(pick(wrapper, ["MinSelectCount", "min_select_count"])) ??
      1,

    currency:
      asString(pick(source, ["Currency", "currency"])) ??
      asString(pick(wrapper, ["Currency", "currency"])) ??
      "PLN",

    payment_mode:
      asString(pick(source, ["PaymentMode", "payment_mode"])) ??
      asString(pick(wrapper, ["PaymentMode", "payment_mode"])) ??
      "manual",

    created_at:
      asString(pick(source, ["CreatedAt", "created_at"])) ??
      asString(pick(wrapper, ["CreatedAt", "created_at"])),

    updated_at:
      asString(pick(source, ["UpdatedAt", "updated_at"])) ??
      asString(pick(wrapper, ["UpdatedAt", "updated_at"])),

    closed_at:
      asNullableString(pick(source, ["ClosedAt", "closed_at"])) ??
      asNullableString(pick(wrapper, ["ClosedAt", "closed_at"])) ??
      null,

    delete_after:
      asNullableString(pick(source, ["DeleteAfter", "delete_after"])) ??
      asNullableString(pick(wrapper, ["DeleteAfter", "delete_after"])) ??
      null,

    photo_stats: photoStats,
    photos_stats: photoStats,

    selected_count:
      asNumber(pick(source, ["SelectedCount", "selected_count"])) ??
      asNumber(pick(wrapper, ["SelectedCount", "selected_count"])),

    payment: payment as SessionSummary["payment"],
    latest_delivery: latestDelivery as SessionSummary["latest_delivery"],
  };
}

function extractSessionList(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  const sessions = pick(response, ["Sessions", "sessions"]);

  if (Array.isArray(sessions)) {
    return sessions;
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
    const dataSessions = pick(data, ["Sessions", "sessions"]);

    if (Array.isArray(dataSessions)) {
      return dataSessions;
    }

    const dataItems = pick(data, ["Items", "items"]);

    if (Array.isArray(dataItems)) {
      return dataItems;
    }
  }

  return [];
}

function findAccessSource(response: AnyRecord): AnyRecord {
  const access = pick(response, ["Access", "access"]);

  if (isRecord(access)) {
    return access;
  }

  const data = pick(response, ["Data", "data"]);

  if (isRecord(data)) {
    const dataAccess = pick(data, ["Access", "access"]);

    if (isRecord(dataAccess)) {
      return dataAccess;
    }

    return data;
  }

  return response;
}

function normalizeAccess(response: unknown): SessionAccessResult {
  if (!isRecord(response)) {
    throw new Error(
      "Backend zwrócił pustą albo niepoprawną odpowiedź dostępu.",
    );
  }

  const source = findAccessSource(response);

  const code = asString(pick(source, ["Code", "code"]));

  const link = asString(
    pick(source, ["Link", "link", "URL", "url", "ClientURL", "client_url"]),
  );

  if (!code || !link) {
    const fields = Object.keys(source).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił kodu albo linku klienta. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    code,
    link,
    created_at:
      asString(pick(source, ["CreatedAt", "created_at"])) ??
      asString(pick(source, ["createdAt"])),
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
          const fields = isRecord(item)
            ? Object.keys(item).join(", ") || "brak pól"
            : typeof item;

          console.warn(
            `[sessions] Pominięto sesję bez poprawnego id na pozycji ${index}. Pola: ${fields}`,
            error instanceof Error ? error.message : error,
          );
        }

        return null;
      }
    })
    .filter((session): session is SessionSummary => Boolean(session));
}

export async function getSession(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}`,
  );

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
    `/api/sessions/${encodeURIComponent(sessionId)}/access/regenerate`,
    {
      method: "POST",
    },
  );

  return normalizeAccess(response);
}

export function closeSession(sessionId: string) {
  return apiFetch<void>(
    `/api/sessions/${encodeURIComponent(sessionId)}/close`,
    {
      method: "POST",
    },
  );
}
