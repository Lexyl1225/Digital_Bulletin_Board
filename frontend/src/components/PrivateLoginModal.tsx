import React, { useState } from 'react';
import {
  X,
  Lock,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { FormattedUser } from '../services/api';
import { loginUser, logoutUser } from '../services/api';
import { DEFAULT_USER_PASSWORD } from '../services/initialData';

interface PrivateLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: FormattedUser) => Promise<boolean>;
  onRegisterPrivate: (name: string, password?: string, bio?: string) => Promise<void>;
}

// A deliberately separate, minimal sign-in surface for private/personal
// accounts — no quick-select user list (that would defeat the point of
// "private"), just a plain username + password form, exactly like signing
// into an account nobody else knows exists.
export const PrivateLoginModal: React.FC<PrivateLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegisterPrivate,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regBio, setRegBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setLoginName('');
    setLoginPassword('');
    setRegName('');
    setRegPassword('');
    setRegBio('');
    setErrorMsg('');
    setTab('login');
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginName.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }

    try {
      setLoading(true);
      const authedUser = await loginUser(loginName.trim(), loginPassword);
      if (!authedUser.payload.isPrivate) {
        // This login endpoint is shared with the public flow — a non-private
        // account can technically authenticate here, but this page is only
        // meant for private accounts, so back it out immediately.
        await logoutUser();
        setErrorMsg('This is not a private/personal account. Please use the standard Sign In instead.');
        return;
      }
      const success = await onLogin(authedUser);
      if (success) {
        resetAndClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }

    try {
      setLoading(true);
      await onRegisterPrivate(regName.trim(), regPassword.trim() || undefined, regBio.trim() || undefined);
      resetAndClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create private account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', borderRadius: '20px', overflow: 'hidden auto' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 18px 28px',
            background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Private Board Sign In
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Personal account — not visible to the team
              </p>
            </div>
          </div>
          <button onClick={resetAndClose} className="btn-icon" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Info banner */}
        <div
          style={{
            padding: '10px 24px',
            background: 'rgba(139, 92, 246, 0.08)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#a78bfa',
            lineHeight: 1.5,
          }}
        >
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            A private account's board is only ever visible to you. It never appears in Team
            Overview, the Public Board, or any account switcher.
          </span>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            style={{
              padding: '14px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: tab === 'login' ? '#a78bfa' : 'var(--text-muted)',
              borderBottom: tab === 'login' ? '3px solid #8b5cf6' : '3px solid transparent',
              background: tab === 'login' ? 'rgba(139, 92, 246, 0.06)' : 'transparent',
            }}
          >
            <UserCheck size={16} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            style={{
              padding: '14px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: tab === 'register' ? '#a78bfa' : 'var(--text-muted)',
              borderBottom: tab === 'register' ? '3px solid #8b5cf6' : '3px solid transparent',
              background: tab === 'register' ? 'rgba(139, 92, 246, 0.06)' : 'transparent',
            }}
          >
            <UserPlus size={16} />
            Create Private Account
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.84rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your private account username"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input"
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((s) => !s)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '0.95rem', marginTop: '4px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Private Board'}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    Password (Optional)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#10b981' }}>
                    Defaults to {DEFAULT_USER_PASSWORD}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder={`Leave blank to use default: ${DEFAULT_USER_PASSWORD}`}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="input"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((s) => !s)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this private board for?"
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  className="textarea"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '0.95rem', marginTop: '4px' }}
              >
                <Sparkles size={16} />
                {loading ? 'Creating...' : 'Create Private Account & Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
