## Updated File Tree

```text
backend/
├── .DS_Store
├── .env
├── .gitignore
├── .ruff_cache
│   ├── .gitignore
│   ├── 0.15.17
│   │   ├── 10164641555254636396
│   │   ├── 12425909410639152282
│   │   ├── 13141606745771437314
│   │   ├── 14615318185851385436
│   │   ├── 2711651238882190232
│   │   ├── 3312739995919045355
│   │   ├── 3810446079376812575
│   │   ├── 5147820736766571608
│   │   ├── 6714994424221599821
│   │   ├── 6941601905708641430
│   │   └── 806615251138847837
│   └── CACHEDIR.TAG
├── FLAGS.md
├── alembic
│   ├── env.py
│   ├── script.py.mako
│   └── versions
│       ├── 0001_baseline.py
│       ├── 0002_add_job_and_candidate_ownership.py
│       ├── 0003_create_applications.py
│       ├── 0004_add_candidate_github_profile.py
│       ├── 0005_add_candidate_linkedin_profile.py
│       ├── 0006_add_normalized_trust_columns.py
│       └── 0007_add_composite_ranking_columns.py
├── alembic.ini
├── app
│   ├── api
│   │   ├── app.py
│   │   ├── applications.py
│   │   ├── auth.py
│   │   ├── candidates.py
│   │   ├── interview.py
│   │   ├── jobs.py
│   │   └── ranking.py
│   ├── core
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   └── security.py
│   ├── db
│   │   └── database.py
│   ├── main.py
│   ├── models
│   │   ├── application.py
│   │   ├── candidate.py
│   │   ├── job.py
│   │   └── user.py
│   ├── schemas
│   │   ├── application.py
│   │   ├── auth.py
│   │   ├── candidate.py
│   │   └── job.py
│   └── services
│       ├── application_service.py
│       ├── auth_service.py
│       ├── candidate_service.py
│       ├── github_service.py
│       ├── interview_service.py
│       ├── jd_parser.py
│       ├── job_service.py
│       ├── linkedin_service.py
│       ├── llm_candidate_analyzer.py
│       ├── llm_job_analyzer.py
│       ├── llm_validation.py
│       ├── profile_service.py
│       ├── resume_parser.py
│       └── trust_service.py
├── backend.md
├── create.py
├── docs
├── functions_catalog.md
├── requirements.txt
├── scratch_parse_linkedin.py
├── tests
│   ├── Profile.pdf
│   ├── conftest.py
│   ├── test_applications.py
│   ├── test_auth_privacy.py
│   ├── test_composite_ranking.py
│   ├── test_github.py
│   ├── test_interview.py
│   ├── test_linkedin.py
│   ├── test_parser_and_ranking.py
│   ├── test_profile.py
│   ├── test_trust.py
│   ├── test_uploads.py
│   └── testprofile.pdf
└── uploads
```


### File: `app/api/app.py`

