import type { ClientSessionAccessResult } from "./types";

const CLIENT_SESSION_STORAGE_PREFIX = "fotobudka.client-session.";

function getStorageKey(sessionId: string) {
  return `${CLIENT_SESSION_STORAGE_PREFIX}${sessionId}`;
}

export function storeClientSession(session: ClientSessionAccessResult) {
  try {
    sessionStorage.setItem(getStorageKey(session.id), JSON.stringify(session));
  } catch {
    // Session metadata cache is best-effort only.
  }
}

export function readClientSession(sessionId: string) {
  try {
    const raw = sessionStorage.getItem(getStorageKey(sessionId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ClientSessionAccessResult;
  } catch {
    return null;
  }
}
