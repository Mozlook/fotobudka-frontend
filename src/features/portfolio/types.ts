export type Gallery = {
  id: string;
  title: string;
  slug: string;
  is_public: boolean;
  photo_count: number;
  cover_url?: string;
  created_at?: string;
};

export type GalleryPhoto = {
  id: string;
  image_url?: string;
  width: number;
  height: number;
  sort_order: number;
  created_at?: string;
};

export type GalleryDetail = {
  gallery: Gallery;
  photos: GalleryPhoto[];
};

export type UpsertGalleryInput = {
  title: string;
  slug: string;
  is_public: boolean;
};

export type PresignGalleryPhotoFile = {
  filename: string;
  mime_type: string;
  size_bytes: number;
};

export type PresignGalleryPhotosInput = {
  files: PresignGalleryPhotoFile[];
};

export type GalleryPhotoUploadTarget = {
  photo_id: string;
  put_url: string;
  object_key?: string;
};

export type PublicProfile = {
  username: string;
  display_name: string;
  bio: string;
  social_links: Record<string, string>;
};

export type PublicPhotographerPageData = {
  profile: PublicProfile;
  galleries: Gallery[];
};

export type PublicGalleryPageData = {
  profile: PublicProfile;
  gallery: Gallery;
  photos: GalleryPhoto[];
};