#### Function: `health`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def health():
    return { ...
```

### File: `app/api/applications.py`

#### Function: `_application_summary`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _application_summary(application):
    return { ...
```
#### Function: `list_my_applications`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def list_my_applications(db, current_user):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    applications = get_applications_for_candidate( ...
```
#### Function: `change_application_status`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def change_application_status(application_id, data, db, current_user):
    try: ...
    return _application_summary(application) ...
```
#### Function: `get_candidate_report`
- **What it does**: Demo endpoint — returns the full candidate intelligence report in one call.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_candidate_report(application_id, db, current_user):
    from app.models.application import Application ...
    from app.models.candidate import Candidate ...
    from app.models.job import Job ...
```

### File: `app/api/auth.py`

#### Function: `register`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def register(data, db):
    try: ...
```
#### Function: `login`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def login(data, db):
    result = login_user( ...
    if not result: ...
    return { ...
```
#### Function: `me`
- **What it does**: No docstring provided.
- **Where it is used**: app/models/candidate.py, app/models/user.py, app/models/application.py, app/services/profile_service.py, app/services/candidate_service.py, app/services/trust_service.py, app/models/job.py, app/services/llm_candidate_analyzer.py, app/services/linkedin_service.py
- **Pseudo-code**:
```python
def me(current_user):
    return { ...
```

### File: `app/api/candidates.py`

#### Function: `_safe_resume_extension`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _safe_resume_extension(filename):
    suffix = Path(filename or "").name.lower() ...
    extension = Path(suffix).suffix ...
    if extension not in ALLOWED_EXTENSIONS: ...
```
#### Function: `_validate_resume_content`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _validate_resume_content(content, extension):
    if not content: ...
    if len(content) > MAX_RESUME_SIZE_BYTES: ...
    if extension == ".pdf" and not content.startswith(PDF_SIGNATURE): ...
```
#### Function: `upload_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def upload_candidate(resume, db, current_user):
    Path(UPLOAD_DIR).mkdir( ...
    extension = _safe_resume_extension(resume.filename) ...
    stored_file_name = f"{uuid4().hex}{extension}" ...
```
#### Function: `get_my_candidate_profile`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_my_candidate_profile(db, current_user):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    return { ...
```
#### Function: `upload_github_profile`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def upload_github_profile(data, db, current_user):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    try: ...
```
#### Function: `upload_linkedin_profile`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def upload_linkedin_profile(profile, db, current_user):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    try: ...
```
#### Function: `get_my_normalized_profile`
- **What it does**: Return stored normalized profile (DB read — no rebuild).
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_my_normalized_profile(db, current_user):
    candidate = get_candidate_by_user_id(db=db, user_id=current_user.id) ...
    if not candidate: ...
    return { ...
```
#### Function: `get_my_trust_score`
- **What it does**: Return stored trust score (DB read — no rebuild).
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_my_trust_score(db, current_user):
    candidate = get_candidate_by_user_id(db=db, user_id=current_user.id) ...
    if not candidate: ...
    return { ...
```
#### Function: `rebuild_my_profile`
- **What it does**: Force rebuild of normalized profile and trust score.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def rebuild_my_profile(db, current_user):
    candidate = get_candidate_by_user_id(db=db, user_id=current_user.id) ...
    if not candidate: ...
    profile, trust = rebuild_candidate_intelligence(db=db, candidate=candidate) ...
```
#### Function: `list_candidates`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def list_candidates(page, page_size, db, current_user):
    candidate = get_candidate_by_user_id( ...
    data = [] ...
    if candidate: ...
```
#### Function: `get_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_candidate(candidate_id, db, current_user):
    candidate = get_candidate_by_id( ...
    if not candidate: ...
    if candidate.user_id != current_user.id: ...
```
#### Function: `remove_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def remove_candidate(candidate_id, db, current_user):
    candidate = delete_candidate( ...
    if not candidate: ...
    return { ...
```

### File: `app/api/interview.py`

#### Function: `_verify_recruiter_owns_application`
- **What it does**: Load application + candidate + job, verify the recruiter owns the job.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _verify_recruiter_owns_application(db, application_id, recruiter_id):
    row = ( ...
    if not row: ...
    return row ...
```
#### Function: `create_interview_plan`
- **What it does**: Generate a structured interview plan for a candidate application.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def create_interview_plan(application_id, db, current_user):
    application, candidate, job = _verify_recruiter_owns_application( ...
    plan = generate_interview_plan( ...
    return { ...
```

### File: `app/api/jobs.py`

#### Function: `parse_job`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/job_service.py
- **Pseudo-code**:
```python
def parse_job(data, current_user):
    return { ...
```
#### Function: `create_new_job`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def create_new_job(data, db, current_user):
    job = create_job( ...
    return { ...
```
#### Function: `list_my_jobs`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def list_my_jobs(page, page_size, db, current_user):
    jobs, total = get_jobs_by_recruiter( ...
    return { ...
```
#### Function: `list_jobs`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def list_jobs(page, page_size, company, title, db):
    jobs, total = get_jobs( ...
    return { ...
```
#### Function: `get_job`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_job(job_id, db):
    job = get_job_by_id( ...
    if not job: ...
    return { ...
```
#### Function: `remove_job`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def remove_job(job_id, db, current_user):
    job = delete_job( ...
    if not job: ...
    return { ...
```
#### Function: `reparse_existing_job`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def reparse_existing_job(job_id, db, current_user):
    job = reparse_job( ...
    if not job: ...
    return { ...
```
#### Function: `apply_to_job`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def apply_to_job(job_id, db, current_user):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    try: ...
```
#### Function: `list_job_applications`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def list_job_applications(job_id, db, current_user):
    application_rows = get_applications_for_owned_job( ...
    job = get_job_by_id( ...
    if not job or job.recruiter_id != current_user.id: ...
```

### File: `app/core/dependencies.py`

#### Function: `get_current_user`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_current_user(credentials, db):
    token = credentials.credentials ...
    payload = decode_access_token( ...
    if not payload: ...
```
#### Function: `get_current_recruiter`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_current_recruiter(current_user):
    if current_user.user_type != 1: ...
    return current_user ...
```
#### Function: `get_current_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_current_candidate(current_user):
    if current_user.user_type != 2: ...
    return current_user ...
```

### File: `app/core/security.py`

#### Function: `hash_password`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/auth_service.py
- **Pseudo-code**:
```python
def hash_password(password):
    return password_hash.hash(password) ...
```
#### Function: `verify_password`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/auth_service.py
- **Pseudo-code**:
```python
def verify_password(plain_password, hashed_password):
    return password_hash.verify( ...
```
#### Function: `create_access_token`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/auth_service.py
- **Pseudo-code**:
```python
def create_access_token(user_id, user_type):
    expire = datetime.now( ...
    payload = { ...
    return jwt.encode( ...
```
#### Function: `decode_access_token`
- **What it does**: No docstring provided.
- **Where it is used**: app/core/dependencies.py
- **Pseudo-code**:
```python
def decode_access_token(token):
    try: ...
```

### File: `app/db/database.py`

#### Function: `get_db`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_db():
    db = SessionLocal() ...
    try: ...
```

### File: `app/services/application_service.py`

#### Function: `_canonical_term`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _canonical_term(value):
    cleaned = re.sub( ...
    if not cleaned: ...
    key = re.sub(r"[^a-z0-9+#.]", "", cleaned.lower()) ...
```
#### Function: `_as_set`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _as_set(values):
    if not values: ...
    return { ...
```
#### Function: `_tech_values`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _tech_values(tech_stack):
    values = [] ...
    if not isinstance(tech_stack, dict): ...
    for item in tech_stack.values(): ...
```
#### Function: `calculate_match`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def calculate_match(job, candidate):
    job_data = job.parsed_jd_json or {} ...
    candidate_data = candidate.parsed_candidate_json or {} ...
    required_skills = _as_set( ...
```
#### Function: `_composite_score`
- **What it does**: composite = fit * (0.6 + 0.4 * (trust / 100))
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _composite_score(fit_score, trust_score):
    normalised_trust = max(0.0, min(trust_score, 100.0)) / 100.0 ...
    raw = fit_score * (0.6 + 0.4 * normalised_trust) ...
    return round(min(raw, 100.0), 2) ...
```
#### Function: `_build_score_explanations`
- **What it does**: Build the human-readable score_explanations dict.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _build_score_explanations(fit_score, trust_score, composite_score, strengths, trust_data):
    why: list[str] = [] ...
    for strength in (trust_data.get("strengths") or [])[:3]: ...
    for concern in (trust_data.get("concerns") or [])[:3]: ...
```
#### Function: `create_application`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def create_application(db, job_id, candidate):
    job = ( ...
    if not job: ...
    existing = ( ...
```
#### Function: `get_applications_for_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/applications.py
- **Pseudo-code**:
```python
def get_applications_for_candidate(db, candidate_id):
    return ( ...
```
#### Function: `get_applications_for_owned_job`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def get_applications_for_owned_job(db, job_id, recruiter_id):
    return ( ...
```
#### Function: `update_application_status`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/applications.py
- **Pseudo-code**:
```python
def update_application_status(db, application_id, recruiter_id, status):
    if status not in ALLOWED_APPLICATION_STATUSES: ...
    application = ( ...
    if not application: ...
```

### File: `app/services/auth_service.py`

#### Function: `register_user`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/auth.py
- **Pseudo-code**:
```python
def register_user(db, name, email, password, user_type):
    if user_type not in (1, 2): ...
    existing = ( ...
    if existing: ...
```
#### Function: `login_user`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/auth.py
- **Pseudo-code**:
```python
def login_user(db, email, password):
    user = ( ...
    if not user: ...
    if not verify_password( ...
```

### File: `app/services/candidate_service.py`

#### Function: `create_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def create_candidate(db, user_id, file_path, file_name):
    try: ...
    candidate = get_candidate_by_user_id( ...
    if candidate: ...
```
#### Function: `get_candidates`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def get_candidates(db, page, page_size):
    query = db.query(Candidate) ...
    total = query.count() ...
    candidates = ( ...
```
#### Function: `get_candidate_by_id`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def get_candidate_by_id(db, candidate_id):
    return ( ...
```
#### Function: `get_candidate_by_user_id`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/applications.py, app/api/jobs.py, app/api/candidates.py
- **Pseudo-code**:
```python
def get_candidate_by_user_id(db, user_id):
    return ( ...
```
#### Function: `delete_candidate`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def delete_candidate(db, candidate_id, user_id):
    query = db.query(Candidate).filter( ...
    if user_id is not None: ...
    candidate = query.first() ...
```
#### Function: `update_candidate_github_profile`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def update_candidate_github_profile(db, user_id, github_profile):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    candidate.github_profile_json = github_profile ...
```
#### Function: `update_candidate_linkedin_profile`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def update_candidate_linkedin_profile(db, user_id, linkedin_profile):
    candidate = get_candidate_by_user_id( ...
    if not candidate: ...
    candidate.linkedin_profile_json = linkedin_profile ...
```
#### Function: `rebuild_candidate_intelligence`
- **What it does**: Rebuild normalized_profile_json and trust_score_json for a candidate.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def rebuild_candidate_intelligence(db, candidate):
    from app.services.profile_service import build_normalized_profile ...
    from app.services.trust_service import calculate_trust_score ...
    profile = {} ...
```

### File: `app/services/github_service.py`

#### Function: `parse_github_identifier`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def parse_github_identifier(identifier):
    value = identifier.strip() ...
    if not value: ...
    if "://" not in value and "/" not in value: ...
```
#### Function: `_request_json`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _request_json(path):
    try: ...
    if response.status_code == 404: ...
    if response.status_code >= 400: ...
```
#### Function: `_summarize_user`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _summarize_user(user):
    return { ...
```
#### Function: `_summarize_repo`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _summarize_repo(repo, languages):
    return { ...
```
#### Function: `_summarize_event`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _summarize_event(event):
    return { ...
```
#### Function: `analyze_github_profile`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def analyze_github_profile(identifier):
    parsed = parse_github_identifier(identifier) ...
    user = _request_json(f"/users/{parsed.username}") ...
    repos = _request_json( ...
```

### File: `app/services/interview_service.py`

#### Function: `_deterministic_technical`
- **What it does**: Generate technical questions from JD required skills + candidate profile.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _deterministic_technical(required_skills, profile):
    questions: list[str] = [] ...
    evidence_map = profile.get("evidence_map") or {} ...
    for skill in required_skills[:6]: ...
```
#### Function: `_deterministic_behavioral`
- **What it does**: Generate behavioral questions from job seniority/leadership signals.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _deterministic_behavioral(job_data):
    seniority = (job_data.get("seniority") or "").lower() ...
    if seniority in {"lead", "staff", "principal"}: ...
    if seniority in {"senior"}: ...
```
#### Function: `_deterministic_verification`
- **What it does**: Generate verification questions from trust concerns and unsupported claims.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _deterministic_verification(trust_data):
    questions: list[str] = [] ...
    for concern in (trust_data.get("concerns") or [])[:4]: ...
    for claim in (trust_data.get("unsupported_claims") or [])[:4]: ...
```
#### Function: `_deterministic_project`
- **What it does**: Generate project walk-through questions from GitHub repos and project URLs.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _deterministic_project(profile):
    questions: list[str] = [] ...
    projects = profile.get("projects") or [] ...
    for project in projects[:3]: ...
```
#### Function: `_fallback_interview_plan`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _fallback_interview_plan(reason):
    return { ...
```
#### Function: `_llm_enrich_questions`
- **What it does**: Use Gemini to improve question quality and naturalness.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _llm_enrich_questions(technical, behavioral, verification, project, job_title):
    try: ...
    prompt = f"""You are an expert technical interviewer helping prepare for a {job_title} interview. ...
    schema_keys = [ ...
```
#### Function: `generate_interview_plan`
- **What it does**: Generate a structured interview plan.
- **Where it is used**: app/api/applications.py, app/api/interview.py
- **Pseudo-code**:
```python
def generate_interview_plan(job, candidate, application):
    job_data = job.parsed_jd_json or {} ...
    profile = candidate.normalized_profile_json or {} ...
    trust_data = candidate.trust_score_json or {} ...
```
#### Function: `_fallback`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _fallback(reason):
    return { ...
```

### File: `app/services/jd_parser.py`

#### Function: `parse_job_description`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py, app/services/job_service.py
- **Pseudo-code**:
```python
def parse_job_description(jd):
    result = analyze_job_with_llm(jd) ...
    return result ...
```

### File: `app/services/job_service.py`

#### Function: `create_job`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def create_job(db, recruiter_id, title, company, jd):
    try: ...
    job = Job( ...
    try: ...
```
#### Function: `get_jobs`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def get_jobs(db, page, page_size, company, title):
    query = db.query(Job) ...
    if company: ...
    if title: ...
```
#### Function: `get_jobs_by_recruiter`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def get_jobs_by_recruiter(db, recruiter_id, page, page_size):
    query = db.query(Job).filter( ...
    total = query.count() ...
    jobs = ( ...
```
#### Function: `get_job_by_id`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def get_job_by_id(db, job_id):
    return ( ...
```
#### Function: `delete_job`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def delete_job(db, job_id, recruiter_id):
    job = ( ...
    if not job: ...
    try: ...
```
#### Function: `reparse_job`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/jobs.py
- **Pseudo-code**:
```python
def reparse_job(db, job_id, recruiter_id):
    job = ( ...
    if not job: ...
    try: ...
```

### File: `app/services/linkedin_service.py`

#### Function: `validate_linkedin_pdf`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def validate_linkedin_pdf(content):
    if not content: ...
    if len(content) > LINKEDIN_MAX_PDF_SIZE_BYTES: ...
    if not content.startswith(PDF_SIGNATURE): ...
```
#### Function: `extract_linkedin_text`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def extract_linkedin_text(content):
    validate_linkedin_pdf(content) ...
    try: ...
    try: ...
```
#### Function: `_clean_lines`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _clean_lines(text):
    lines = [] ...
    for line in text.replace("\xa0", " ").splitlines(): ...
    return lines ...
```
#### Function: `_find_sections`
- **What it does**: Return {section_name: line_index} for all detected LinkedIn sections.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _find_sections(lines):
    sections: dict[str, int] = {} ...
    for i, line in enumerate(lines): ...
    return sections ...
```
#### Function: `_section_lines`
- **What it does**: Get the content lines for a section (up to the next section header).
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _section_lines(lines, sections, section_name):
    start = sections.get(section_name) ...
    if start is None: ...
    end = len(lines) ...
```
#### Function: `_looks_like_person_name`
- **What it does**: Heuristic: does this line look like a person's name?
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _looks_like_person_name(line):
    words = line.split() ...
    if len(words) < 2 or len(words) > 4: ...
    if not words[0][0].isupper(): ...
```
#### Function: `_looks_like_location`
- **What it does**: Heuristic: does this line look like a geographic location?
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _looks_like_location(line):
    lowered = line.lower() ...
    if any(term in lowered for term in _LOCATION_TERMS): ...
    if "area" in lowered: ...
```
#### Function: `_profile_header`
- **What it does**: Extract name, headline, location by working backward from Summary.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _profile_header(lines, sections):
    warnings: list[str] = [] ...
    summary_idx = sections.get("Summary") ...
    if summary_idx is None or summary_idx < 2: ...
```
#### Function: `_top_skills`
- **What it does**: Extract skills from Top Skills section + Key Skills from the summary.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _top_skills(lines, sections, name_idx):
    skills_idx = sections.get("Top Skills") ...
    if skills_idx is None: ...
    summary_content = _section_lines(lines, sections, "Summary") ...
```
#### Function: `_certifications`
- **What it does**: Extract certifications between the Certifications header and the name line.
- **Where it is used**: app/services/profile_service.py
- **Pseudo-code**:
```python
def _certifications(lines, sections, name_idx):
    cert_idx = sections.get("Certifications") ...
    if cert_idx is None: ...
    cert_lines = lines[cert_idx + 1 : name_idx] ...
```
#### Function: `_summary`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/applications.py
- **Pseudo-code**:
```python
def _summary(lines, sections):
    return " ".join(_section_lines(lines, sections, "Summary")) ...
```
#### Function: `_normalize_title`
- **What it does**: Capitalize first letter of each word that starts lowercase.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _normalize_title(text):
    words = text.split() ...
    result = [] ...
    for word in words: ...
```
#### Function: `_is_company_line`
- **What it does**: Heuristic: is this line a company name?
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _is_company_line(line):
    if not line: ...
    if DATE_RE.search(line) or DURATION_RE.search(line): ...
    if re.match(r"^\d+\s+(year|month)", line, re.IGNORECASE): ...
```
#### Function: `_positions`
- **What it does**: Extract positions from the Experience section.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _positions(lines, sections):
    experience = _section_lines(lines, sections, "Experience") ...
    if not experience: ...
    positions: list[dict] = [] ...
```
#### Function: `_is_school_line`
- **What it does**: Heuristic: does this line look like a school / institution name?
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _is_school_line(line):
    lowered = line.lower() ...
    if any(kw in lowered for kw in _SCHOOL_KEYWORDS): ...
    if re.search(r"\([A-Z]{2,}\)", line): ...
```
#### Function: `_is_education_detail`
- **What it does**: Heuristic: is this line a degree / date detail rather than a school?
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _is_education_detail(line):
    lowered = line.lower() ...
    if any(lowered.startswith(p) for p in _DEGREE_PREFIXES): ...
    if "·" in line: ...
```
#### Function: `_education`
- **What it does**: Extract education entries, grouping detail lines under their school.
- **Where it is used**: app/services/profile_service.py
- **Pseudo-code**:
```python
def _education(lines, sections):
    edu_lines = _section_lines(lines, sections, "Education") ...
    if not edu_lines: ...
    education: list[dict] = [] ...
```
#### Function: `_compute_parser_confidence`
- **What it does**: Return 0-100 confidence score based on how complete the parse is.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _compute_parser_confidence(result):
    score = 0 ...
    warnings = result.get("parser_warnings", []) ...
    name = result.get("name", "") ...
```
#### Function: `parse_linkedin_pdf`
- **What it does**: No docstring provided.
- **Where it is used**: app/api/candidates.py
- **Pseudo-code**:
```python
def parse_linkedin_pdf(content):
    text = extract_linkedin_text(content) ...
    lines = _clean_lines(text) ...
    sections = _find_sections(lines) ...
```

### File: `app/services/llm_candidate_analyzer.py`

#### Function: `analyze_candidate_resume`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/candidate_service.py
- **Pseudo-code**:
```python
def analyze_candidate_resume(resume_text, links):
    prompt = f""" ...
    try: ...
```

### File: `app/services/llm_job_analyzer.py`

#### Function: `analyze_job_with_llm`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/jd_parser.py
- **Pseudo-code**:
```python
def analyze_job_with_llm(jd):
    prompt = f""" ...
    try: ...
```

### File: `app/services/llm_validation.py`

#### Function: `gemini_json_config`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_job_analyzer.py, app/services/llm_candidate_analyzer.py
- **Pseudo-code**:
```python
def gemini_json_config():
    return { ...
```
#### Function: `fallback_job_analysis`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_job_analyzer.py
- **Pseudo-code**:
```python
def fallback_job_analysis(reason):
    return { ...
```
#### Function: `fallback_candidate_analysis`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_candidate_analyzer.py
- **Pseudo-code**:
```python
def fallback_candidate_analysis(reason):
    return { ...
```
#### Function: `parse_json_object`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_job_analyzer.py, app/services/llm_candidate_analyzer.py
- **Pseudo-code**:
```python
def parse_json_object(text):
    if not text or not text.strip(): ...
    data = json.loads(text.strip()) ...
    if not isinstance(data, dict): ...
```
#### Function: `_as_list`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/profile_service.py
- **Pseudo-code**:
```python
def _as_list(value):
    if isinstance(value, list): ...
    if value in (None, ""): ...
    return [value] ...
```
#### Function: `_as_dict`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _as_dict(value):
    if isinstance(value, Mapping): ...
    return {} ...
```
#### Function: `_as_bool`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _as_bool(value):
    if isinstance(value, bool): ...
    return False ...
```
#### Function: `_as_number`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _as_number(value):
    if isinstance(value, int | float): ...
    try: ...
```
#### Function: `normalize_job_analysis`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_job_analyzer.py
- **Pseudo-code**:
```python
def normalize_job_analysis(data):
    fallback = fallback_job_analysis("llm_response_missing_fields") ...
    merged = {**fallback, **data} ...
    merged["required_skills"] = _as_list(merged.get("required_skills")) ...
```
#### Function: `normalize_candidate_analysis`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_candidate_analyzer.py
- **Pseudo-code**:
```python
def normalize_candidate_analysis(data):
    fallback = fallback_candidate_analysis("llm_response_missing_fields") ...
    merged = {**fallback, **data} ...
    merged["portfolio_urls"] = _as_list(merged.get("portfolio_urls")) ...
```
#### Function: `safe_gemini_call`
- **What it does**: Wraps a Gemini generate_content call with full error handling.
- **Where it is used**: app/services/trust_service.py, app/services/interview_service.py
- **Pseudo-code**:
```python
def safe_gemini_call(client, prompt, schema_keys, fallback_fn, label):
    metadata: dict[str, Any] = { ...
    try: ...
```

### File: `app/services/profile_service.py`

#### Function: `_normalise`
- **What it does**: Lower-case, strip punctuation — used only for deduplication keys.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _normalise(skill):
    return re.sub(r"[^a-z0-9#+.]", "", skill.lower()) ...
```
#### Function: `_canonical`
- **What it does**: Return the display-form skill string, stripped.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _canonical(skill):
    return skill.strip() ...
```
#### Function: `_as_list`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/llm_validation.py
- **Pseudo-code**:
```python
def _as_list(value):
    if isinstance(value, list): ...
    return [] ...
```
#### Function: `_flatten_tech`
- **What it does**: Flatten a tech_stack dict (languages/frameworks/…) into a flat list.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _flatten_tech(tech_stack):
    out: list[str] = [] ...
    if not isinstance(tech_stack, dict): ...
    for items in tech_stack.values(): ...
```
#### Function: `_skills_from_resume`
- **What it does**: Extract all skills mentioned in the resume parsed JSON.
- **Where it is used**: app/services/trust_service.py
- **Pseudo-code**:
```python
def _skills_from_resume(parsed):
    skills: list[str] = [] ...
    skills.extend(_as_list(parsed.get("skills"))) ...
    skills.extend(_flatten_tech(parsed.get("tech_stack", {}))) ...
```
#### Function: `_skills_from_linkedin`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/trust_service.py
- **Pseudo-code**:
```python
def _skills_from_linkedin(linkedin):
    skills: list[str] = [] ...
    skills.extend(_as_list(linkedin.get("skills"))) ...
    for pos in _as_list(linkedin.get("positions")): ...
```
#### Function: `_skills_from_github`
- **What it does**: Extract language names from github_profile_json language_totals.
- **Where it is used**: app/services/trust_service.py
- **Pseudo-code**:
```python
def _skills_from_github(github):
    skills: list[str] = [] ...
    language_totals = github.get("language_totals", {}) ...
    if isinstance(language_totals, dict): ...
```
#### Function: `_build_evidence_map`
- **What it does**: Returns {canonical_skill: [sources_list]} where sources are
- **Where it is used**: app/services/trust_service.py
- **Pseudo-code**:
```python
def _build_evidence_map(resume_skills, linkedin_skills, github_skills):
    canonical_map: dict[str, str] = {} ...
    evidence: dict[str, set[str]] = {} ...
    for skill, source in ( ...
```
#### Function: `_skill_confidence`
- **What it does**: 30  → resume only
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _skill_confidence(sources):
    has_resume = "resume" in sources ...
    count = len(sources) ...
    if count >= 3: ...
```
#### Function: `_build_skill_confidence`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _build_skill_confidence(evidence_map):
    return {skill: _skill_confidence(sources) for skill, sources in evidence_map.items()} ...
```
#### Function: `_compute_confidence_score`
- **What it does**: Base = 20 per data source present (max 60).
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _compute_confidence_score(sources_present, verified_count, total_skills):
    base = min(sources_present * 20, 60) ...
    if total_skills: ...
    return min(base + bonus, 100) ...
```
#### Function: `_best_name`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _best_name(parsed, linkedin):
    return ( ...
```
#### Function: `_best_headline`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _best_headline(parsed, linkedin):
    return ( ...
```
#### Function: `_experience_years`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _experience_years(parsed, linkedin):
    resume_years = parsed.get("years_experience") or 0 ...
    linkedin_positions = len(_as_list(linkedin.get("positions"))) ...
    linkedin_years = max(linkedin_positions - 1, 0) * 2 ...
```
#### Function: `_merge_education`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _merge_education(parsed, linkedin):
    seen: set[str] = set() ...
    result: list[dict] = [] ...
    for item in _as_list(parsed.get("education")): ...
```
#### Function: `_merge_certifications`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _merge_certifications(parsed, linkedin):
    seen: set[str] = set() ...
    result: list[str] = [] ...
    for cert in ( ...
```
#### Function: `_merge_projects`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _merge_projects(parsed, github):
    projects: list[dict] = [] ...
    for url in _as_list(parsed.get("project_urls")): ...
    for repo in _as_list(github.get("repositories")): ...
```
#### Function: `build_normalized_profile`
- **What it does**: Build and return a normalized profile dict from all stored candidate data.
- **Where it is used**: app/services/candidate_service.py
- **Pseudo-code**:
```python
def build_normalized_profile(candidate):
    parsed = candidate.parsed_candidate_json or {} ...
    linkedin = candidate.linkedin_profile_json or {} ...
    github = candidate.github_profile_json or {} ...
```

### File: `app/services/resume_parser.py`

#### Function: `extract_pdf_data`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def extract_pdf_data(file_path):
    text = "" ...
    links = [] ...
    pdf = fitz.open(file_path) ...
```
#### Function: `extract_docx_data`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def extract_docx_data(file_path):
    doc = Document(file_path) ...
    text = "\n".join( ...
    return { ...
```
#### Function: `extract_resume_data`
- **What it does**: No docstring provided.
- **Where it is used**: app/services/candidate_service.py
- **Pseudo-code**:
```python
def extract_resume_data(file_path):
    file_path = file_path.lower() ...
    if file_path.endswith(".pdf"): ...
    if file_path.endswith(".docx"): ...
```

### File: `app/services/trust_service.py`

#### Function: `extract_claims`
- **What it does**: Parse resume text and parsed JSON to produce structured claims.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def extract_claims(candidate):
    claims: list[dict[str, str]] = [] ...
    seen: set[str] = set() ...
    parsed = candidate.parsed_candidate_json or {} ...
```
#### Function: `_date_consistency_check`
- **What it does**: Check for gaps/mismatches between resume work history and LinkedIn positions.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _date_consistency_check(parsed, linkedin):
    explanations: list[str] = [] ...
    concerns: list[str] = [] ...
    resume_history = parsed.get("work_history") or [] ...
```
#### Function: `_title_consistency_check`
- **What it does**: Compare resume current_role with LinkedIn headline.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _title_consistency_check(parsed, linkedin):
    explanations: list[str] = [] ...
    concerns: list[str] = [] ...
    resume_role = (parsed.get("current_role") or "").lower() ...
```
#### Function: `_skill_evidence_check`
- **What it does**: Score skills by evidence source count.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _skill_evidence_check(evidence_map):
    explanations: list[str] = [] ...
    concerns: list[str] = [] ...
    unsupported: list[str] = [] ...
```
#### Function: `_github_activity_check`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _github_activity_check(github):
    explanations: list[str] = [] ...
    concerns: list[str] = [] ...
    pts = 0 ...
```
#### Function: `_certification_check`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _certification_check(parsed, linkedin, evidence_map):
    explanations: list[str] = [] ...
    concerns: list[str] = [] ...
    pts = 0 ...
```
#### Function: `_fallback_llm_review`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _fallback_llm_review(reason):
    return { ...
```
#### Function: `_llm_consistency_review`
- **What it does**: Calls Gemini to review cross-source consistency.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def _llm_consistency_review(candidate):
    try: ...
    parsed = candidate.parsed_candidate_json or {} ...
    linkedin = candidate.linkedin_profile_json or {} ...
```
#### Function: `calculate_trust_score`
- **What it does**: Compute the hybrid trust score for a candidate.
- **Where it is used**: app/services/application_service.py, app/services/candidate_service.py
- **Pseudo-code**:
```python
def calculate_trust_score(candidate):
    parsed = candidate.parsed_candidate_json or {} ...
    linkedin = candidate.linkedin_profile_json or {} ...
    github = candidate.github_profile_json or {} ...
```
#### Function: `keywords`
- **What it does**: No docstring provided.
- **Where it is used**: Internal, Route Endpoint, or Not Exported
- **Pseudo-code**:
```python
def keywords(text):
    words = re.findall(r"[a-z]+", text) ...
    return {w for w in words if len(w) > 3 and w not in { ...
```
