import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiError } from "../../lib/notifications/apiToast";
import { queryKeys } from "../../lib/query/keys";
import {
  createGallery,
  deleteGallery,
  deleteGalleryPhoto,
  getGallery,
  getPublicGallery,
  getPublicPhotographer,
  listGalleries,
  updateGallery,
  getFeaturedPublicGalleries,
} from "./api";
import type { UpsertGalleryInput } from "./types";

export function useGalleriesQuery() {
  return useQuery({
    queryKey: queryKeys.portfolio.galleries(),
    queryFn: listGalleries,
  });
}

export function useGalleryQuery(galleryId?: string) {
  return useQuery({
    queryKey: queryKeys.portfolio.gallery(galleryId ?? ""),
    queryFn: () => getGallery(galleryId!),
    enabled: Boolean(galleryId),
  });
}

export function useCreateGalleryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertGalleryInput) => createGallery(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.all,
      });

      toast.success("Galeria została utworzona.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się utworzyć galerii.");
    },
  });
}

export function useUpdateGalleryMutation(galleryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertGalleryInput) => updateGallery(galleryId, input),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio.gallery(galleryId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio.galleries(),
        }),
      ]);

      toast.success("Galeria została zapisana.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się zapisać galerii.");
    },
  });
}

export function useDeleteGalleryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (galleryId: string) => deleteGallery(galleryId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.all,
      });

      toast.success("Galeria została usunięta.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się usunąć galerii.");
    },
  });
}

export function useDeleteGalleryPhotoMutation(galleryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => deleteGalleryPhoto(galleryId, photoId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio.gallery(galleryId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio.galleries(),
        }),
      ]);

      toast.success("Zdjęcie zostało usunięte.");
    },

    onError: (error) => {
      toastApiError(error, "Nie udało się usunąć zdjęcia.");
    },
  });
}

export function usePublicPhotographerQuery(username?: string) {
  return useQuery({
    queryKey: queryKeys.portfolio.publicProfile(username ?? ""),
    queryFn: () => getPublicPhotographer(username!),
    enabled: Boolean(username),
  });
}

export function usePublicGalleryQuery(username?: string, slug?: string) {
  return useQuery({
    queryKey: queryKeys.portfolio.publicGallery(username ?? "", slug ?? ""),
    queryFn: () => getPublicGallery(username!, slug!),
    enabled: Boolean(username) && Boolean(slug),
  });
}

export function useFeaturedPublicGalleriesQuery(limit = 4) {
  return useQuery({
    queryKey: queryKeys.portfolio.featuredGalleries(limit),
    queryFn: () => getFeaturedPublicGalleries(limit),
    staleTime: 60_000,
  });
}
