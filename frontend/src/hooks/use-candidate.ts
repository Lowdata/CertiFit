import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateApi } from "@/lib/candidate-api";

export const CANDIDATE_QUERY_KEYS = {
  profile: ["candidate-profile"],
  normalized: ["candidate-normalized-profile"],
};

export function useCandidateProfile() {
  return useQuery({
    queryKey: CANDIDATE_QUERY_KEYS.profile,
    queryFn: candidateApi.getProfile,
    retry: false, // Don't retry if 404 (candidate hasn't uploaded resume yet)
  });
}

export function useCandidateNormalizedProfile() {
  return useQuery({
    queryKey: CANDIDATE_QUERY_KEYS.normalized,
    queryFn: candidateApi.getNormalizedProfile,
    retry: false,
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: candidateApi.uploadResume,
    onSuccess: () => {
      // Invalidate both profile endpoints to fetch fresh data
      queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.normalized });
    },
  });
}

export function useUploadGithub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: candidateApi.uploadGithub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.normalized });
    },
  });
}

export function useUploadLinkedin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: candidateApi.uploadLinkedin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.normalized });
    },
  });
}
