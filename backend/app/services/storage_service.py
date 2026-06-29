import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import uuid

from app.core.config import (
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    NEXT_PUBLIC_R2_PUBLIC_URL
)

# Initialize the S3 client for Cloudflare R2
s3_client = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto"
)


def generate_presigned_upload_url(file_extension: str, content_type: str) -> dict:
    """
    Generates a pre-signed URL for uploading a file directly to R2.
    Returns the object key and the upload URL.
    """
    if not R2_BUCKET_NAME:
        raise ValueError("R2_BUCKET_NAME is not configured")

    # Generate a unique key for the file
    object_key = f"assessments/{uuid.uuid4().hex}{file_extension}"

    try:
        url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": R2_BUCKET_NAME,
                "Key": object_key,
                "ContentType": content_type
            },
            ExpiresIn=3600  # 1 hour expiration
        )
        return {
            "upload_url": url,
            "object_key": object_key,
            "public_url": f"{NEXT_PUBLIC_R2_PUBLIC_URL}/{object_key}" if NEXT_PUBLIC_R2_PUBLIC_URL else None
        }
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return {}


def get_public_url(object_key: str) -> str:
    """
    Returns the public URL for an object key if a public domain is configured.
    """
    if NEXT_PUBLIC_R2_PUBLIC_URL:
        return f"{NEXT_PUBLIC_R2_PUBLIC_URL}/{object_key}"
    return ""


def download_file(object_key: str, download_path: str) -> bool:
    """
    Downloads a file from R2 to the local disk.
    """
    if not R2_BUCKET_NAME:
        raise ValueError("R2_BUCKET_NAME is not configured")
        
    try:
        s3_client.download_file(R2_BUCKET_NAME, object_key, download_path)
        return True
    except ClientError as e:
        print(f"Error downloading file {object_key}: {e}")
        return False
