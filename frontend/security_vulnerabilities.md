# CertiFit Frontend — Security Vulnerabilities

> **Status**: Identified during code audit on 2026-06-28. Not yet fixed. Review and prioritise before production deployment.

---

## CRITICAL

### SEC-001 — Token stored in both `localStorage` AND Zustand persist (duplicate, XSS risk)

**Location**: `src/store/authStore.ts` L26, `src/lib/api.ts` L8-10

**Issue**: The JWT access token is stored in `localStorage` under two keys — `certifit_token` (manual write in `setAuth`) and `certifit-auth` (Zustand `persist` middleware serializes the entire store including the token). Any XSS attack can trivially read `localStorage` and exfiltrate the token.

**Impact**: Full account takeover if XSS is achieved.

**Recommendation**:
- Move token storage to `HttpOnly` cookies set by the server (requires backend change).
- If cookies are not feasible short-term, use a single `localStorage` key and remove the duplicate manual `localStorage.setItem` call in `setAuth`.
- Implement a strict Content Security Policy (CSP) header to limit XSS attack surface.

---

### SEC-002 — 401 redirect uses `window.location.href` (leaks referrer, no CSRF protection)

**Location**: `src/lib/api.ts` L21

**Issue**: On a 401 response, the interceptor hard-navigates to `/login` using `window.location.href`. This bypasses Next.js router state cleanup, potentially leaking the current URL as a referrer header to third-party resources loaded on the login page.

**Recommendation**: Use Next.js `router.push("/login")` with the router available via a Zustand-side effect or a React context, and call `clearAuth()` first to wipe all in-memory state.

---

## HIGH

### SEC-003 — GitHub avatar rendered via `<img src={...}>` without domain allowlist

**Location**: `src/components/candidate/profile-display.tsx`

**Issue**: The GitHub avatar URL (`avatar_url` from the GitHub API) is directly passed to an `<img>` tag without validation. If the backend ever stores a malicious URL, it would be loaded. Additionally, this bypasses Next.js Image Optimization and the `next/image` domain allowlist.

**Recommendation**: Use `next/image` with `github.com` and `avatars.githubusercontent.com` added to `next.config.ts` `images.remotePatterns`. This enforces domain allowlisting.

---

### SEC-004 — LinkedIn PDF upload has no frontend MIME validation beyond file extension

**Location**: `src/components/candidate/profile-completeness.tsx`

**Issue**: The file input has `accept=".pdf,application/pdf"` but the browser `accept` attribute is advisory only. A user can bypass it and upload any file. The `file.type` check in the handler can be spoofed by renaming files.

**Recommendation**: The backend already validates magic bytes for PDFs — but the frontend should also read the first 4 bytes of the `File` object via `FileReader` and confirm the `%PDF` signature before sending. This reduces unnecessary backend load and gives faster user feedback.

---

### SEC-005 — No CSRF protection on state-mutating API calls

**Location**: `src/lib/api.ts`

**Issue**: All mutations use Bearer token auth, which is immune to classic CSRF (cookies are not sent). However, if token storage is ever migrated to cookies (recommended fix for SEC-001), CSRF protection must be added simultaneously (e.g., `SameSite=Strict` cookie attribute, or a CSRF token header).

**Recommendation**: If cookies are adopted, set `SameSite=Strict` and `Secure` attributes. Document this as a prerequisite of SEC-001 remediation.

---

## MEDIUM

### SEC-006 — No rate limiting or debounce on GitHub username submission

**Location**: `src/components/candidate/profile-display.tsx` — `handleAddGithub`

**Issue**: Users can spam the GitHub connect form, triggering repeated calls to `POST /candidates/github`. The backend makes external GitHub API calls on each request and is vulnerable to rate-limit exhaustion.

**Recommendation**: Add a debounce or disable-for-N-seconds mechanism after a failed attempt. The backend should also implement per-user rate limiting on this endpoint.

---

### SEC-007 — `useAuthStore` `isAuthenticated` check relies solely on token presence, not expiry

**Location**: `src/hooks/useAuth.ts` L46, `src/store/authStore.ts`

**Issue**: The token is stored in `localStorage` but never validated for expiry on the client side. A user with an expired JWT will remain visually "logged in" until their first API call returns 401. The 401 interceptor then hard-navigates to `/login`, which is disruptive.

**Recommendation**: Decode the JWT on the client (without verifying signature — just reading the `exp` claim) at app startup and on route change. If expired, proactively call `clearAuth()` and redirect gracefully.

---

### SEC-008 — No `rel="noopener noreferrer"` on external links

**Location**: Various pages

**Issue**: If any `<a>` tag targets `_blank` (e.g., GitHub profile links), omitting `rel="noopener noreferrer"` allows the opened page to access `window.opener` and redirect the parent tab.

**Recommendation**: Audit all `<a target="_blank">` usages and add `rel="noopener noreferrer"` to all of them. Consider a lint rule (`eslint-plugin-jsx-a11y` rule `anchor-is-valid`).

---

## LOW / INFORMATIONAL

### SEC-009 — `console.error` / stack traces may leak in production build

**Recommendation**: Ensure error boundary components do not forward raw stack traces to the UI. Use a structured logger that is silenced in production.

### SEC-010 — `react-dropzone` does not prevent zip-bomb or password-protected PDF uploads

**Recommendation**: The backend validates file size (5 MB), which mitigates zip-bombs. Password-protected PDFs will fail to parse — add a user-facing error message for this case rather than a generic failure.

### SEC-011 — Tokens are not invalidated server-side on logout

**Location**: Backend — no token blocklist / no refresh-token revocation

**Issue**: JWT tokens are valid for 30 days (backend config). Logging out on the frontend clears `localStorage` but the token remains cryptographically valid and can be reused if exfiltrated before logout.

**Recommendation**: Implement a server-side token blocklist (Redis set of revoked JTIs) checked in `get_current_user`, or switch to short-lived access tokens (15 min) + refresh tokens (invalidatable).

### SEC-012 — Use of `any` type for complex backend responses bypasses type checking

**Location**: Frontend — `profile-display.tsx`, `candidate-api.ts`

**Issue**: The frontend currently casts the complex responses for `github_profile` and `linkedin_profile` to `any` because the frontend types (`GithubProfile` / `LinkedinProfile`) do not encompass the full schema returned by the backend (e.g. `recent_events`, `repositories`). While this silences TypeScript errors, it bypasses static type safety, which can lead to runtime crashes if the backend schema changes or is missing properties (like nested objects being undefined).

**Recommendation**: Define comprehensive, strict TypeScript interfaces for `CandidateProfileResponse` in `src/lib/candidate-api.ts` that accurately map the rich JSON structures sent by the backend, and remove all `as any` casts.

---

*Document generated by code audit. Update this file as vulnerabilities are fixed.*
