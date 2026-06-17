# CertiFit Frontend Design

Last audited: 2026-06-17

This is the canonical frontend system design document. Keep it current after every completed feature. A new engineer or AI agent should be able to continue frontend work from this file without first spelunking the repository.

## Project Overview

CertiFit Frontend is a Next.js (App Router) web application designed to connect with the FastAPI CertiFit backend. It provides the user interface for candidates and recruiters.

Current goals:
- Candidates can register, log in, manage their profiles (resume, GitHub, LinkedIn), and apply for jobs.
- Recruiters can register, log in, post jobs, and view candidate applications.
- Serve as the UI for AI-driven resume parsing, matching, and interview prep.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / shadcn/ui
- **Icons**: Lucide React
- **HTTP Client**: native `fetch` / axios (TBD based on implementation)

## Implementation Status

| Feature | Status | Notes |
| --- | --- | --- |
| Setup | ✅ Implemented | Next.js initialized with Tailwind CSS. |
| CORS Integration | ✅ Implemented | Backend CORS middleware added; preflight `OPTIONS` requests now succeed. |
| Landing Page | ✅ Implemented | High-end SaaS design, dynamic radial backgrounds, bento grid features. |
| Global Header | ✅ Implemented | Extracted into `<Header />` with integrated `ThemeToggle`. |
| Authentication UI | ✅ Implemented | Split-screen enterprise layout (Geist font) for Login/Register. |
| Authentication Logic | 🚧 In Progress | Forms hook up to `useAuth()`. Need to verify token storage and routing. |
| Candidate Dashboard | ⏳ Pending | |
| Recruiter Dashboard | ⏳ Pending | |

## Project Structure

```text
frontend/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable React components (UI library + custom)
│   ├── lib/           # Utility functions, API clients, helpers
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── next.config.ts     # Next.js config
```

## API Integration

The frontend connects to the backend API running locally (e.g., `http://localhost:8000`).

**Important Notes:**
- **CORS Setup**: CORS has been successfully configured on the backend. Cross-origin requests from the frontend to `http://localhost:8000` are permitted, resolving the previous `405 Method Not Allowed` issue on `OPTIONS` requests.
- **Authentication**: Uses JWT Bearer tokens. Tokens received on login/register should be stored (e.g., in `localStorage` or secure cookies) and attached to the `Authorization: Bearer <token>` header of subsequent API requests.

## Roadmap & Next Steps

## Roadmap & Next Steps

1. Verify complete Authentication API flow (Token storage, User Type detection).
2. Build Dashboard Shells (Sidebar layout for Candidates and Recruiters).
3. Build Candidate profile and job listing views.
4. Build Recruiter job management and application review views.

## Known Limitations & Issues
- None at the moment.
