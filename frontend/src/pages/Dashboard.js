import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [imapEmail, setImapEmail] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [showImapModal, setShowImapModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userGmail, setUserGmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserData();
    fetchEmails();
    fetchNotifications();

    // Poll for new emails every 30 seconds
    const interval = setInterval(() => {
      fetchEmails(true);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/me`, getAuthHeaders());
      setUser(response.data);
      if (response.data.imap_email) {
        setUserGmail(response.data.imap_email);
      }
    } catch (error) {
      console.error('Failed to fetch user data');
    }
  };

  const fetchEmails = async (silent = false) => {
    try {
      const response = await axios.get(`${API_URL}/api/emails`, getAuthHeaders());
      
      // Debug: Log email categories
      if (response.data.length > 0 && !silent) {
        console.log('Sample email categories:', response.data.slice(0, 3).map(e => ({ 
          subject: e.subject, 
          category: e.category 
        })));
      }
      
      // Check for new urgent emails and create notifications
      if (silent && emails.length > 0) {
        const newEmails = response.data.filter(
          email => !emails.find(e => e._id === email._id)
        );
        
        newEmails.forEach(email => {
          if (email.category && email.category.toLowerCase() === 'urgent') {
            addNotification({
              type: 'urgent',
              message: `New Urgent Email: ${email.subject}`,
              email: email
            });
          }
        });
      }
      
      setEmails(response.data);
      if (!silent) setLoading(false);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to fetch emails');
        setLoading(false);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, getAuthHeaders());
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast based on category
    const categoryEmoji = {
      urgent: '🚨',
      hr: '👥',
      financial: '💰',
      general: '📧'
    };
    
    toast.info(
      `${categoryEmoji[notification.email?.category] || '📧'} ${notification.message}`,
      { autoClose: 5000 }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleImapSetup = async (e) => {
    e.preventDefault();
    setSyncing(true);

    try {
      await axios.post(
        `${API_URL}/api/imap/setup`,
        {
          email: imapEmail,
          password: imapPassword
        },
        getAuthHeaders()
      );

      toast.success('IMAP credentials saved! Syncing emails...');
      setShowImapModal(false);
      setUserGmail(imapEmail);
      setImapEmail('');
      setImapPassword('');
      
      // Refresh user data
      await fetchUserData();
      
      // Trigger email sync
      await handleSyncEmails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to setup IMAP');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncEmails = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/imap/sync`,
        {},
        getAuthHeaders()
      );

      toast.success(`Synced ${response.data.synced_count} emails!`);
      fetchEmails();
      
      // Create notifications for new urgent emails
      response.data.new_emails?.forEach(email => {
        if (email.category === 'urgent') {
          addNotification({
            type: 'urgent',
            message: `New Urgent Email: ${email.subject}`,
            email: email
          });
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const filteredEmails = filterCategory === 'all'
    ? emails
    : emails.filter(email => email.category && email.category.toLowerCase() === filterCategory.toLowerCase());

  const getCategoryColor = (category) => {
    const colors = {
      urgent: '#ff4444',
      hr: '#44aaff',
      financial: '#44ff88',
      general: '#ffaa44'
    };
    return colors[category] || '#888888';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      urgent: '🚨',
      hr: '👥',
      financial: '💰',
      general: '📧'
    };
    return icons[category] || '📧';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your emails...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📧 Email Classifier</h1>
          <button 
            className="sync-btn"
            onClick={handleSyncEmails}
            disabled={syncing}
          >
            {syncing ? '⏳' : '🔄'} {syncing ? 'Syncing...' : 'Sync Emails'}
          </button>
        </div>

        <div className="header-right">
          <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
            🔔
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </div>

          <div className="profile-icon" onClick={() => setShowProfile(!showProfile)}>
            <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          </div>
        </div>
      </header>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="dropdown profile-dropdown">
          <div className="profile-info">
            <div className="avatar-large">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <h3>{user?.username}</h3>
            <p className="profile-email">{user?.email}</p>
            {userGmail && (
              <p 
                className="profile-gmail clickable"
                onClick={() => window.open(`https://mail.google.com/mail/u/${userGmail}`, '_blank')}
                title="Open Gmail"
              >
                <span className="gmail-icon">📧</span> {userGmail}
              </p>
            )}
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={() => setShowImapModal(true)}>
            ⚙️ IMAP Settings
          </button>
          <button className="dropdown-item logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="dropdown notifications-dropdown">
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p className="no-notifications">No new notifications</p>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  <span className="notif-icon">{getCategoryIcon(notif.email?.category)}</span>
                  <div className="notif-content">
                    <p>{notif.message}</p>
                    <small>{new Date(notif.timestamp).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button 
            className="clear-notifications"
            onClick={() => setNotifications([])}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          All ({emails.length})
        </button>
        <button
          className={`filter-btn ${filterCategory === 'urgent' ? 'active' : ''}`}
          onClick={() => setFilterCategory('urgent')}
          style={{ '--category-color': getCategoryColor('urgent') }}
        >
          🚨 Urgent ({emails.filter(e => e.category && e.category.toLowerCase() === 'urgent').length})
        </button>
        <button
          className={`filter-btn ${filterCategory === 'hr' ? 'active' : ''}`}
          onClick={() => setFilterCategory('hr')}
          style={{ '--category-color': getCategoryColor('hr') }}
        >
          👥 HR ({emails.filter(e => e.category && e.category.toLowerCase() === 'hr').length})
        </button>
        <button
          className={`filter-btn ${filterCategory === 'financial' ? 'active' : ''}`}
          onClick={() => setFilterCategory('financial')}
          style={{ '--category-color': getCategoryColor('financial') }}
        >
          💰 Financial ({emails.filter(e => e.category && e.category.toLowerCase() === 'financial').length})
        </button>
        <button
          className={`filter-btn ${filterCategory === 'general' ? 'active' : ''}`}
          onClick={() => setFilterCategory('general')}
          style={{ '--category-color': getCategoryColor('general') }}
        >
          📧 General ({emails.filter(e => e.category && e.category.toLowerCase() === 'general').length})
        </button>
      </div>

      {/* Email List */}
      <div className="email-list">
        {filteredEmails.length === 0 ? (
          <div className="no-emails">
            <p>📭 No emails in this category</p>
            <button onClick={() => setShowImapModal(true)}>
              Setup IMAP to sync emails
            </button>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div 
              key={email._id} 
              className="email-card"
              onClick={() => {
                setSelectedEmail(email);
                setShowEmailModal(true);
              }}
            >
              <div className="email-header">
                <span 
                  className="email-category"
                  style={{ backgroundColor: getCategoryColor(email.category) }}
                >
                  {getCategoryIcon(email.category)} {email.category}
                </span>
                <span className="email-date">
                  {new Date(email.date).toLocaleDateString()}
                </span>
              </div>
              <div className="email-from">
                <strong>From:</strong> {email.from}
              </div>
              <div className="email-subject">
                <strong>{email.subject}</strong>
              </div>
              <div className="email-body">
                {email.body?.substring(0, 150)}...
              </div>
              <div className="email-confidence">
                Confidence: {(email.confidence * 100).toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>

      {/* IMAP Modal */}
      {showImapModal && (
        <div className="modal-overlay" onClick={() => setShowImapModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ IMAP Configuration</h2>
              <button className="close-btn" onClick={() => setShowImapModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleImapSetup} className="modal-form">
              <div className="form-group">
                <label>Gmail Address</label>
                <input
                  type="email"
                  value={imapEmail}
                  onChange={(e) => setImapEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>App Password</label>
                <input
                  type="password"
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                  placeholder="16-character app password"
                  required
                />
                <small>
                  Generate an app password from{' '}
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Google Account Settings
                  </a>
                </small>
              </div>
              <button type="submit" className="submit-btn" disabled={syncing}>
                {syncing ? 'Saving...' : 'Save & Sync'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Detail Modal */}
      {showEmailModal && selectedEmail && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal email-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="email-detail-header">
                <span 
                  className="email-category-badge"
                  style={{ backgroundColor: getCategoryColor(selectedEmail.category) }}
                >
                  {getCategoryIcon(selectedEmail.category)} {selectedEmail.category}
                </span>
                <span className="email-confidence-badge">
                  {(selectedEmail.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowEmailModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="email-detail-content">
              <div className="email-detail-field">
                <label>From:</label>
                <p>{selectedEmail.from}</p>
              </div>
              
              <div className="email-detail-field">
                <label>Date:</label>
                <p>{new Date(selectedEmail.date).toLocaleString()}</p>
              </div>
              
              <div className="email-detail-field">
                <label>Subject:</label>
                <p className="email-detail-subject">{selectedEmail.subject}</p>
              </div>
              
              <div className="email-detail-field email-detail-body">
                <label>Message:</label>
                <div className="email-body-content">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
