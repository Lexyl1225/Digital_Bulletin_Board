import React, { useState } from 'react';
import {
  X,
  Lock,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { FormattedUser } from '../services/api';
import { loginUser } from '../services/api';
import { DEFAULT_AVATAR_COLORS, DEFAULT_USER_PASSWORD } from '../services/initialData';

interface LoginFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: FormattedUser[];
  onLogin: (user: FormattedUser, enteredPassword?: string) => Promise<boolean>;
  onRegister: (
    name: string,
    bio?: string,
    role?: string,
    password?: string,
    gender?:string,
    department?: string,
    avatarColor?: string
  ) => Promise<void>;
  promptMessage?: string;
}

export const LoginFormModal: React.FC<LoginFormModalProps> = ({
  isOpen,
  onClose,
  users,
  onLogin,
  onRegister,
  promptMessage,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [selectedUserId, setSelectedUserId] = useState<number | ''>(users[0]?.id ?? '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('Senior Engineer');
  const [regGender, setRegGender] =useState('Unknown');
  const [regDepartment, setRegDepartment] = useState('Engineering');
  const [regBio, setRegBio] = useState('Electrical / Systems Engineer & Bulletin Contributor');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAvatarColor, setRegAvatarColor] = useState(DEFAULT_AVATAR_COLORS[0]);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Selected user object in login tab
  const activeSelectedUser = users.find((u) => u.id === selectedUserId);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const userToAuth = activeSelectedUser;
    if (!userToAuth) {
      setErrorMsg('Please select a user account to sign in.');
      return;
    }

    try {
      setLoading(true);
      const authedUser = await loginUser(userToAuth.name, loginPassword);
      const success = await onLogin(authedUser);
      if (success) {
        setLoginPassword('');
        setErrorMsg('');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim()) {
      setErrorMsg('Please enter your full name or username.');
      return;
    }

    // Check duplicate name
    const exists = users.some(
      (u) => u.name.toLowerCase() === regName.trim().toLowerCase()
    );
    if (exists) {
      setErrorMsg(`A user named "${regName.trim()}" already exists. Please choose a unique name or log in.`);
      return;
    }

    try {
      setLoading(true);
      await onRegister(
        regName.trim(),
        regBio.trim(),
        regRole.trim(),
        regPassword.trim() || DEFAULT_USER_PASSWORD,
	regGender.trim(),
        regDepartment.trim(),
        regAvatarColor
      );
      setRegName('');
      setRegPassword('');
      setErrorMsg('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: '20px', overflow: 'hidden auto' }}
      >
        {/* Top Header */}
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                User Authentication
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                WorkPulse Digital Bulletin Board
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close (Continue as Guest)">
            <X size={20} />
          </button>
        </div>

        {/* Action Prompt Context Notice if triggered by add/edit */}
        {promptMessage && (
          <div
            style={{
              padding: '12px 24px',
              background: 'rgba(59, 130, 246, 0.12)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#93c5fd',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} color="#60a5fa" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Default Password Callout Banner */}
        <div
          style={{
            padding: '10px 24px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#34d399',
            lineHeight: 1.5,
          }}
        >
          <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Default password for all users:{' '}
            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#6ee7b7' }}>
              {DEFAULT_USER_PASSWORD}
            </code>
            . For your security, please change it immediately after signing in via{' '}
            <strong>Manage Profile → Change Password</strong>.
          </span>
        </div>

        {/* Tab Selection */}
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
              color: tab === 'login' ? 'var(--border-focus)' : 'var(--text-muted)',
              borderBottom: tab === 'login' ? '3px solid var(--border-focus)' : '3px solid transparent',
              background: tab === 'login' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <UserCheck size={16} />
            Log In ({users.length})
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
              color: tab === 'register' ? 'var(--border-focus)' : 'var(--text-muted)',
              borderBottom: tab === 'register' ? '3px solid var(--border-focus)' : '3px solid transparent',
              background: tab === 'register' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <UserPlus size={16} />
            Register New User
          </button>
        </div>

        {/* Modal Form Content */}
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

          {/* TAB 1: LOG IN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Quick User Selection Cards */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Select Account to Sign In
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {users.map((u) => {
                    const isSelected = selectedUserId === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-tertiary)',
                          border: isSelected ? '1.5px solid var(--border-focus)' : '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: u.payload.avatarColor || '#3b82f6',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {u.payload.role} • {u.payload.posts.length} works
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--border-focus)' }}>
                            Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder={`Enter password (${DEFAULT_USER_PASSWORD})...`}
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

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || !selectedUserId}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '0.95rem', marginTop: '4px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In & Access Dashboard'}
                <ArrowRight size={16} />
              </button>

              {/* Guest mode footer button */}
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
                >
                  Continue browsing in read-only guest mode
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Full Name / Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Gonzalez"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              {/* Role & Department Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Job Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Electrical Engineer"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operations"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

	      {/* Gender Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Gender
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Male, Female, Unknown"
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="input"
                  />
                </div>

              </div>



              {/* Password */}
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

              {/* Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Bio / Responsibilities
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of your domain and projects..."
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  className="textarea"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                  Avatar Color Theme
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {DEFAULT_AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setRegAvatarColor(col)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: col,
                        border: regAvatarColor === col ? '3px solid #ffffff' : 'none',
                        transform: regAvatarColor === col ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
              >
                <Sparkles size={16} />
                {loading ? 'Registering...' : 'Create Account & Sign In'}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
