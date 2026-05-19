import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/keys";
import { getPhotographerSelectionOverview } from "./api";

export function usePhotographerSelectionOverviewQuery(sessionId?: string) {
  return useQuery({
    queryKey: [...queryKeys.sessions.detail(sessionId ?? ""), "selection"],
    queryFn: () => getPhotographerSelectionOverview(sessionId!),
    enabled: Boolean(sessionId),
  });
}
