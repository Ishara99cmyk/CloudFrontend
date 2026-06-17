import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function App() {
  const [view, setView] = useState('loading'); // loading, signin, signup, dashboard
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Form Fields State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate Token on Mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setView('signin');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          setView('dashboard');
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken('');
          setView('signin');
        }
      } catch (err) {
        console.error('Failed to verify token', err);
        // If server is offline, just let user signin again or show message
        setView('signin');
      }
    };

    verifyToken();
  }, [token]);

  // Handle Form View Switching
  const handleSwitchView = (newView) => {
    setError('');
    setSuccess('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setView(newView);
  };

  // Sign Up Handler
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting...');
        localStorage.setItem('token', data.token);
        
        // Wait 1.5s for success visualization then log in
        setTimeout(() => {
          setToken(data.token);
          setUser(data.user);
          setView('dashboard');
          setLoading(false);
        }, 1500);
      } else {
        setError(data.error || 'Registration failed.');
        setLoading(false);
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
      setLoading(false);
    }
  };

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login successful! Welcome.');
        localStorage.setItem('token', data.token);

        setTimeout(() => {
          setToken(data.token);
          setUser(data.user);
          setView('dashboard');
          setLoading(false);
        }, 1200);
      } else {
        setError(data.error || 'Authentication failed.');
        setLoading(false);
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setView('signin');
  };

  // Handle Profile Picture Upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('picture', file);

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile picture updated successfully!');
        setUser(prev => ({
          ...prev,
          profile_picture_url: data.profile_picture_url
        }));
      } else {
        setError(data.error || 'Failed to upload profile picture.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Profile Picture Remove
  const handleProfilePictureRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile picture removed successfully!');
        setUser(prev => ({
          ...prev,
          profile_picture_url: null
        }));
      } else {
        setError(data.error || 'Failed to remove profile picture.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // 1. LOADING VIEW
  if (view === 'loading') {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500 }}>
        Loading Application...
      </div>
    );
  }

  // 2. SIGN IN VIEW
  if (view === 'signin') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="auth-form" onSubmit={handleSignIn}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); handleSwitchView('signup'); }}>
              Create an account
            </a>
          </p>
        </div>
      </div>
    );
  }

  // 3. SIGN UP VIEW
  if (view === 'signup') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Sign up for a secure user account</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="auth-form" onSubmit={handleSignUp}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); handleSwitchView('signin'); }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  // 4. DASHBOARD VIEW (AUTHENTICATED)
  if (view === 'dashboard' && user) {
    const triggerFileInput = () => {
      if (!uploading && fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="avatar-wrapper" onClick={triggerFileInput} title="Click to upload profile picture">
            {uploading && (
              <div className="avatar-loading-overlay">
                <div className="avatar-spinner"></div>
              </div>
            )}
            <div className="dashboard-avatar">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.username}
                  className="avatar-image"
                />
              ) : (
                user.username ? user.username.charAt(0).toUpperCase() : 'U'
              )}
              <div className="avatar-overlay">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2m8 3a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z"/>
                </svg>
                <span>EDIT</span>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePictureUpload}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={uploading}
          />

          {user.profile_picture_url && (
            <div className="avatar-actions">
              <button
                onClick={handleProfilePictureRemove}
                className="avatar-action-btn delete"
                disabled={uploading}
              >
                Remove Photo
              </button>
            </div>
          )}
          
          <div className="auth-header">
            <h1 className="auth-title">Welcome back, {user.username}!</h1>
            <p className="auth-subtitle">You have successfully signed in using a secure MySQL database.</p>
          </div>

          <div className="user-info">
            <div className="info-row">
              <span className="info-label">User ID</span>
              <span className="info-value">#{user.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Username</span>
              <span className="info-value">{user.username}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email Address</span>
              <span className="info-value">{user.email}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
