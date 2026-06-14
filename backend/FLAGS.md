# Codebase Flags & Future Improvements


## Known Limitations & Roadmap (from backend.md)

- Trust scoring is pending.
- Normalized profile generation is pending.
- Interview copilot is pending.
- Candidate manual profile editing is pending.
- Recruiter candidate detail endpoint scoped through application relationship is pending.
- Public job detail exposes raw JD and parsed JD.
- Add normalized profile storage and generation.
- Add deterministic trust score engine.
- Update ranking to read normalized profile while preserving deterministic MVP behavior.
- Add recruiter-scoped candidate detail endpoint if product requires it.
- Add stateless interview copilot endpoint.
- Harden production config, CORS, token/session policy, upload scanning, and CI.

## Codebase Flags (TODOs, FIXMEs, etc.)

- **app/services/linkedin_service.py:307**: `BUG FIX: The original backward scan stopped at max(summary_idx - 6, -1)`
- **app/services/linkedin_service.py:403**: `BUG FIX: The original code only used the Certifications section index as`
- **app/services/linkedin_service.py:761**: `BUG FIX: The original check only flagged names containing "certificate",`

## Clean Code & Structural Issues

- `app/api/interview.py` and `app/api/ranking.py` exist but are empty placeholders.
- Pydantic `Field(example=...)` is deprecated in V2, need to migrate to `Field(json_schema_extra=...)` in schemas (e.g. `app/schemas/auth.py`).
- SQLAlchemy `echo=True` should be disabled in production (`app/db/database.py`).
- GitHub service uses unauthenticated public API calls, prone to rate limits.
- Missing rate limiting across all endpoints.