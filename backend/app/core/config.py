from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

OPEN_API_WHISPERER = os.getenv("OPEN_API_WHISPERER")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
NEXT_PUBLIC_R2_PUBLIC_URL = os.getenv("NEXT_PUBLIC_R2_PUBLIC_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set")