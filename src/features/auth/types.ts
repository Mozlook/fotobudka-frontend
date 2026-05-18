export type SocialLinks = {
  instagram: string;
  tiktok: string;
  website: string;
  facebook: string;
  behance: string;
};

export type PhotographerProfile = {
  user_id?: string;
  username: string;
  display_name: string;
  bio: string;
  social_links: SocialLinks;
  created_at?: string;
  updated_at?: string;
};

export type MeProfileResult = {
  profile: PhotographerProfile | null;
  hasProfile: boolean;
};

export type UpsertPhotographerProfileInput = {
  username: string;
  display_name: string;
  bio: string;
  social_links: SocialLinks;
};
