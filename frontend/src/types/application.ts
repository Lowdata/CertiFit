export interface Application {
  id: number;
  job_id: number;
  job_title?: string;
  company?: string;
  candidate_id: number;
  status: "applied" | "shortlisted" | "rejected" | "hired" | "interview" | "reviewed";
  match_score: number | null;
  match_summary: string | null;
  composite_score: number | null;
  strengths: string[] | null;
  gaps: string[] | null;
  screening_answers?: Record<string, string>;
  applied_at: string;
  updated_at: string;
}

export interface InterviewPlan {
  technical: InterviewQuestion[];
  behavioral: InterviewQuestion[];
  verification: InterviewQuestion[];
  project: InterviewQuestion[];
  risk: InterviewQuestion[];
  leadership: InterviewQuestion[];
}

export interface InterviewQuestion {
  question: string;
  rationale: string;
  difficulty?: "easy" | "medium" | "hard";
}