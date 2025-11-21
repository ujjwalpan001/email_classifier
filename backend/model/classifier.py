import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np

# Paths to your pre-trained model files
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(ROOT_DIR, 'model.pkl')
VECTORIZER_PATH = os.path.join(ROOT_DIR, 'tfidf.pkl')

# Initialize model and vectorizer
model = None
vectorizer = None

def create_and_train_model():
    """Create and train a basic email classifier model"""
    # Sample training data
    training_data = [
        # Urgent emails
        ("urgent meeting tomorrow action required", "urgent"),
        ("critical security alert immediate attention", "urgent"),
        ("emergency please respond asap", "urgent"),
        ("deadline today important", "urgent"),
        ("urgent action needed critical issue", "urgent"),
        ("immediate response required critical", "urgent"),
        ("high priority urgent matter", "urgent"),
        
        # HR emails
        ("annual performance review schedule", "hr"),
        ("employee benefits enrollment", "hr"),
        ("leave application approval", "hr"),
        ("training session attendance", "hr"),
        ("hr policy update notification", "hr"),
        ("payroll information salary", "hr"),
        ("recruitment interview schedule", "hr"),
        ("employee onboarding welcome", "hr"),
        
        # Financial emails
        ("invoice payment due account", "financial"),
        ("quarterly financial report", "financial"),
        ("expense reimbursement request", "financial"),
        ("budget approval needed", "financial"),
        ("transaction receipt purchase", "financial"),
        ("payment confirmation order", "financial"),
        ("tax document statement", "financial"),
        ("billing information invoice", "financial"),
        
        # General emails
        ("meeting notes discussion", "general"),
        ("project update status", "general"),
        ("team lunch schedule", "general"),
        ("office announcement", "general"),
        ("newsletter monthly update", "general"),
        ("follow up previous email", "general"),
        ("information sharing document", "general"),
        ("general inquiry question", "general"),
    ]
    
    # Separate texts and labels
    texts = [text for text, _ in training_data]
    labels = [label for _, label in training_data]
    
    # Create pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=1000, ngram_range=(1, 2))),
        ('classifier', MultinomialNB(alpha=0.1))
    ])
    
    # Train model
    pipeline.fit(texts, labels)
    
    # Save model
    joblib.dump(pipeline, MODEL_PATH)
    
    return pipeline

def load_model():
    """Load your pre-trained model and vectorizer"""
    global model, vectorizer
    
    if model is None or vectorizer is None:
        if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
            print(f"Loading model from: {MODEL_PATH}")
            print(f"Loading vectorizer from: {VECTORIZER_PATH}")
            model = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            print("Model and vectorizer loaded successfully!")
        else:
            print(f"Model files not found!")
            print(f"Expected model at: {MODEL_PATH}")
            print(f"Expected vectorizer at: {VECTORIZER_PATH}")
            print("Training new model as fallback...")
            pipeline = create_and_train_model()
            # For fallback, we'll use the pipeline directly
            model = pipeline
            vectorizer = pipeline.named_steps['tfidf']
    
    return model, vectorizer

def classify_email_text(text):
    """
    Classify email text into categories using your pre-trained model
    
    Args:
        text (str): Email text (subject + body)
    
    Returns:
        tuple: (category, confidence)
    """
    if not text or not text.strip():
        return "general", 0.5
    
    # Load model and vectorizer
    clf, vec = load_model()
    
    # Make prediction
    try:
        # Transform text using vectorizer
        text_vectorized = vec.transform([text])
        
        # Predict using model
        prediction = clf.predict(text_vectorized)[0]
        
        # Get prediction probabilities
        probabilities = clf.predict_proba(text_vectorized)[0]
        confidence = float(max(probabilities))
        
        return prediction, confidence
    except Exception as e:
        print(f"Classification error: {e}")
        return "general", 0.5

def classify_batch_emails(texts):
    """
    Classify multiple emails at once using your pre-trained model
    
    Args:
        texts (list): List of email texts
    
    Returns:
        list: List of (category, confidence) tuples
    """
    clf, vec = load_model()
    
    results = []
    for text in texts:
        if not text or not text.strip():
            results.append(("general", 0.5))
            continue
        
        try:
            text_vectorized = vec.transform([text])
            prediction = clf.predict(text_vectorized)[0]
            probabilities = clf.predict_proba(text_vectorized)[0]
            confidence = float(max(probabilities))
            results.append((prediction, confidence))
        except:
            results.append(("general", 0.5))
    
    return results

# Initialize model on import
try:
    load_model()
    print("Email classifier model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
