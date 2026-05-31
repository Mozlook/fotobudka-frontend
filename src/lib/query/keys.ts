export const queryKeys = {
  me: ["me"] as const,

  sessions: {
    all: ["sessions"] as const,
    list: () => ["sessions", "list"] as const,
    detail: (sessionId: string) => ["sessions", sessionId] as const,
  },

  client: {
    session: (sessionId: string) => ["client-session", sessionId] as const,

    photos: (sessionId: string) =>
      ["client-session", sessionId, "photos"] as const,

    proofUrl: (photoId: string) =>
      ["client-photo", photoId, "proof-url"] as const,

    download: (sessionId: string) =>
      ["client-session", sessionId, "download"] as const,
  },

  portfolio: {
    all: ["portfolio"] as const,
    galleries: () => ["portfolio", "galleries"] as const,
    gallery: (galleryId: string) =>
      ["portfolio", "galleries", galleryId] as const,

    publicProfile: (username: string) =>
      ["portfolio", "public-profile", username] as const,

    publicGallery: (username: string, slug: string) =>
      ["portfolio", "public-gallery", username, slug] as const,
    featuredGalleries: (limit: number) =>
      ["portfolio", "featured-galleries", limit] as const,
  },
};
