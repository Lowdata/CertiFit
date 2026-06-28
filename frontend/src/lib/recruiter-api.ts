import api from "./api";

// ── Types ──

export interface RecruiterJob {
  id: number;
  title: string;
  company: string;
  status: "active" | "paused" | "closed";
  created_at: string;
}

export interface RecruiterJobDetail {
  id: number;
  title: string;
  company: string;
  status: "active" | "paused" | "closed";
  raw_jd: string;
  parsed_jd: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RecruiterJobListResponse {
  total: number;
  page: number;
  page_size: number;
  data: RecruiterJob[];
}

export interface CandidateInfo {
  id: number;
  resume_file_name: string;
  parsed_candidate: Record<string, unknown> | null;
}

export interface JobApplication {
  id: number;
  job_id: number;
  candidate_id: number;
  candidate: CandidateInfo;
  status: string;
  match_score: number;
  match_summary: string;
  strengths: string[];
  gaps: string[];
  applied_at: string;
  updated_at: string;
}

export interface JobApplicationListResponse {
  job_id: number;
  data: JobApplication[];
}

export interface CandidateReport {
  application_id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  fit_score: number;
  trust_score: number;
  composite_score: number;
  score_explanations: Record<string, unknown>;
  strengths: string[];
  concerns: string[];
  unsupported_claims: string[];
  evidence_map: Record<string, unknown>;
  skill_confidence: Record<string, number>;
  verified_skills: string[];
  confidence_score: number;
  claims: Array<{ skill: string; verified: boolean; source: string }>;
  claims_summary: {
    total_claims: number;
    verified_count: number;
    unverified_count: number;
    verified_skills: string[];
    unverified_skills: string[];
  };
  interview_plan: Record<string, unknown>;
}

export interface InterviewPlanResponse {
  application_id: number;
  job_id: number;
  candidate_id: number;
  interview_plan: Record<string, unknown>;
}

// ── API ──

export const recruiterApi = {
  // Jobs
  getMyJobs: async (params?: { page?: number; page_size?: number }): Promise<RecruiterJobListResponse> => {
    const res = await api.get("/jobs/my-jobs", { params });
    return res.data;
  },

  getJob: async (id: number): Promise<RecruiterJobDetail> => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  createJob: async (data: { title: string; company: string; jd: string; apply_type?: "internal" | "external"; external_apply_url?: string | null }) => {
    const res = await api.post("/jobs", data);
    return res.data;
  },

  deleteJob: async (id: number) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },

  reparseJob: async (id: number) => {
    const res = await api.post(`/jobs/${id}/reparse`);
    return res.data;
  },

  updateJobStatus: async (jobId: number, status: string): Promise<RecruiterJobDetail> => {
    const res = await api.patch(`/jobs/${jobId}/status`, { status });
    return res.data;
  },

  parseJD: async (jd: string) => {
    const res = await api.post("/jobs/parse", { jd });
    return res.data;
  },

  // Applications
  getJobApplications: async (jobId: number): Promise<JobApplicationListResponse> => {
    const res = await api.get(`/jobs/${jobId}/applications`);
    return res.data;
  },

  updateApplicationStatus: async (applicationId: number, status: string) => {
    const res = await api.patch(`/applications/${applicationId}/status`, { status });
    return res.data;
  },

  getCandidateReport: async (applicationId: number): Promise<CandidateReport> => {
    const res = await api.get(`/applications/${applicationId}/candidate-report`);
    return res.data;
  },

  // Interview
  generateInterviewPlan: async (applicationId: number): Promise<InterviewPlanResponse> => {
    const res = await api.post(`/interview/${applicationId}/interview-plan`);
    return res.data;
  },
};
