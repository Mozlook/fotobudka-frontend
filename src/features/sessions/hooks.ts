import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiError } from "../../lib/notifications/apiToast";
import { queryKeys } from "../../lib/query/keys";
import {
  createSession,
  getSession,
  listSessions,
  regenerateSessionAccess,
} from "./api";
import type {
  CreateSessionInput,
  CreateSessionResult,
  SessionSummary,
} from "./types";

export function useSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: listSessions,
  });
}

export function useSessionQuery(
  sessionId?: string,
  options?: {
    refetchInterval?: number | false;
  },
) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId ?? ""),
    queryFn: () => getSession(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreateSessionResult, unknown, CreateSessionInput>({
    mutationFn: async (input) => {
      const session = await createSession(input);

      try {
        const access = await regenerateSessionAccess(session.id);

        return {
          session,
          access,
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            "[sessions] Nie udało się wygenerować dostępu po utworzeniu sesji:",
            error instanceof Error ? error.message : error,
          );
        }

        return {
          session,
          access: null,
        };
      }
    },

    onSuccess: async (result) => {
      queryClient.setQueryData<SessionSummary>(
        queryKeys.sessions.detail(result.session.id),
        result.session,
      );

      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all,
      });

      if (result.access) {
        toast.success("Sesja została utworzona.");
      } else {
        toast.warning(
          "Sesja została utworzona, ale nie udało się wygenerować kodu/linku. Otwórz sesję i użyj „Regeneruj dostęp”.",
        );
      }
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się utworzyć sesji.");
    },
  });
}

export function useRegenerateSessionAccessMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => regenerateSessionAccess(sessionId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      });

      toast.success("Wygenerowano nowy kod i link.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się zregenerować dostępu.");
    },
  });
}
