# Codebase Flags & Future Improvements


## Known Limitations & Roadmap (from backend.md)

- Candidate manual profile editing is pending.
- Recruiter candidate detail endpoint scoped through application relationship is implemented via `GET /applications/{id}/candidate-report`.
- Public job detail exposes raw JD and parsed JD.
- Add recruiter-scoped candidate detail endpoint if product requires it.
- Harden production config, CORS, token/session policy, upload scanning, and CI.

## Codebase Flags (TODOs, FIXMEs, etc.)

- **app/services/linkedin_service.py:307**: `BUG FIX: The original backward scan stopped at max(summary_idx - 6, -1)`
- **app/services/linkedin_service.py:403**: `BUG FIX: The original code only used the Certifications section index as`
- **app/services/linkedin_service.py:761**: `BUG FIX: The original check only flagged names containing "certificate",`

## Clean Code & Structural Issues

- `app/api/ranking.py` exists but is an empty placeholder.
- Pydantic `Field(example=...)` is deprecated in V2, need to migrate to `Field(json_schema_extra=...)` in schemas (e.g. `app/schemas/auth.py`).
- SQLAlchemy `echo=True` should be disabled in production (`app/db/database.py`).
- GitHub service uses unauthenticated public API calls, prone to rate limits.
- Missing rate limiting across all endpoints.