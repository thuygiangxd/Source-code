import os
import smtplib
from email.mime.text import MIMEText
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
import random

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return _pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "auth_svc"
    })
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print(f"[AuthService] Created token for user={data.get('sub')}, exp={expire.isoformat()}")
    print(f"[AuthService] Token payload: {to_encode}")
    print("Auth JWT_SECRET startswith:", JWT_SECRET[:10], "len=", len(JWT_SECRET))
    return token

def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def send_email(to_email: str, subject: str, body: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_username = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASS")
    smtp_sender_email = os.getenv("MAIL_FROM")

    if not all([smtp_host, smtp_username, smtp_password, smtp_sender_email]):
        print("SMTP environment variables not fully configured. Skipping email sending.")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = smtp_sender_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        print(f"Email sent to {to_email} successfully.")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")