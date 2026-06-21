# CertiFit - System Architecture and Feature Documentation

## 1. System Overview
**Project Name**: CertiFit
**Purpose**: An AI-powered recruitment platform designed to match candidates with job descriptions, normalize profiles from various sources (resumes, GitHub, LinkedIn), evaluate candidate trust via observable evidence, and generate personalized interview plans.
**Tech Stack**: 
- **Backend**: FastAPI, Python 3.14+
- **Database**: PostgreSQL (via SQLAlchemy 2.x and Alembic migrations)
- **Authentication**: JWT auth via `python-jose`, password hashing via `pwdlib`
- **AI/LLM**: Google Gemini (via `google-genai`) using `safe_gemini_call` wrapper for reliability
- **File Parsing**: PyMuPDF (PDFs), python-docx (DOCX)

## 2. Core Entities and Data Models
- **Users**: Base entity. `user_type=1` (Recruiter), `user_type=2` (Candidate).
- **Candidates**: Tied 1:1 to Users. Stores raw resume text, parsed candidate JSON, GitHub profile JSON, and LinkedIn profile JSON.
- **Jobs**: Owned by Recruiters. Stores raw JD text and parsed JD JSON.
- **Applications**: Links Candidates to Jobs. Stores `match_score`, `composite_score`, `status`, `strengths_json`, and `gaps_json`.

## 3. Implemented Features (What is Done)
*The following features make up the 100% completed MVP scope of CertiFit.*

### 3.1 Authentication & Authorization
- **Status**: Completed
- **Details**: JWT-based login and registration. Endpoints are strictly scoped using dependency injection (`get_current_recruiter`, `get_current_candidate`).

### 3.2 Job Description (JD) Parsing
- **Status**: Completed
- **Details**: Recruiters can create jobs with raw JD text. Gemini parses this into structured JSON containing required skills, inferred skills, seniority, and tech stack. 

### 3.3 Multi-Source Profile Processing
- **Status**: Completed
- **Details**: 
  - **Resume Upload (`/candidates/upload`)**: Parses PDF/DOCX to extract text and links, passes to Gemini to create a structured JSON profile.
  - **LinkedIn Ingestion (`/candidates/linkedin`)**: Deterministically parses LinkedIn profile PDFs using PyMuPDF to extract headline, positions, education, and certifications.
  - **GitHub Ingestion (`/candidates/github`)**: Fetches public GitHub API data (repos, languages, recent events) using a candidate's username.

### 3.4 Profile Normalization
- **Status**: Completed
- **Details**: `profile_service.py` runs on every upload to merge evidence from the Resume, LinkedIn, and GitHub into a cohesive `normalized_profile_json`. It builds an `evidence_map`, calculates `skill_confidence`, and identifies `verified_skills`.

### 3.5 Deterministic Ranking Engine
- **Status**: Completed
- **Details**: Matches the candidate's parsed JSON against the job's parsed JSON. Calculates scores based on Required Skills (50%), Inferred Skills (10%), Tech Stack (25%), and Experience (15%) to yield a deterministic out-of-100 `fit_score`. Note: This currently uses raw JSONs; moving to normalized profiles is on the roadmap.

### 3.6 Intelligence Layer: Trust Score Engine
- **Status**: Completed
- **Details**: Calculates a 0-100 Trust Score based on hard, observable evidence rather than black-box AI.
  - **Verification (40%)**: Cross-checks dates, titles, and basic skill claims.
  - **Activity (15%)**: Assesses GitHub push events and recency.
  - **Career (15%)**: Looks for logical career progression and penalizes unexplained gaps.
  - **Ownership (15%)**: Analyzes non-forked GitHub repos and stars.
  - **Learning (10%)**: Validates claimed certifications.
  - **LLM Review (5%)**: Gemini provides a maximum 5-point bump based on consistency. If Gemini fails/timeouts, it falls back safely.
  - **Visibility**: Trust Score is INTERNAL ONLY. Candidates receive a sanitized payload highlighting missing evidence to improve their profile completeness.

### 3.7 Intelligence Layer: Behavioral Insights
- **Status**: Completed
- **Details**: Extracted via Gemini during the trust score review. Evaluates observable traits like Initiative, Communication Ability, and Leadership based on the candidate's history, bypassing psychometric testing.

### 3.8 Interview Copilot
- **Status**: Completed
- **Details**: Generates a customized interview plan (`/applications/{id}/interview-plan`) combining deterministic rules and LLM enrichment.
  - Includes **Technical**, **Behavioral**, **Verification**, **Project**, **Risk**, and **Leadership** questions.
  - Risk questions specifically target unsupported claims found during the Trust Score calculation.

## 4. Future Roadmap & Pending Features (What is Left)
*These features are out-of-scope for the MVP but are logged for future product iteration.*

### 4.1 Feature Additions
- **[Pending] Candidate Manual Profile Editing**: Currently, profiles are entirely derived from uploads. Candidates cannot manually edit individual fields in their profile.
- **[Pending] Recruiter-Scoped Candidate Detail Endpoint**: A dedicated endpoint to fetch a candidate profile based strictly on an application relationship (currently achievable implicitly via `/applications/{id}/candidate-report`).
- **[Pending] Ranking Update**: Transition the Ranking Engine to utilize the newly implemented `normalized_profile_json` instead of the raw `parsed_candidate_json` while preserving its deterministic MVP behavior.

### 4.2 Production Hardening & Security
- **[Pending] GitHub API Authentication**: The GitHub service relies on unauthenticated API calls, which are highly susceptible to rate-limiting at scale.
- **[Pending] Global Rate Limiting**: Required across all endpoints to prevent abuse.
- **[Pending] Application Security**: refine the token/session policy, and implement strict anti-malware upload scanning for PDFs and DOCXs.

---
*Document automatically generated to serve as an optimized context layer for Retrieval-Augmented Generation (RAG) models, capturing the complete CertiFit ecosystem as of the current build.*
