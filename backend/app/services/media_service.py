import os
import uuid
import ffmpeg
from openai import OpenAI

from app.core.config import OPEN_API_WHISPERER

# Initialize OpenAI client
# Since the env variable is named OPEN_API_WHISPERER instead of OPENAI_API_KEY
client = OpenAI(api_key=OPEN_API_WHISPERER) if OPEN_API_WHISPERER else None


def extract_audio_from_video(video_path: str) -> str:
    """
    Extracts audio from a video file and saves it as a WAV file.
    Returns the path to the extracted audio file.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    audio_path = f"/tmp/{uuid.uuid4().hex}.wav"

    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, acodec='pcm_s16le', ac=1, ar='16k')
            .overwrite_output()
            .run(quiet=True)
        )
        return audio_path
    except ffmpeg.Error as e:
        print(f"ffmpeg error: {e.stderr.decode('utf8') if e.stderr else e}")
        raise RuntimeError("Failed to extract audio from video")


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes an audio file using OpenAI's Whisper API.
    """
    if not client:
        raise ValueError("OpenAI client is not initialized. Check OPEN_API_WHISPERER.")

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    try:
        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        return transcript
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        raise RuntimeError(f"Failed to transcribe audio: {e}")
