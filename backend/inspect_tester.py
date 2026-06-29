import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("postgresql://certifit:certifit123@localhost:5432/certifit")
Session = sessionmaker(bind=engine)
session = Session()

from app.models.user import User
from app.models.candidate import Candidate
from app.models.application import Application
from app.models.job import Job

user = session.query(User).filter(User.email.ilike('%tester%')).first()
if not user:
    print("No tester user found")
    exit()

candidate = session.query(Candidate).filter(Candidate.user_id == user.id).first()
if not candidate:
    print("No candidate found for tester user")
    exit()

print(f"Tester User: {user.email}")
print("--- Trust Score ---")
print(json.dumps(candidate.trust_score_json, indent=2))

applications = session.query(Application).filter(Application.candidate_id == candidate.id).all()
for app in applications:
    job = session.query(Job).filter(Job.id == app.job_id).first()
    print(f"\n--- Application for {job.title} ---")
    print(f"Fit Score: {app.fit_score}")
    print(f"Trust Score (App): {app.trust_score}")
    print(f"Composite Score: {app.composite_score}")
    print(f"Skill Confidence: {json.dumps(app.skill_confidence, indent=2)}")

