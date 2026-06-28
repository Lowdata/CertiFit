export interface ScreeningQuestion {
  id: string;
  type: "yes_no" | "text" | "link";
  question: string;
  required: boolean;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  raw_jd: string;
  parsed_jd_json: ParsedJD | null;
  apply_type: "internal" | "external";
  external_apply_url: string | null;
  screening_questions: ScreeningQuestion[];
  created_at: string;
}

export interface ParsedJD {
  required_skills: string[];
  inferred_skills: string[];
  seniority: string;
  tech_stack: string[];
}

export interface CreateJobRequest {
  title: string;
  company: string;
  jd: string;
  apply_type?: "internal" | "external";
  external_apply_url?: string | null;
  screening_questions?: ScreeningQuestion[];
}

export interface JobListResponse {
  total: number;
  page: number;
  page_size: number;
  data: Job[];
}