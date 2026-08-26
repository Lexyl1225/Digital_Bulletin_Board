import React from 'react';
import {
  LayoutDashboard,
  Users,
  Plus,
  Moon,
  Sun,
  UserCheck,
  ChevronDown,
  LogIn,
  LogOut,
  ShieldCheck,
  Lock,
  Archive,
} from 'lucide-react';
import type { FormattedUser } from '../services/api';
import type { ViewMode } from '../types';

interface NavbarProps {
  activeUser: FormattedUser | null;
  allUsers: FormattedUser[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isAdmin: boolean;
  onOpenLoginModal: (prompt?: string) => void;
  onOpenPrivateLoginModal: () => void;
  onOpenUserModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenCreatePostModal: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  viewMode,
  onViewModeChange,
  isAdmin,
  onOpenLoginModal,
  onOpenPrivateLoginModal,
  onOpenUserModal,
  onOpenSecurityModal,
  onOpenCreatePostModal,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const usingDefaultPassword = !!activeUser && !!activeUser.payload.usingDefaultPassword;
  const isPrivateUser = !!activeUser?.payload.isPrivate;
  return (
    <header
      className="glass-panel"
      style={{
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
            }}
          >
            <LayoutDashboard size={24} color="#ffffff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isPrivateUser ? 'Personal Bulletin Board' : 'Engineers Bulletin Board'}
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {isPrivateUser ? 'Private, personal-use only board' : 'Multi-User Digital Bulletin Board'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Personal Board vs Team Overview) */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          {!isPrivateUser && (
            <button
              onClick={() => onViewModeChange('team')}
              className={`btn ${viewMode === 'team' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem', border: 'none' }}
            >
              <Users size={16} />
              Team Overview
            </button>
          )}

	  <button
            onClick={() => onViewModeChange('board')}
            className={`btn ${viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', border: 'none' }}
          >
            <UserCheck size={16} />
            {isPrivateUser ? 'Private Board' : activeUser ? 'Personal Board' : 'Public Board'}
          </button>

          {activeUser && (
            <button
              onClick={() => onViewModeChange('archive')}
              className={`btn ${viewMode === 'archive' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem', border: 'none' }}
              title="Archived posts — off the board and out of the Master Team Feed"
            >
              <Archive size={16} />
              Archive
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onViewModeChange('admin')}
              className={`btn ${viewMode === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem', border: 'none' }}
              title="Manage all users and posts"
            >
              <ShieldCheck size={16} />
              Admin
            </button>
          )}
        </div>

        {/* Action Controls & Authentication */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Quick Create Post Button: ONLY SHOWN WHEN LOGGED IN */}
          {activeUser && (
            <button
              onClick={onOpenCreatePostModal}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              <Plus size={18} />
              New Post
            </button>
          )}

          {/* User Account / Login State */}
          {activeUser ? (
            /* Logged In User Pill */
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={usingDefaultPassword ? onOpenSecurityModal : onOpenUserModal}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                }}
                title={
                  usingDefaultPassword
                    ? 'Default password in use — click to update it now'
                    : 'Account Settings & Profile'
                }
              >
                <div style={{ position: 'relative', width: '28px', height: '28px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: activeUser.payload.avatarColor || '#3b82f6',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                  {usingDefaultPassword && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '2px solid var(--bg-secondary)',
                      }}
                    />
                  )}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeUser.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: usingDefaultPassword ? '#f59e0b' : 'var(--ongoing-color)',
                      fontWeight: 600,
                    }}
                  >
                    {usingDefaultPassword ? '● Update password' : '● Logged In'}
                  </div>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="btn-icon"
                title="Log Out"
                style={{ color: '#f87171', width: '34px', height: '34px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* Guest / Unauthenticated State */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onOpenPrivateLoginModal}
                className="btn btn-secondary"
                title="Sign in to a private/personal board — not visible to the team"
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                }}
              >
                <Lock size={14} />
                Private Board
              </button>
              <button
                onClick={() => onOpenLoginModal()}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              >
                <LogIn size={16} />
                Sign In
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button onClick={onToggleTheme} className="btn-icon" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#64748b" />}
          </button>
        </div>

      </div>
    </header>
  );
};
