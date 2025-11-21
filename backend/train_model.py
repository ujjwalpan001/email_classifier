"""
Script to train and save the email classifier model
Run this before starting the backend server
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model.classifier import create_and_train_model

def main():
    print("Training email classifier model...")
    model = create_and_train_model()
    print("Model trained and saved successfully!")
    print(f"Model saved to: model/email_classifier_model.pkl")
    
    # Test the model
    test_emails = [
        "urgent meeting tomorrow action required",
        "employee benefits enrollment form",
        "invoice payment due for order",
        "team lunch next week"
    ]
    
    print("\nTesting model with sample emails:")
    for text in test_emails:
        prediction = model.predict([text])[0]
        probabilities = model.predict_proba([text])[0]
        confidence = max(probabilities)
        print(f"  Text: '{text}'")
        print(f"  Predicted: {prediction} (confidence: {confidence:.2f})\n")

if __name__ == "__main__":
    main()
