import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiError } from "../../lib/notifications/apiToast";
import { queryKeys } from "../../lib/query/keys";
import { generateDeliveryZip } from "./api";

export function useGenerateDeliveryZipMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateDeliveryZip(sessionId),

    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.detail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.all,
        }),
      ]);

      toast.success(`Rozpoczęto generowanie ZIP v${result.version}.`);
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się rozpocząć generowania ZIP.");
    },
  });
}
