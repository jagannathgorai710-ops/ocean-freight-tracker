import React, { useState } from 'react';
import { Lock, Mail, User, Shield, KeyRound, Check, X, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../services/api';

export default function AuthModal({ onClose, onLoginSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res;
      if (mode === 'login') {
        res = await api.login(email, password);
      } else {
        res = await api.register(username, email, password, role);
      }

      setAuthToken(res.token);
      setCurrentUser(res.user);
      if (onLoginSuccess) onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleType) => {
    const quickEmail = roleType === 'Admin' ? 'admin@oceanfreight.com' : 'user@oceanfreight.com';
    const quickPass = roleType === 'Admin' ? 'admin123' : 'user123';
    setEmail(quickEmail);
    setPassword(quickPass);
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(quickEmail, quickPass);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      if (onLoginSuccess) onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: 'rgba(13, 21, 39, 0.98)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        style={{ ...cardStyle, maxWidth: '420px', width: '100%', padding: '24px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Lock style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                {mode === 'login' ? 'System Authentication' : 'Create System Account'}
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Ocean Freight Platform Security</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* 1-Click Quick Demo Login Box */}
        <div style={{ marginTop: '16px', padding: '12px', background: '#060c1c', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
            ⚡ 1-Click Demo Profiles:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('Admin')}
              style={{
                padding: '8px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.3)',
                background: 'rgba(16,185,129,0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Shield style={{ width: '13px', height: '13px' }} /> Admin (Full)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('User')}
              style={{
                padding: '8px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)',
                background: 'rgba(59,130,246,0.12)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <User style={{ width: '13px', height: '13px' }} /> User (Auditor)
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', borderRadius: '8px', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Username</label>
              <input
                type="text"
                required
                placeholder="e.g. jaganath_auditor"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ height: '38px', fontSize: '12px' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. admin@oceanfreight.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ height: '38px', fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ height: '38px', fontSize: '12px' }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Account Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ height: '38px', fontSize: '12px' }}>
                <option value="User">User (Auditor & Viewer)</option>
                <option value="Admin">Admin (Full Control, Sync & Tariffs)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '6px', height: '40px', fontSize: '12px', fontWeight: 700 }}
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          {mode === 'login' ? (
            <span>
              Need a new account?{' '}
              <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                Sign in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
