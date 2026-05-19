import { apiFetch } from "../../lib/api/client";
import type { MarkPaidResult } from "./types";

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

function normalizeMarkPaidResult(response: unknown): MarkPaidResult {
  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź mark-paid.");
  }

  const data = pick(response, ["Data", "data"]);
  const source = isRecord(data) ? data : response;

  return {
    session_status:
      asString(pick(source, ["SessionStatus", "session_status"])) ??
      asString(pick(source, ["Status", "status"])) ??
      "editing",

    payment_status:
      asString(pick(source, ["PaymentStatus", "payment_status"])) ?? "paid",

    amount_cents: asNumber(pick(source, ["AmountCents", "amount_cents"])) ?? 0,
  };
}

export async function markSessionPaid(sessionId: string) {
  const response = await apiFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}/payment/mark-paid`,
    {
      method: "POST",
    },
  );

  return normalizeMarkPaidResult(response);
}
