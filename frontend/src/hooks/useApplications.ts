import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Application, InterviewPlan } from "@/types/application";
import { CandidateReport } from "@/types/candidate";

export function useJobApplications(jobId: number) {
  return useQuery<Application[]>({
    queryKey: ["applications", "job", jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}/applications`);
      return res.data;
    },
    enabled: !!jobId,
  });
}

export function useMyApplications() {
  return useQuery<Application[]>({
    queryKey: ["applications", "mine"],
    queryFn: async () => {
      const res = await api.get("/applications/mine");
      return res.data;
    },
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: number) => {
      const res = await api.post(`/jobs/${jobId}/apply`);
      return res.data as Application;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
  });
}

export function useCandidateReport(applicationId: number) {
  return useQuery<CandidateReport>({
    queryKey: ["report", applicationId],
    queryFn: async () => {
      const res = await api.get(`/applications/${applicationId}/candidate-report`);
      return res.data;
    },
    enabled: !!applicationId,
  });
}

export function useInterviewPlan(applicationId: number) {
  return useQuery<InterviewPlan>({
    queryKey: ["interview", applicationId],
    queryFn: async () => {
      const res = await api.post(`/applications/${applicationId}/interview-plan`);
      return res.data;
    },
    enabled: !!applicationId,
  });
}