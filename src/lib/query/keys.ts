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
    download: (sessionId: string) =>
      ["client-session", sessionId, "download"] as const,
  },
};
