import { ApiError, apiFetch } from "../../lib/api/client";
import { env } from "../../lib/config/env";
import type {
  MeProfileResult,
  PhotographerProfile,
  UpsertPhotographerProfileInput,
} from "./types";

export function getGoogleLoginUrl() {
  return `${env.API_BASE_URL}/api/auth/google/login`;
}

export async function getMeProfile(): Promise<MeProfileResult> {
  try {
    const profile = await apiFetch<PhotographerProfile>("/api/me/profile");

    return {
      profile,
      hasProfile: true,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        profile: null,
        hasProfile: false,
      };
    }

    throw error;
  }
}

export function logout() {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function updateProfile(input: UpsertPhotographerProfileInput) {
  return apiFetch<PhotographerProfile>("/api/me/profile", {
    method: "PUT",
    json: input,
  });
}
