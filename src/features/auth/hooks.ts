import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ApiError } from "../../lib/api/client";
import { toastApiError } from "../../lib/notifications/apiToast";
import { queryKeys } from "../../lib/query/keys";
import { getMeProfile, logout, updateProfile } from "./api";
import type { MeProfileResult, UpsertPhotographerProfileInput } from "./types";

export function useMeProfileQuery() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMeProfile,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,

    onSuccess: () => {
      queryClient.clear();
      toast.success("Wylogowano.");
      navigate("/login", { replace: true });
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się wylogować.");
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertPhotographerProfileInput) => updateProfile(input),

    onSuccess: (profile) => {
      queryClient.setQueryData<MeProfileResult>(queryKeys.me, {
        profile,
        hasProfile: true,
      });

      toast.success("Profil został zapisany.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się zapisać profilu.");
    },
  });
}
