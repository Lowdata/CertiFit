import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("postgresql://certifit:certifit123@localhost:5432/certifit")
Session = sessionmaker(bind=engine)
session = Session()

from app.models.user import User
from app.models.candidate import Candidate
from app.models.application import Application
from app.services.scoring_task import process_application_scoring_background

user = session.query(User).filter(User.email.ilike('%tester%')).first()
if not user:
    print("No tester user found")
    sys.exit()

candidate = session.query(Candidate).filter(Candidate.user_id == user.id).first()
apps = session.query(Application).filter(Application.candidate_id == candidate.id).all()

for app in apps:
    print(f"Rescoring application {app.id}...")
    process_application_scoring_background(app.id)
    session.refresh(app)
    print(f"New Fit Score: {app.fit_score}")
    print(f"Recommendation: {app.match_summary}")

