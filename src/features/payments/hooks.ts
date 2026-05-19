import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiError } from "../../lib/notifications/apiToast";
import { queryKeys } from "../../lib/query/keys";
import { markSessionPaid } from "./api";

export function useMarkSessionPaidMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markSessionPaid(sessionId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.detail(sessionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.all,
        }),
      ]);

      toast.success("Płatność została oznaczona jako opłacona.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się oznaczyć płatności jako opłaconej.");
    },
  });
}
