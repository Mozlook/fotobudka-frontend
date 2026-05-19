import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../lib/api/client";
import { queryKeys } from "../../lib/query/keys";
import { getClientDeliveryDownload } from "./api";

export function useClientDeliveryDownloadQuery(
  sessionId?: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: queryKeys.client.download(sessionId ?? ""),
    queryFn: () => getClientDeliveryDownload(sessionId!),
    enabled: Boolean(sessionId) && (options?.enabled ?? true),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        [401, 403, 404, 409].includes(error.status)
      ) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
