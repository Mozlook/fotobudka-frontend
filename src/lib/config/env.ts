const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const env = {
  API_BASE_URL: rawApiBaseUrl.replace(/\/$/, ""),
  RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "",
};
