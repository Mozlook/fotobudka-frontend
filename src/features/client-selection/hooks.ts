import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiError } from "../../lib/notifications/apiToast";
import { queryKeys } from "../../lib/query/keys";
import {
  getClientProofUrl,
  listClientPhotos,
  submitClientSelection,
  updateClientSelections,
} from "./api";
import type { UpdateSelectionsInput } from "./types";

export const CLIENT_PHOTOS_PAGE_SIZE = 60;

export function useClientPhotosInfiniteQuery(sessionId?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.client.photos(sessionId ?? ""),
    enabled: Boolean(sessionId),
    initialPageParam: 0,

    queryFn: ({ pageParam }) =>
      listClientPhotos({
        sessionId: sessionId!,
        offset: Number(pageParam) || 0,
        limit: CLIENT_PHOTOS_PAGE_SIZE,
      }),

    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) {
        return undefined;
      }

      return lastPage.next_offset;
    },

    staleTime: 30_000,
  });
}

export function useProofUrlQuery(
  photoId?: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: queryKeys.client.proofUrl(photoId ?? ""),
    queryFn: () => getClientProofUrl(photoId!),
    enabled: Boolean(photoId) && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}

export function useUpdateClientSelectionsMutation(sessionId: string) {
  return useMutation({
    mutationFn: (input: UpdateSelectionsInput) =>
      updateClientSelections(sessionId, input.items),

    onError: (error) => {
      toastApiError(error, "Nie udało się zapisać wyboru.");
    },
  });
}

export function useSubmitSelectionMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitClientSelection(sessionId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.client.photos(sessionId),
      });

      toast.success("Wybór został zatwierdzony.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się zatwierdzić wyboru.");
    },
  });
}
