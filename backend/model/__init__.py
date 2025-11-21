# Model package
from .classifier import classify_email_text, classify_batch_emails, load_model

__all__ = ['classify_email_text', 'classify_batch_emails', 'load_model']
