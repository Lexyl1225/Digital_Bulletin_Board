import React, { useEffect, useState } from 'react';
import { X, Save, AlertCircle, UserCog, ShieldCheck, Lock } from 'lucide-react';
import type { FormattedUser } from '../services/api';
import type { UserPayload } from '../types';
import { DEFAULT_AVATAR_COLORS } from '../services/initialData';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: FormattedUser | null;
  allUsers: FormattedUser[];
  isLastRemainingAdmin: boolean;
  onSave: (userId: number, name: string, updates: Partial<UserPayload>) => Promise<void>;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  allUsers,
  isLastRemainingAdmin,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLORS[0]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && targetUser) {
      setName(targetUser.name);
      setRole(targetUser.payload.role || '');
      setDepartment(targetUser.payload.department || '');
      setBio(targetUser.payload.bio || '');
      setAvatarColor(targetUser.payload.avatarColor || DEFAULT_AVATAR_COLORS[0]);
      setIsAdmin(!!targetUser.payload.isAdmin);
      setErrorMsg('');
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a name for this account.');
      return;
    }
    const duplicate = allUsers.some(
      (u) => u.id !== targetUser.id && u.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`A user named "${name.trim()}" already exists. Please choose a unique name.`);
      return;
    }

    try {
      setLoading(true);
      await onSave(targetUser.id, name.trim(), {
        role: role.trim() || 'Team Member',
        department: department.trim() || undefined,
        bio: bio.trim(),
        avatarColor,
        isAdmin,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update this account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <UserCog size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit User Account</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Administrator controls for {targetUser.name}'s account
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Full Name / Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Job Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Bio / Description
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
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
                  onClick={() => setAvatarColor(col)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: col,
                    border: avatarColor === col ? '3px solid #ffffff' : 'none',
                    transform: avatarColor === col ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Administrator Access Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              cursor: isLastRemainingAdmin && isAdmin ? 'not-allowed' : 'pointer',
              opacity: isLastRemainingAdmin && isAdmin ? 0.7 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={isAdmin}
              disabled={isLastRemainingAdmin && isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#3b82f6' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700 }}>
                <ShieldCheck size={14} color="#3b82f6" />
                Administrator Access
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {isLastRemainingAdmin && isAdmin
                  ? 'This is the last remaining administrator, so this cannot be revoked here.'
                  : 'Admins can view, edit, and delete every account and post on the board.'}
              </div>
            </div>
          </label>

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
            <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              Passwords aren't editable here. Use "Reset Password" from the dashboard to restore the
              shared default so the user can sign back in.
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '4px',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
