import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruiterApi, RecruiterJobListResponse, RecruiterJobDetail, JobApplicationListResponse, CandidateReport, InterviewPlanResponse } from "@/lib/recruiter-api";

export const RECRUITER_QUERY_KEYS = {
  myJobs: ["recruiter-my-jobs"],
  jobDetail: (id: number) => ["recruiter-job", id],
  jobApplications: (id: number) => ["recruiter-job-applications", id],
  candidateReport: (id: number) => ["recruiter-candidate-report", id],
};

export function useRecruiterJobs(params?: { page?: number; page_size?: number }) {
  return useQuery<RecruiterJobListResponse>({
    queryKey: [...RECRUITER_QUERY_KEYS.myJobs, params],
    queryFn: () => recruiterApi.getMyJobs(params),
  });
}

export function useRecruiterJob(id: number) {
  return useQuery<RecruiterJobDetail>({
    queryKey: RECRUITER_QUERY_KEYS.jobDetail(id),
    queryFn: () => recruiterApi.getJob(id),
    enabled: !!id,
  });
}

export function useCreateRecruiterJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recruiterApi.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITER_QUERY_KEYS.myJobs });
    },
  });
}

export function useDeleteRecruiterJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recruiterApi.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITER_QUERY_KEYS.myJobs });
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: number; status: string }) =>
      recruiterApi.updateJobStatus(jobId, status),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: RECRUITER_QUERY_KEYS.myJobs });
      queryClient.invalidateQueries({ queryKey: RECRUITER_QUERY_KEYS.jobDetail(jobId) });
    },
  });
}

export function useReparseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recruiterApi.reparseJob,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: RECRUITER_QUERY_KEYS.jobDetail(id) });
    },
  });
}

export function useJobApplications(jobId: number) {
  return useQuery<JobApplicationListResponse>({
    queryKey: RECRUITER_QUERY_KEYS.jobApplications(jobId),
    queryFn: () => recruiterApi.getJobApplications(jobId),
    enabled: !!jobId,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: string }) =>
      recruiterApi.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-job-applications"] });
    },
  });
}

export function useCandidateReport(applicationId: number) {
  return useQuery<CandidateReport>({
    queryKey: RECRUITER_QUERY_KEYS.candidateReport(applicationId),
    queryFn: () => recruiterApi.getCandidateReport(applicationId),
    enabled: !!applicationId,
  });
}

export function useGenerateInterviewPlan() {
  return useMutation({
    mutationFn: recruiterApi.generateInterviewPlan,
  });
}
