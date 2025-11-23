# 📧 Email Classifier

An intelligent AI-powered email organization system with a stunning 3D solar system interface. Built with React, FastAPI, and Machine Learning to automatically categorize and manage your emails.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🎨 Beautiful 3D Interface
- **Interactive Solar System**: Navigate through a fully animated 3D solar system built with Three.js
- **Planetary Tooltips**: Each planet represents email concepts with creative quotes
- **Network Animation**: Stunning login page with connected web networks and energy particles
- **Smooth Transitions**: Professional animations throughout the application

### 🤖 AI-Powered Classification
- **Automatic Categorization**: ML model classifies emails into 4 categories
- **TF-IDF Vectorization**: Advanced text processing for accurate classification
- **Real-time Processing**: Instant categorization as emails are synced

### 📬 Email Management
- **Gmail Integration**: Direct IMAP connection to fetch emails
- **Manual Sync**: Control when to sync new emails from your inbox
- **Email Details**: View full email content, sender, date, and all addresses
- **Category Filtering**: Filter emails by category with accurate counts
- **Profile Management**: View and manage your connected Gmail account

### 🔐 Security
- **JWT Authentication**: Secure token-based authentication system
- **Password Hashing**: Bcrypt encryption for user passwords
- **Protected Routes**: Secure API endpoints with authorization
- **Environment Variables**: Sensitive data stored in .env files

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 14+**
- **MongoDB** (local or Atlas)
- **Gmail Account** with IMAP enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ujjwalpan001/email_classifier.git
   cd email_classifier
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

3. **Create Backend .env file**
   ```bash
   # backend/.env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=email_classifier
   SECRET_KEY=your-super-secret-key-change-this
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Create Frontend .env file**
   ```bash
   # frontend/.env
   REACT_APP_API_URL=http://localhost:8000
   ```

### Running the Application

1. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or use MongoDB Atlas connection string
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   venv\Scripts\activate
   uvicorn main:app --reload --port 8000
   ```

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
email_classifier/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── imap_handler.py      # Email fetching & IMAP logic
│   ├── model/
│   │   └── classifier.py    # ML inference engine for email classification
│   ├── requirements.txt     # Python dependencies
│   └── venv/               # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── IntroPage.js      # 3D Solar System landing page
│   │   │   ├── LoginPage.js      # Network animation login
│   │   │   ├── SignupPage.js     # User registration
│   │   │   └── Dashboard.js      # Main email dashboard
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── public/
├── model.pkl               # Trained classification model
├── tfidf.pkl              # TF-IDF vectorizer
└── README.md
```

## 🎯 Usage Guide

### First Time Setup

1. **Sign Up**: Create a new account on the signup page
2. **Login**: Navigate through the solar system and click the sun
3. **Connect Gmail**: 
   - Click "Setup IMAP" in the dashboard
   - Enter your Gmail address
   - Use an [App Password](https://myaccount.google.com/apppasswords) (not your regular password)
   - Click "Save & Sync"

### Daily Usage

1. **View Emails**: See all your synced and categorized emails
2. **Filter by Category**: Click category buttons to filter emails
3. **Sync New Emails**: Click "Sync Emails" button to fetch new messages
4. **Read Email**: Click any email card to view full details
5. **Open Gmail**: Click your Gmail address in profile to open Gmail

### Exploring the Solar System

- **Hover over planets** to see creative email-themed quotes
- **Click and drag** to rotate the view
- **Scroll** to zoom in/out
- **Click the Sun** to navigate to login

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI framework
- **React Router**: Navigation and routing
- **Three.js**: 3D graphics and animations
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for Three.js
- **Axios**: HTTP client for API calls
- **React Toastify**: Beautiful notifications

### Backend
- **FastAPI**: High-performance Python web framework
- **Motor**: Async MongoDB driver
- **PyMongo**: MongoDB integration
- **Scikit-learn**: Machine learning library
- **Pandas & NumPy**: Data processing
- **Python-JOSE**: JWT token handling
- **Passlib**: Password hashing
- **Uvicorn**: ASGI server

### Database
- **MongoDB**: NoSQL database for users and emails

### Machine Learning
- **TF-IDF Vectorizer**: Text feature extraction
- **Classification Model**: Email category prediction
- **Joblib**: Model serialization

## 🔧 Configuration

### Gmail IMAP Setup

1. Enable IMAP in Gmail Settings:
   - Go to Settings → See all settings → Forwarding and POP/IMAP
   - Enable IMAP
   - Save changes

2. Generate App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Create a new app password for "Mail"
   - Use this password in the IMAP setup (not your Gmail password)

### Environment Variables

**Backend (.env)**
```env
MONGODB_URL=your_mongodb_connection_string
DATABASE_NAME=email_classifier
SECRET_KEY=generate_a_secure_random_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:8000
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/user/me` - Get current user info

### Email Operations
- `GET /api/emails` - Fetch all user emails
- `POST /api/imap/setup` - Configure IMAP credentials
- `POST /api/imap/sync` - Sync emails from Gmail

### Notifications
- `GET /api/notifications` - Get user notifications

## 🎨 Features in Detail

### Email Categories

| Category | Precision | Recall | F1-Score | Description |
|----------|-----------|--------|----------|-------------|
| 🚨 **Urgent** | 1.00 | 0.94 | 0.97 | Time-sensitive emails requiring immediate attention |
| 👥 **HR** | 0.90 | 0.89 | 0.90 | Human resources, job-related communications |
| 💰 **Financial** | 0.77 | 0.92 | 0.84 | Banking, payments, invoices, financial statements |
| 📧 **General** | 0.90 | 0.98 | 0.93 | Regular correspondence and newsletters |

**Model Performance:**
- **Overall Accuracy**: 93.97%
- **Macro Average**: Precision 0.89, Recall 0.93, F1-Score 0.91
- **Weighted Average**: Precision 0.94, Recall 0.94, F1-Score 0.94
- **Total Dataset**: 500,000 email samples
- **Training Set**: 350,000 samples (70%)
- **Testing Set**: 150,000 samples (30%)

### 3D Solar System Mapping
- ☀️ **Sun**: Central Mail Server
- 🌑 **Mercury**: Fastest Email Delivery
- 🌕 **Venus**: Overheated Mailbox
- 🌍 **Earth**: User Inbox
- 🔴 **Mars**: Promotions Tab
- 🪐 **Jupiter**: Spam Filter
- 🪐 **Saturn**: Drafts Folder
- 🌀 **Uranus**: Unread Section
- 🧊 **Neptune**: Archive Folder

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ujjwal Pan**
- GitHub: [@ujjwalpan001](https://github.com/ujjwalpan001)

## 🙏 Acknowledgments

- Three.js community for amazing 3D graphics
- FastAPI for the excellent web framework
- React Three Fiber for seamless React-Three.js integration

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Made with ❤️ and lots of ☕
