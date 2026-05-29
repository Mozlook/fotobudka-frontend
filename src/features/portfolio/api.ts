import { apiFetch } from "../../lib/api/client";
import type {
  Gallery,
  GalleryDetail,
  GalleryPhoto,
  GalleryPhotoUploadTarget,
  PresignGalleryPhotosInput,
  PublicGalleryPageData,
  PublicPhotographerPageData,
  PublicProfile,
  UpsertGalleryInput,
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

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function normalizeGallery(value: unknown): Gallery {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny obiekt galerii.");
  }

  const id = asString(pick(value, ["ID", "id"]));

  if (!id) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił ID galerii. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    id,
    title: asString(pick(value, ["Title", "title"])) ?? "Galeria bez tytułu",
    slug: asString(pick(value, ["Slug", "slug"])) ?? "",
    is_public: asBoolean(pick(value, ["IsPublic", "is_public"])) ?? false,
    photo_count: asNumber(pick(value, ["PhotoCount", "photo_count"])) ?? 0,
    cover_url: asString(pick(value, ["CoverURL", "cover_url"])),
    created_at: asString(pick(value, ["CreatedAt", "created_at"])),
  };
}

function normalizeGalleryPhoto(value: unknown): GalleryPhoto {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny obiekt zdjęcia galerii.");
  }

  const id = asString(pick(value, ["ID", "id"]));

  if (!id) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił ID zdjęcia galerii. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    id,
    image_url: asString(pick(value, ["ImageURL", "image_url"])),
    width: asNumber(pick(value, ["Width", "width"])) ?? 0,
    height: asNumber(pick(value, ["Height", "height"])) ?? 0,
    sort_order: asNumber(pick(value, ["SortOrder", "sort_order"])) ?? 0,
    created_at: asString(pick(value, ["CreatedAt", "created_at"])),
  };
}

function normalizeProfile(value: unknown): PublicProfile {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny profil publiczny.");
  }

  const socialLinksRaw = pick(value, ["SocialLinks", "social_links"]);
  const socialLinks = isRecord(socialLinksRaw)
    ? Object.fromEntries(
        Object.entries(socialLinksRaw).map(([key, link]) => [
          key,
          typeof link === "string" ? link : "",
        ]),
      )
    : {};

  return {
    username: asString(pick(value, ["Username", "username"])) ?? "",
    display_name: asString(pick(value, ["DisplayName", "display_name"])) ?? "",
    bio: asString(pick(value, ["Bio", "bio"])) ?? "",
    social_links: socialLinks,
  };
}

function normalizeUploadTarget(value: unknown): GalleryPhotoUploadTarget {
  if (!isRecord(value)) {
    throw new Error("Backend zwrócił niepoprawny obiekt uploadu.");
  }

  const photoId = asString(pick(value, ["PhotoID", "photo_id"]));
  const putUrl = asString(pick(value, ["PutURL", "put_url"]));

  if (!photoId || !putUrl) {
    const fields = Object.keys(value).join(", ") || "brak pól";

    throw new Error(
      `Backend nie zwrócił PhotoID albo PutURL. Pola odpowiedzi: ${fields}.`,
    );
  }

  return {
    photo_id: photoId,
    put_url: putUrl,
    object_key: asString(pick(value, ["ObjectKey", "object_key"])),
  };
}

function extractArray(response: unknown, keys: string[]) {
  if (!isRecord(response)) {
    return [];
  }

  for (const key of keys) {
    const value = pick(response, [key]);

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export async function listGalleries() {
  const response = await apiFetch<unknown>("/api/galleries");
  const items = extractArray(response, ["Galleries", "galleries"]);

  return items.map(normalizeGallery);
}

export async function createGallery(input: UpsertGalleryInput) {
  const response = await apiFetch<unknown>("/api/galleries", {
    method: "POST",
    json: input,
  });

  return normalizeGallery(response);
}

export async function getGallery(galleryId: string): Promise<GalleryDetail> {
  const response = await apiFetch<unknown>(
    `/api/galleries/${encodeURIComponent(galleryId)}`,
  );

  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź galerii.");
  }

  const gallery = normalizeGallery(pick(response, ["Gallery", "gallery"]));
  const photos = extractArray(response, ["Photos", "photos"]).map(
    normalizeGalleryPhoto,
  );

  return {
    gallery,
    photos,
  };
}

export async function updateGallery(
  galleryId: string,
  input: UpsertGalleryInput,
) {
  const response = await apiFetch<unknown>(
    `/api/galleries/${encodeURIComponent(galleryId)}`,
    {
      method: "PUT",
      json: input,
    },
  );

  return normalizeGallery(response);
}

export function deleteGallery(galleryId: string) {
  return apiFetch<void>(`/api/galleries/${encodeURIComponent(galleryId)}`, {
    method: "DELETE",
  });
}

export async function presignGalleryPhotos(
  galleryId: string,
  input: PresignGalleryPhotosInput,
) {
  const response = await apiFetch<unknown>(
    `/api/galleries/${encodeURIComponent(galleryId)}/photos/presign`,
    {
      method: "POST",
      json: input,
    },
  );

  const uploads = extractArray(response, ["Uploads", "uploads"]).map(
    normalizeUploadTarget,
  );

  if (uploads.length !== input.files.length) {
    throw new Error(
      `Backend zwrócił ${uploads.length} presignów dla ${input.files.length} plików.`,
    );
  }

  return uploads;
}

export async function completeGalleryPhoto(galleryId: string, photoId: string) {
  const response = await apiFetch<unknown>(
    `/api/galleries/${encodeURIComponent(
      galleryId,
    )}/photos/${encodeURIComponent(photoId)}/complete`,
    {
      method: "POST",
    },
  );

  return normalizeGalleryPhoto(response);
}

export function deleteGalleryPhoto(galleryId: string, photoId: string) {
  return apiFetch<void>(
    `/api/galleries/${encodeURIComponent(
      galleryId,
    )}/photos/${encodeURIComponent(photoId)}`,
    {
      method: "DELETE",
    },
  );
}

export async function getPublicPhotographer(
  username: string,
): Promise<PublicPhotographerPageData> {
  const response = await apiFetch<unknown>(
    `/api/public/photographers/${encodeURIComponent(username)}`,
  );

  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź publicznego profilu.");
  }

  const profile = normalizeProfile(pick(response, ["Profile", "profile"]));

  const galleries = extractArray(response, ["Galleries", "galleries"]).map(
    normalizeGallery,
  );

  return {
    profile,
    galleries,
  };
}

export async function getPublicGallery(
  username: string,
  slug: string,
): Promise<PublicGalleryPageData> {
  const response = await apiFetch<unknown>(
    `/api/public/photographers/${encodeURIComponent(
      username,
    )}/galleries/${encodeURIComponent(slug)}`,
  );

  if (!isRecord(response)) {
    throw new Error("Backend zwrócił pustą odpowiedź publicznej galerii.");
  }

  const profile = normalizeProfile(pick(response, ["Profile", "profile"]));
  const gallery = normalizeGallery(pick(response, ["Gallery", "gallery"]));
  const photos = extractArray(response, ["Photos", "photos"]).map(
    normalizeGalleryPhoto,
  );

  return {
    profile,
    gallery,
    photos,
  };
}
