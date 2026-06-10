import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5001/api';

function App() {
  const [view, setView] = useState('loading'); // loading, signin, signup, dashboard
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

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
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="dashboard-avatar">
            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          
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
