import imaplib
import email
from email.header import decode_header
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "email_classifier")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

def clean_text(text):
    """Clean and decode email text"""
    if isinstance(text, bytes):
        text = text.decode('utf-8', errors='ignore')
    return text.strip() if text else ""

def decode_email_subject(subject):
    """Decode email subject"""
    if subject is None:
        return "No Subject"
    
    decoded_parts = decode_header(subject)
    decoded_subject = ""
    
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                decoded_subject += part.decode(encoding or 'utf-8', errors='ignore')
            except:
                decoded_subject += part.decode('utf-8', errors='ignore')
        else:
            decoded_subject += part
    
    return decoded_subject.strip()

def extract_email_body(msg):
    """Extract email body from message"""
    body = ""
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            body = str(msg.get_payload())
    
    return clean_text(body)

def fetch_emails_from_gmail(email_address, password, max_emails=50):
    """Fetch emails from Gmail using IMAP"""
    emails_data = []
    
    try:
        # Connect to Gmail IMAP
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_address, password)
        mail.select("inbox")
        
        # Search for all emails
        status, messages = mail.search(None, "ALL")
        email_ids = messages[0].split()
        
        # Get the most recent emails
        recent_email_ids = email_ids[-max_emails:] if len(email_ids) > max_emails else email_ids
        
        for email_id in recent_email_ids[::-1]:  # Reverse to get newest first
            try:
                status, msg_data = mail.fetch(email_id, "(RFC822)")
                
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        # Extract email details
                        subject = decode_email_subject(msg["Subject"])
                        from_email = clean_text(msg.get("From", ""))
                        date_str = msg.get("Date", "")
                        
                        # Parse date
                        try:
                            email_date = email.utils.parsedate_to_datetime(date_str)
                        except:
                            email_date = datetime.utcnow()
                        
                        # Extract body
                        body = extract_email_body(msg)
                        
                        emails_data.append({
                            "subject": subject,
                            "from": from_email,
                            "date": email_date,
                            "body": body[:1000],  # Limit body length
                            "email_id": email_id.decode()
                        })
            except Exception as e:
                print(f"Error processing email {email_id}: {e}")
                continue
        
        mail.close()
        mail.logout()
        
    except Exception as e:
        raise Exception(f"Failed to fetch emails: {str(e)}")
    
    return emails_data

async def classify_email(subject, body):
    """Classify email using ML model"""
    from model.classifier import classify_email_text
    
    # Combine subject and body for classification
    text = f"{subject} {body}"
    category, confidence = classify_email_text(text)
    
    return category, confidence

async def sync_user_emails(user_id, imap_email, imap_password):
    """Sync emails for a user and classify them"""
    
    # Fetch emails from Gmail
    emails_data = fetch_emails_from_gmail(imap_email, imap_password)
    
    synced_count = 0
    new_urgent_emails = []
    
    for email_data in emails_data:
        # Check if email already exists
        existing_email = await db.emails.find_one({
            "user_id": user_id,
            "email_id": email_data["email_id"]
        })
        
        if existing_email:
            continue
        
        # Classify email
        category, confidence = await classify_email(
            email_data["subject"],
            email_data["body"]
        )
        
        # Save to database
        email_doc = {
            "user_id": user_id,
            "email_id": email_data["email_id"],
            "subject": email_data["subject"],
            "from": email_data["from"],
            "date": email_data["date"],
            "body": email_data["body"],
            "category": category,
            "confidence": confidence,
            "synced_at": datetime.utcnow()
        }
        
        result = await db.emails.insert_one(email_doc)
        synced_count += 1
        
        # Create notification for urgent emails
        if category == "urgent":
            notification_doc = {
                "user_id": user_id,
                "email_id": str(result.inserted_id),
                "type": "urgent",
                "message": f"New Urgent Email: {email_data['subject']}",
                "timestamp": datetime.utcnow(),
                "read": False
            }
            await db.notifications.insert_one(notification_doc)
            new_urgent_emails.append(email_doc)
    
    return synced_count
