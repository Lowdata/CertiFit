# CertiFit - AI Hiring Operating System

## 1. System Overview
**Project Name**: CertiFit
**Purpose**: An AI Hiring Intelligence Platform. Rather than a standard ATS, CertiFit operates as an intelligence layer providing structured evidence for recruiting decisions across three pillars: finding better candidates, verifying candidates, and driving smarter hiring decisions.
**Tech Stack**: 
- **Backend**: FastAPI, Python 3.14+
- **Database**: PostgreSQL (via SQLAlchemy 2.x and Alembic migrations)
- **Authentication**: JWT auth via `python-jose`, password hashing via `pwdlib`
- **AI/LLM**: Google Gemini (via `google-genai`) using `safe_gemini_call` wrapper for reliability
- **File Parsing**: PyMuPDF (PDFs), python-docx (DOCX)

## 2. Core Architecture Pipeline

The system is designed as independent intelligence layers that evaluate evidence:

```text
Resume
        \
LinkedIn  \
GitHub ----> Normalized Profile
                 │
                 ▼
            Fit Score
                 │
                 ▼
           Trust Score
                 │
                 ▼
     Interview Copilot (question generation)
                 │
                 ▼
      AI Interview Engine (live session)
                 │
                 ▼
        Interview Evaluation
                 │
                 ▼
     Recruiter Decision Dashboard
```

## 3. Core Entities and Data Models
- **Users**: Base entity. `user_type=1` (Recruiter), `user_type=2` (Candidate).
- **Company**: (Pending) Entity associated with Recruiters. Holds Logo, Website, Industry, Size, Culture. Jobs inherit this.
- **Candidates**: Tied 1:1 to Users. Stores raw resume text, parsed candidate JSON, GitHub profile JSON, and LinkedIn profile JSON.
- **Jobs**: Owned by Recruiters. Stores raw JD text, parsed JD JSON, and applies Internal vs. External routing.
- **Applications**: Links Candidates to Jobs. Stores `match_score`, `composite_score`, `status`, `strengths_json`, and `gaps_json`.
- **AI Interviews**: (Pending) Stores Pre-Interview sessions, transcript, audio/video data, and final structured evaluation.

## 4. Implemented Features (Current State)

### 4.1 Intelligence Layers
- **Resume, LinkedIn, GitHub Parsing**: Completed. Extracts structured data via Gemini and PyMuPDF.
- **Profile Normalization**: Completed. Merges multiple sources into a single reliable evidence map (`normalized_profile_json`).
- **Fit Score (Ranking Engine)**: Completed. Deterministic ranking out of 100 based on Required Skills, Tech Stack, and Experience.
- **Trust Score**: Completed. Evaluates observable, hard evidence (Verification, Activity, Career progression, Ownership, Learning). Internal only to recruiters.
- **Behavioral Insights**: Completed. Infers traits (Initiative, Leadership, Communication) based on observable history.
- **Interview Copilot**: Completed. Generates customized technical and behavioral interview questions based on trust concerns and JD alignment.

### 4.2 ATS Basics
- **Authentication & Authorization**: Completed. JWT-based login/registration.
- **Job Management**: Completed. Recruiters can post jobs (AI parsed), pause them, and close them.
- **Candidate Applications**: Completed.

## 5. Future Roadmap & Pending Features

## 5. Development Phases & Current Status

**Current Phase**: **Phase 1 (Dashboards, Company Profiles, and Core ATS Polish)**
**Next Phase**: **Phase 2 (AI Pre-Interview Engine & Live Video)**

### Phase 1: ATS Core & Dashboards (In Progress)
- Candidate & Recruiter Dashboards
- Company Profiles and inherited branding
- External Job Application routing
- Security hardening and comprehensive test coverage

### Phase 2: AI Pre-Interview Engine (Upcoming)
- Live Browser Camera/Mic recording
- Speech-to-Text & AI Evaluation
- Timeline-synced Recruiter Review UI

### Phase 3: Analytics & Collaboration
- Team Hiring Roles
- Candidate Comparison Matrices
- Advanced Hiring Funnel Analytics

### Phase 4: Integrations
- Calendar (Google Meet/Zoom), Email, HRMS/ATS integrations

## 6. Engineering & Quality Standards

**Strict Testing Mandate**:
- EVERY feature must have comprehensive Unit Tests and Flow-Based Tests.
- Pre-commit testing is mandatory: no code is committed unless all tests pass and verify the feature is fully working.

**Security Mandate**:
- Both frontend and backend must be audited for security vulnerabilities on every phase.
- Global rate limiting, auth token hardening (e.g., HttpOnly cookies), and upload sanitization must be strictly enforced.

