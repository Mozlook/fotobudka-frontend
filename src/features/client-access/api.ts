import { apiFetch } from "../../lib/api/client";
import type {
  ClientAccessByCodeInput,
  ClientSessionAccessResult,
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

function findClientSessionSource(response: AnyRecord): AnyRecord {
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

function normalizeClientSessionAccess(
  response: unknown,
): ClientSessionAccessResult {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą albo niepoprawną odpowiedź sesji.");
  }

  const source = findClientSessionSource(response);

  const id =
    asString(pick(source, ["ID", "id"])) ??
    asString(pick(source, ["SessionID", "session_id"]));

  if (!id) {
    const fields = Object.keys(source).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił identyfikatora sesji. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    id,

    title: asString(pick(source, ["Title", "title"])) ?? "Sesja bez tytułu",

    status: asString(pick(source, ["Status", "status"])) ?? "selecting",

    base_price_cents:
      asNumber(pick(source, ["BasePriceCents", "base_price_cents"])) ?? 0,

    included_count:
      asNumber(pick(source, ["IncludedCount", "included_count"])) ?? 0,

    extra_price_cents:
      asNumber(pick(source, ["ExtraPriceCents", "extra_price_cents"])) ?? 0,

    min_select_count:
      asNumber(pick(source, ["MinSelectCount", "min_select_count"])) ?? 1,

    currency: asString(pick(source, ["Currency", "currency"])) ?? "PLN",

    payment_mode:
      asString(pick(source, ["PaymentMode", "payment_mode"])) ?? "manual",
  };
}

export async function accessClientSessionByCode(
  input: ClientAccessByCodeInput,
) {
  const response = await apiFetch<unknown>("/api/client/access/by-code", {
    method: "POST",
    json: {
      code: input.code,
      captcha_token: input.captcha_token ?? null,
    },
  });

  return normalizeClientSessionAccess(response);
}

export async function accessClientSessionByToken(token: string) {
  const response = await apiFetch<unknown>(
    `/api/client/access/by-token/${encodeURIComponent(token)}`,
  );

  return normalizeClientSessionAccess(response);
}
