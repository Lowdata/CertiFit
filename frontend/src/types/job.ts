export interface Job {
  id: number;
  title: string;
  company: string;
  raw_jd: string;
  parsed_jd_json: ParsedJD | null;
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
  raw_jd: string;
}

export interface JobListResponse {
  total: number;
  page: number;
  page_size: number;
  data: Job[];
}