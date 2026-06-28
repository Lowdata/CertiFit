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

**Current Phase**: **Phase 2 (AI Pre-Interview Engine & Advanced Matching)**
**Previous Phase**: **Phase 1 (Dashboards, Company Profiles, and Core ATS Polish) - COMPLETED**

### Phase 1: ATS Core & Dashboards (COMPLETED)
- **Candidate Dashboard**: Profile completion (Resume, GitHub, LinkedIn), Job browsing, Application tracking, Trust Score visualization.
- **Recruiter Dashboard**: Analytics (Open Jobs, Applications, Candidates, Interviews Today, Avg Fit Score, Pipeline).
- **Company Profile**: Logo, Website, Industry, Size. Jobs inherit Company branding.
- **Job Management**: Internal vs External Apply (LinkedIn, Greenhouse, etc).
- **Screening Questions**: Custom Yes/No, Text, and Link questions during job creation and application.
- **Quality & Security**: Migrated to secure `HttpOnly` cookie auth.

### Phase 2: AI Pre-Interview Engine & Advanced Matching (Current)
- **Live Video Interview**: Browser camera/mic recording.
- **Candidate AI Screening**: Interview Copilot where candidates answer initial questions.
- **Match Matrix Backend**: LLM processing of candidates' skills and screening answers.
- **Recruiter Review UI**: Video player with timeline-synced AI notes.

### Phase 3: Analytics & Collaboration
- **Team Hiring**: Permissions for Owner, Admin, Recruiter, Hiring Manager.
- **Candidate Comparison**: Side-by-side matrices (Fit, Trust, Interview scores).
- **Hiring Pipeline**: Funnel visualization and acceptance rates.

### Phase 4: Integrations
- Calendar (Google Meet/Zoom), Email automation, HRMS/ATS integrations.

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
