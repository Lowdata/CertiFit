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

**Current Phase**: **Phase 1 (Dashboards, Company Profiles, and Core ATS Polish)**
**Next Phase**: **Phase 2 (AI Pre-Interview Engine & Live Video)**

### Phase 1: ATS Core & Dashboards (In Progress)
- **Candidate Dashboard**: Profile completion (Resume, GitHub, LinkedIn), Job browsing, Application tracking.
- **Recruiter Dashboard**: Analytics (Open Jobs, Applications, Candidates, Interviews Today, Avg Fit Score, Pipeline).
- **Company Profile**: Logo, Website, Industry, Size. Jobs inherit Company branding.
- **Job Management**: Internal vs External Apply (LinkedIn, Greenhouse, etc).
- **Quality & Security**: Comprehensive testing and vulnerability patching (SEC-001, SEC-003).

### Phase 2: AI Pre-Interview Engine (Upcoming)
- **Live Video Interview**: Browser camera/mic recording.
- **Speech-to-Text**: Real-time or async transcription.
- **AI Evaluation**: Candidate answers technical/behavioral questions generated dynamically.
- **Recruiter Review UI**: Video player with timeline-synced AI notes (e.g. 02:45 Problem solving).

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
- Global rate limiting, auth token hardening (e.g., HttpOnly cookies), and upload sanitization must be strictly enforced.

## Core Component Architecture

- `src/components/candidate`: UIs for candidate profile, job discovery, application status.
- `src/components/recruiter`: UIs for job creation, candidate review, AI Copilot, hiring dashboard.
- `src/components/interview`: (Future) UI for WebRTC/MediaRecorder for the AI interview.

## Known Limitations & Issues
- Authentication requires migrating tokens from `localStorage` to `HttpOnly` cookies (SEC-001).
- GitHub avatar loading requires adding domains to `next.config.ts` (SEC-003).
