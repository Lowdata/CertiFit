# CertiFit Frontend Design

Last audited: 2026-06-29

This is the canonical frontend system design document.

## Project Overview

CertiFit Frontend is a Next.js (App Router) web application designed to connect with the FastAPI CertiFit backend. It provides the user interface for candidates and recruiters.

CertiFit is evolving into an **AI Hiring Intelligence Platform**.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / shadcn/ui
- **Icons**: Lucide React
- **HTTP Client**: native `fetch` / axios

## Phased Development Roadmap

**Current Phase**: **Phase 2 (AI Screening Platform)**
**Previous Phase**: **Phase 1 (Completed)**

### Phase 1: ATS Core & Dashboards (COMPLETED)
- **Candidate Dashboard**: Profile completion (Resume, GitHub, LinkedIn), Job browsing, Application tracking, Trust Score visualization.
- **Recruiter Dashboard**: Analytics, Candidate comparison, Trust engine, Interview copilot.
- **Company Profile**: Logo, Website, Industry, Size. Jobs inherit Company branding.
- **Job Management**: Internal vs External Apply.
- **Screening Questions**: Custom Yes/No, Text, and Link questions during job creation and application.
- **Quality & Security**: Migrated to secure `HttpOnly` cookie auth.

### Phase 2: AI Screening Platform (Current)
- **Pre-Interview Check**: System/environment validation and rules acknowledgment.
- **Assessment Room**: Locked down environment (Fullscreen API, tab switch detection, restricted keyboard shortcuts) capturing Integrity Signals.
- **AI Question Engine**: Dynamic question generation (Technical, Behavioral) with 30s prep and 2min recording constraints.
- **Live Speech Recognition**: Chunked question-by-question uploads and Whisper API transcriptions.
- **AI Report**: Recommendations (Hire/Maybe/Reject) + Strengths, Weaknesses, Risk Areas. Includes a separated **Interview Integrity Score** based on behavioral signals.

### Phase 3: Hiring Intelligence
- **Candidate 360°**: Unified intelligence profile combining Resume, LinkedIn, GitHub, Interview, Trust, Projects.
- **Candidate Timeline**: Journey from Applied -> Hired.
- **Hiring Decision Engine**: Recruiter sees Fit, Trust, Interview, Risk, Leadership, Ownership, Recommendation (instead of a single score).
- **Candidate Comparison**: Detailed side-by-side matrices (Fit, Trust, Experience, Communication, etc.).
- **Talent Pool**: Searchable database of all parsed candidates. Recruiters can filter by verified skills, Trust Score, GitHub activity, and invite candidates directly to jobs.

### Phase 4: Collaboration
- Permissions, Comments, Mentions, Shared Notes, Offer Approval.

### Phase 5: Enterprise
- Integrations: Greenhouse, Lever, Workday, Ashby, Slack, Teams, Google Calendar, Outlook, Zoom, Meet.

### Phase 6: Analytics
- Company-wide hiring funnel, Time to hire, Source effectiveness, Interview pass rate, Trust score distribution, Recruiter performance.

### Additional Features to Build
- **AI Resume Rewrite**: Suggests improvements when candidate uploads resume.
- **AI Mock Interview**: Practice interviews for candidates before applying.
- **Recruiter Question Builder**: Create MCQ, Text, Video, Coding, File Upload questions.
- **AI Job Description Optimizer**: Detects missing skills, bias, salary mismatch.
- **AI Hiring Assistant**: Natural language querying over hiring data (e.g., "Show backend engineers with AWS above 80 Trust").
- **AI Skill Graph**: Tracks Verified, Claimed, Unsupported, Learning, Strength for every candidate.

## Engineering & Quality Standards

**Strict Testing Mandate**:
- EVERY feature must have comprehensive Unit Tests and Flow-Based Tests.
- Pre-commit testing is mandatory: no code is committed unless all tests pass and verify the feature is fully working.

**Security Mandate**:
- Both frontend and backend must be audited for security vulnerabilities on every phase.
- Global rate limiting, auth token hardening (`HttpOnly` cookies), and upload sanitization must be strictly enforced.

## Core Component Architecture

- `src/components/candidate`: UIs for candidate profile, job discovery, application status.
- `src/components/recruiter`: UIs for job creation, candidate review, AI Copilot, hiring dashboard.
- `src/components/interview`: (Future) UI for WebRTC/MediaRecorder for the AI interview.

## Known Limitations & Issues
- None currently flagged.
