import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { UploadImageDTO } from '../types';
import { imageApi } from '../api/imageApi';

const IMAGES_QUERY_KEY = (patientId: string) => ['images', patientId];

export function usePatientImages(patientId: string) {
  return useQuery({
    queryKey: IMAGES_QUERY_KEY(patientId),
    queryFn: () => imageApi.getImagesByPatient(patientId),
    staleTime: 1000 * 90,
    gcTime: 1000 * 60 * 10,
    enabled: !!patientId,
  });
}

// NEW: Get total image count across all patients
export function useTotalImageCount() {
  return useQuery({
    queryKey: ['images-count'],
    queryFn: () => imageApi.getTotalImageCount(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadImageDTO) => imageApi.uploadImage(data),
    onSuccess: (newImage) => {
      queryClient.invalidateQueries({
        queryKey: IMAGES_QUERY_KEY(newImage.patientID),
      });
      // Also invalidate the total count so the dashboard updates
      queryClient.invalidateQueries({
        queryKey: ['images-count'],
      });
    },
  });
}

export function useClassifyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      imageId,
      imageType,
      diseaseType,
    }: {
      imageId: string;
      imageType: string;
      diseaseType: string;
    }) => imageApi.classifyImage(imageId, imageType, diseaseType),
    onSuccess: (updatedImage) => {
      queryClient.invalidateQueries({
        queryKey: IMAGES_QUERY_KEY(updatedImage.patientID),
      });
    },
  });
}

export function useUpdateImageNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, note }: { imageId: string; note: string }) =>
      imageApi.updateNote(imageId, note),
    onSuccess: (updatedImage) => {
      queryClient.invalidateQueries({ queryKey: IMAGES_QUERY_KEY(updatedImage.patientID) });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => imageApi.deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['images'],
      });
      // Also invalidate the total count so the dashboard updates
      queryClient.invalidateQueries({
        queryKey: ['images-count'],
      });
    },
  });
}