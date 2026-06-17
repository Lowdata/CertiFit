export interface ParsedCandidate {
  name: string;
  email: string;
  current_role: string;
  skills: string[];
  years_experience: number;
  work_history: WorkHistory[];
  education: Education[];
  certifications: string[];
}

export interface WorkHistory {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
}

export interface Education {
  institution: string;
  degree: string;
  year: number | null;
}

export interface NormalizedProfile {
  name: string;
  headline: string;
  years_experience: number;
  verified_skills: string[];
  skill_confidence: Record<string, number>;
  evidence_map: Record<string, string[]>;
  confidence_score: number;
}

export interface CandidateReport {
  candidate_id: number;
  application_id: number;
  match_score: number;
  composite_score: number;
  trust_score: number;
  strengths: string[];
  gaps: string[];
  normalized_profile: NormalizedProfile;
  behavioral_insights: Record<string, string>;
  interview_plan: import("./application").InterviewPlan;
}