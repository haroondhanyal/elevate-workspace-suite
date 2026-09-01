"""SMTP adapter. It is intentionally a no-op until SMTP settings are configured."""
import smtplib
from email.message import EmailMessage

from .config import get_settings


def send_password_reset(recipient: str, reset_url: str) -> bool:
    settings = get_settings()
    if not all([settings.smtp_host, settings.smtp_from]):
        return False
    message = EmailMessage()
    message["Subject"] = "Reset your Elevate password"
    message["From"] = settings.smtp_from
    message["To"] = recipient
    message.set_content(f"Use this link to reset your password. It expires in 30 minutes:\n\n{reset_url}")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
    return True
