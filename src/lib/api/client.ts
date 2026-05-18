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

async function readJsonBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
      errorBody = await readJsonBody<ApiErrorBody>(response);
    } catch {
      errorBody = undefined;
    }

    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return readJsonBody<T>(response);
}
