import smtplib
from email.message import EmailMessage
import os

# To configure your SMTP, set these environment variables before running your server:
# set SMTP_SERVER=smtp.gmail.com
# set SMTP_PORT=465
# set SMTP_USER=your_email@gmail.com
# set SMTP_PASSWORD=your_app_password
#
# If not set, it will attempt to use localhost for testing, or print to console.

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 465))
SMTP_USER = os.environ.get("SMTP_USER", "darsh.kushwaha@oges.co")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

def send_overdue_email(to_email: str, username: str, book_title: str, expected_return_date: str) -> bool:
    """Sends an overdue notice to the specified email."""
    
    if not to_email:
        print(f"[SMTP Simulator] Cannot send email to {username} - no email address provided.")
        return False
        
    msg = EmailMessage()
    msg['Subject'] = f"Action Required: Overdue Library Book - {book_title}"
    msg['From'] = SMTP_USER or "Asset mgmt. system @oges"
    msg['To'] = to_email

    body = f"""Hello {username},

This is an automated notification from the Library Management System.

Your borrowed book "{book_title}" is currently overdue. 
The expected return date was {expected_return_date}. 

Please return this book to the library as soon as possible to avoid any further inconvenience.

Thank you,
The Library Team
"""
    msg.set_content(body)

    # If credentials aren't configured perfectly, just simulate it for dev
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"\n[SMTP Simulator] Would send email to {to_email}:")
        print(f"Subject: {msg['Subject']}")
        print(f"Body:\n{body}\n")
        print("Set SMTP_USER and SMTP_PASSWORD environment variables to send real emails.")
        return True

    try:
        # Use implicit SSL/TLS for port 465
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        else:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent overdue email to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}. Error: {e}")
        return False
