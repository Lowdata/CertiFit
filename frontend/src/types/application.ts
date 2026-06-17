export interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  status: "applied" | "shortlisted" | "rejected" | "hired";
  match_score: number | null;
  composite_score: number | null;
  strengths_json: string[] | null;
  gaps_json: string[] | null;
  created_at: string;
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