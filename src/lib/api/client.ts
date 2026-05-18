import { env } from "../config/env";

export type ApiErrorBody = {
  error_code?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  errorCode: string;
  details?: unknown;

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = body?.error_code ?? "request_failed";
    this.details = body?.details;
  }
}

type ApiFetchOptions = RequestInit & {
  json?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readBody<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

async function readErrorBody(
  response: Response,
): Promise<ApiErrorBody | undefined> {
  const text = await response.text();

  if (!text.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(text);

    if (isRecord(parsed)) {
      return {
        error_code:
          typeof parsed.error_code === "string" ? parsed.error_code : undefined,
        message:
          typeof parsed.message === "string" ? parsed.message : undefined,
        details: parsed.details,
      };
    }

    return {
      message: text,
    };
  } catch {
    return {
      message: text,
    };
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  let body = options.body;

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const response = await fetch(`${env.API_BASE_URL}${path}`, {
    ...options,
    body,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody | undefined;

    try {
      errorBody = await readErrorBody(response);
    } catch {
      errorBody = undefined;
    }

    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return readBody<T>(response);
}
