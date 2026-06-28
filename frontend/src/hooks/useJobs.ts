import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Job, CreateJobRequest, JobListResponse } from "@/types/job";

export function useJobs(params?: {
  page?: number;
  page_size?: number;
  title?: string;
  company?: string;
}) {
  return useQuery<JobListResponse>({
    queryKey: ["jobs", params],
    queryFn: async () => {
      const res = await api.get("/jobs", { params });
      return res.data;
    },
  });
}

export function useJob(id: number) {
  return useQuery<Job>({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      const res = await api.post("/jobs", data);
      return res.data as Job;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: number) => {
      const res = await api.post(`/jobs/${jobId}/apply`);
      return res.data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}