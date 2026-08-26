import React, { useEffect, useState } from 'react';
import { X, UserPlus, Check, Trash2, ShieldAlert, ShieldCheck, Sparkles, KeyRound, Eye, EyeOff, CheckCircle2, UserCog } from 'lucide-react';
import type { FormattedUser } from '../services/api';
import type { UserPayload } from '../types';
import { DEFAULT_AVATAR_COLORS } from '../services/initialData';

type ModalTab = 'select' | 'create' | 'edit' | 'security';

interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: FormattedUser[];
  activeUser: FormattedUser | null;
  initialTab?: ModalTab;
  onSelectUser: (user: FormattedUser) => void;
  onCreateUser: (name: string, bio?: string, role?: string) => Promise<void>;
  onUpdateProfile: (bio: string, role: string, avatarColor: string) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onUpdateUser: (userId: number, name: string, updates: Partial<UserPayload>) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
}

export const UserSelectorModal: React.FC<UserSelectorModalProps> = ({
  isOpen,
  onClose,
  users,
  activeUser,
  initialTab = 'select',
  onSelectUser,
  onCreateUser,
  onUpdateProfile,
  onChangePassword,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [tab, setTab] = useState<ModalTab>('select');

  // New User state
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Engineer / Project Lead');
  const [newUserBio, setNewUserBio] = useState('Digital bulletin board contributor');

  // Edit Profile state
  const [editRole, setEditRole] = useState(activeUser?.payload.role || '');
  const [editBio, setEditBio] = useState(activeUser?.payload.bio || '');
  const [editColor, setEditColor] = useState(activeUser?.payload.avatarColor || DEFAULT_AVATAR_COLORS[0]);

  // Admin-only: Rename Another User state
  const [renameTargetId, setRenameTargetId] = useState<number | ''>('');
  const [renameNewName, setRenameNewName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState('');
  const [renameSuccess, setRenameSuccess] = useState(false);

  // Security / Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset to the requested tab & clear sensitive/error state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg('');
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setRenameTargetId('');
      setRenameNewName('');
      setRenameError('');
      setRenameSuccess(false);
      if (activeUser) {
        setEditRole(activeUser.payload.role);
        setEditBio(activeUser.payload.bio);
        setEditColor(activeUser.payload.avatarColor || DEFAULT_AVATAR_COLORS[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isUsingDefaultPassword = !!activeUser && !!activeUser.payload.usingDefaultPassword;
  // A private account's board is never shared with — or switched to from —
  // anyone else, so the account switcher tab has nothing to offer it.
  const isPrivateUser = !!activeUser?.payload.isPrivate;

  const getPasswordStrength = (pwd: string): { label: string; color: string; percent: number } => {
    if (!pwd) return { label: '', color: 'var(--text-muted)', percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', color: '#f43f5e', percent: 25 };
    if (score <= 2) return { label: 'Fair', color: '#f59e0b', percent: 50 };
    if (score <= 3) return { label: 'Good', color: '#38bdf8', percent: 75 };
    return { label: 'Strong', color: '#10b981', percent: 100 };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    try {
      setLoading(true);
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setErrorMsg('Please enter a unique username.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      await onCreateUser(newUserName.trim(), newUserBio.trim(), newUserRole.trim());
      setNewUserName('');
      setTab('select');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      await onUpdateProfile(editBio.trim(), editRole.trim(), editColor);
      setTab('select');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Admin-only: rename a different user's account
  const handleRenameUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenameError('');
    setRenameSuccess(false);

    if (!renameTargetId) {
      setRenameError('Please select a user to rename.');
      return;
    }
    if (!renameNewName.trim()) {
      setRenameError('Please enter a new full name.');
      return;
    }
    const duplicate = users.some(
      (u) => u.id !== renameTargetId && u.name.toLowerCase() === renameNewName.trim().toLowerCase()
    );
    if (duplicate) {
      setRenameError(`A user named "${renameNewName.trim()}" already exists. Please choose a unique name.`);
      return;
    }

    try {
      setRenameLoading(true);
      await onUpdateUser(renameTargetId, renameNewName.trim(), {});
      setRenameSuccess(true);
    } catch (err: any) {
      setRenameError(err.message || 'Failed to rename this user.');
    } finally {
      setRenameLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              User Account Switcher
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Select an account or register a new user in the SQLite backend
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 24px',
            background: 'var(--bg-secondary)',
          }}
        >
          {!isPrivateUser && (
            <button
              onClick={() => {
                setTab('select');
                setErrorMsg('');
              }}
              style={{
                padding: '12px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: tab === 'select' ? 'var(--border-focus)' : 'var(--text-muted)',
                borderBottom: tab === 'select' ? '2px solid var(--border-focus)' : '2px solid transparent',
              }}
            >
              Existing Users ({users.length})
            </button>
          )}
          {activeUser?.payload.isAdmin && (
            <button
              onClick={() => {
                setTab('create');
                setErrorMsg('');
              }}
              style={{
                padding: '12px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: tab === 'create' ? 'var(--border-focus)' : 'var(--text-muted)',
                borderBottom: tab === 'create' ? '2px solid var(--border-focus)' : '2px solid transparent',
              }}
            >
              + Create New User
            </button>
          )}
          {activeUser && (
            <button
              onClick={() => {
                setEditRole(activeUser.payload.role);
                setEditBio(activeUser.payload.bio);
                setEditColor(activeUser.payload.avatarColor || DEFAULT_AVATAR_COLORS[0]);
                setTab('edit');
                setErrorMsg('');
              }}
              style={{
                padding: '12px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: tab === 'edit' ? 'var(--border-focus)' : 'var(--text-muted)',
                borderBottom: tab === 'edit' ? '2px solid var(--border-focus)' : '2px solid transparent',
              }}
            >
              Edit My Profile
            </button>
          )}
          {activeUser && (
            <button
              onClick={() => {
                setTab('security');
                setErrorMsg('');
                setPasswordSuccess(false);
              }}
              style={{
                padding: '12px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: tab === 'security' ? 'var(--border-focus)' : 'var(--text-muted)',
                borderBottom: tab === 'security' ? '2px solid var(--border-focus)' : '2px solid transparent',
              }}
            >
              <KeyRound size={14} />
              Change Password
              {isUsingDefaultPassword && (
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    display: 'inline-block',
                  }}
                  title="Default password in use"
                />
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={16} />
              {errorMsg}
            </div>
          )}

          {/* TAB 1: Select Existing User */}
          {tab === 'select' && !isPrivateUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map((u) => {
                const isActive = activeUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-tertiary)',
                      border: isActive ? '1.5px solid var(--border-focus)' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: u.payload.avatarColor || '#3b82f6',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                        }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.name} {isActive && <span style={{ fontSize: '0.75rem', color: 'var(--ongoing-color)', marginLeft: '6px' }}>(Active)</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {u.payload.role} • {u.payload.posts.length} Posts
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isActive && <Check size={18} color="var(--border-focus)" />}
                      {activeUser?.payload.isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete user '${u.name}'?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="btn-icon"
                          title="Delete User (Administrator only)"
                          style={{ color: '#f87171' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Create New User */}
          {tab === 'create' && activeUser?.payload.isAdmin && (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Full Name / Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Job Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Electrical Engineer"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Bio / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of responsibilities or expertise..."
                  value={newUserBio}
                  onChange={(e) => setNewUserBio(e.target.value)}
                  className="textarea"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
                <UserPlus size={16} />
                {loading ? 'Creating...' : 'Register User'}
              </button>
            </form>
          )}

          {/* TAB 3: Edit Profile */}
          {tab === 'edit' && activeUser && (
            <form onSubmit={handleEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Job Role / Title
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Bio / Description
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="textarea"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                  Avatar Color Theme
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {DEFAULT_AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setEditColor(col)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: col,
                        border: editColor === col ? '3px solid #ffffff' : 'none',
                        transform: editColor === col ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px' }}>
                <Sparkles size={16} />
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}

          {/* Admin-only: Rename Another User */}
          {tab === 'edit' && activeUser?.payload.isAdmin && (
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <UserCog size={16} color="#f59e0b" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Rename Another User</h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Administrator tool: update the Full Name / Username on any other account.
              </p>

              {users.filter((u) => u.id !== activeUser.id).length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  There are no other user accounts to rename yet.
                </p>
              ) : (
                <form onSubmit={handleRenameUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {renameError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ShieldAlert size={14} />
                      {renameError}
                    </div>
                  )}

                  {renameSuccess && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={14} />
                      User renamed successfully.
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      Select User
                    </label>
                    <select
                      value={renameTargetId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setRenameTargetId(id);
                        const target = users.find((u) => u.id === id);
                        setRenameNewName(target?.name || '');
                        setRenameError('');
                        setRenameSuccess(false);
                      }}
                      className="select"
                    >
                      <option value="">Choose a user...</option>
                      {users
                        .filter((u) => u.id !== activeUser.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      New Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter new full name"
                      value={renameNewName}
                      onChange={(e) => {
                        setRenameNewName(e.target.value);
                        setRenameSuccess(false);
                      }}
                      className="input"
                      disabled={!renameTargetId}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={renameLoading || !renameTargetId}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <UserCog size={14} />
                    {renameLoading ? 'Renaming...' : 'Rename User'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: Security / Change Password */}
          {tab === 'security' && activeUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isUsingDefaultPassword && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#f59e0b',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    This account is still using the shared default password. Set a personal
                    password below to secure it.
                  </span>
                </div>
              )}

              {passwordSuccess && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={16} />
                  Password updated successfully.
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Current Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input"
                      style={{ paddingRight: '40px' }}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((s) => !s)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      style={{ paddingRight: '40px' }}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${passwordStrength.percent}%`,
                            height: '100%',
                            backgroundColor: passwordStrength.color,
                            borderRadius: '3px',
                            transition: 'width 0.25s ease, background-color 0.25s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: passwordStrength.color, fontWeight: 700, marginTop: '4px' }}>
                        {passwordStrength.label} password
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      style={{ paddingRight: '40px' }}
                      autoComplete="new-password"
                      required
                    />
                    {confirmPassword && newPassword === confirmPassword && (
                      <Check
                        size={16}
                        color="#10b981"
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    )}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '6px' }}>
                      Passwords do not match.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>Use at least 6 characters. Combining letters, numbers, and symbols makes your password stronger.</span>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '4px' }}>
                  <KeyRound size={16} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
