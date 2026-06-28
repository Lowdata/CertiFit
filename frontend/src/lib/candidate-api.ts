import api from "./api";
import { ParsedCandidate, NormalizedProfile } from "@/types/candidate";

export interface GithubProfile {
  login: string;
  avatar_url: string;
  public_repos: number;
  name?: string | null;
  bio?: string | null;
  [key: string]: unknown;
}

export interface LinkedinProfile {
  headline?: string | null;
  positions?: unknown[];
  education?: unknown[];
  certifications?: unknown[];
  [key: string]: unknown;
}

export interface CandidateProfileResponse {
  id: number;
  resume_file_name: string;
  parsed_candidate: ParsedCandidate | null;
  github_profile: GithubProfile | null;
  linkedin_profile: LinkedinProfile | null;
  created_at: string;
  updated_at: string;
}

export interface NormalizedProfileResponse {
  id: number;
  normalized_profile: Omit<NormalizedProfile, "confidence_score">;
}

export interface CandidateTrustResponse {
  id: number;
  trust_score: {
    missing_evidence: string[];
    recommendations: string;
  };
}

export const candidateApi = {
  // Upload resume
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    
    const response = await api.post("/candidates/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get base profile (parsed text from resume and social links)
  getProfile: async (): Promise<CandidateProfileResponse> => {
    const response = await api.get("/candidates/me");
    return response.data;
  },

  // Get normalized/analyzed profile (without confidence/trust scores)
  getNormalizedProfile: async (): Promise<NormalizedProfileResponse> => {
    const response = await api.get("/candidates/me/profile");
    return response.data;
  },

  // Upload GitHub link
  uploadGithub: async (identifier: string) => {
    const response = await api.post("/candidates/github", { identifier });
    return response.data;
  },

  // Force rebuild of AI intelligence
  rebuildProfile: async () => {
    const response = await api.post("/candidates/me/profile/rebuild");
    return response.data;
  },

  // Upload LinkedIn PDF
  uploadLinkedin: async (file: File) => {
    const formData = new FormData();
    formData.append("profile", file);
    const response = await api.post("/candidates/linkedin", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
