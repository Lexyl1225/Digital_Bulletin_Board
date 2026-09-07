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
  Menu,
  X,
  ChevronRight,
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

// Uniform full-width list row used throughout the mobile menu so every
// button — regardless of label length — renders at the same size.
const MobileMenuRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  onClick: () => void;
  variant?: 'default' | 'active' | 'primary' | 'danger';
  trailing?: React.ReactNode;
  subLabelColor?: string;
}> = ({ icon, label, subLabel, onClick, variant = 'default', trailing, subLabelColor }) => {
  const isPrimary = variant === 'primary';
  const isActive = variant === 'active';
  const isDanger = variant === 'danger';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '13px',
        width: '100%',
        minHeight: '50px',
        padding: '12px 14px',
        borderRadius: '12px',
        fontFamily: 'inherit',
        textAlign: 'left',
        background: isPrimary
          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          : isActive
          ? 'rgba(59, 130, 246, 0.12)'
          : 'var(--bg-tertiary)',
        border: isPrimary
          ? 'none'
          : isActive
          ? '1px solid rgba(59, 130, 246, 0.35)'
          : '1px solid var(--border-color)',
        boxShadow: isPrimary ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          flexShrink: 0,
          color: isPrimary ? '#ffffff' : isActive ? 'var(--border-focus)' : isDanger ? '#f87171' : 'var(--text-secondary)',
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isPrimary ? '#ffffff' : isActive ? 'var(--border-focus)' : isDanger ? '#f87171' : 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        {subLabel && (
          <span
            style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 600,
              marginTop: '1px',
              color: subLabelColor || (isPrimary ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)'),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subLabel}
          </span>
        )}
      </span>
      {trailing}
    </button>
  );
};

const MobileMenuSectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: '0.68rem',
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      padding: '2px 6px',
    }}
  >
    {children}
  </div>
);

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

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [headerHeight, setHeaderHeight] = React.useState(72);
  const headerRef = React.useRef<HTMLElement>(null);
  const lastScrollY = React.useRef(0);

  // Auto-hide header on scroll-down to maximize viewing area; reveal on scroll-up.
  React.useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (mobileMenuOpen) {
        lastScrollY.current = currentY;
        return;
      }
      const delta = currentY - lastScrollY.current;
      if (currentY < 80) {
        setHidden(false);
      } else if (delta > 5) {
        setHidden(true);
      } else if (delta < -5) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Never hide the header while the mobile menu is open.
  React.useEffect(() => {
    if (mobileMenuOpen) setHidden(false);
  }, [mobileMenuOpen]);

  // Keep a spacer in sync with the header's real (possibly wrapped) height.
  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const viewSwitcherButtons = (
    <>
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
    </>
  );

  const actionControls = (
    <>
      {/* Quick Create Post Button: ONLY SHOWN WHEN LOGGED IN */}
      {activeUser && (
        <button onClick={onOpenCreatePostModal} className="btn btn-primary" style={{ gap: '6px' }}>
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
    </>
  );

  return (
    <>
      {/* Spacer keeps page content from jumping under the fixed header */}
      <div style={{ height: `${headerHeight}px`, flexShrink: 0 }} />

      <header
        ref={headerRef}
        className="glass-panel"
        style={{
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.3s ease',
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
                flexShrink: 0,
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

          {/* View Mode Switcher (Personal Board vs Team Overview) — desktop only */}
          <div
            className="navbar-desktop-group"
            style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            {viewSwitcherButtons}
          </div>

          {/* Action Controls & Authentication — desktop only */}
          <div className="navbar-desktop-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionControls}
          </div>

          {/* Hamburger Menu Toggle — mobile only */}
          <button
            className="navbar-hamburger-btn btn-icon"
            onClick={() => setMobileMenuOpen((open) => !open)}
            title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="navbar-mobile-menu glass-panel"
            onClick={(e) => {
              // Bubble phase: runs after the clicked button's own onClick has
              // already fired, so it never swallows the underlying action.
              if ((e.target as HTMLElement).closest('button')) {
                setMobileMenuOpen(false);
              }
            }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              borderRadius: 0,
              borderLeft: 'none',
              borderRight: 'none',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: 'calc(100vh - 100%)',
              overflowY: 'auto',
            }}
          >
            {/* Navigate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <MobileMenuSectionLabel>Navigate</MobileMenuSectionLabel>

              {!isPrivateUser && (
                <MobileMenuRow
                  icon={<Users size={18} />}
                  label="Team Overview"
                  onClick={() => onViewModeChange('team')}
                  variant={viewMode === 'team' ? 'active' : 'default'}
                />
              )}

              <MobileMenuRow
                icon={<UserCheck size={18} />}
                label={isPrivateUser ? 'Private Board' : activeUser ? 'Personal Board' : 'Public Board'}
                onClick={() => onViewModeChange('board')}
                variant={viewMode === 'board' ? 'active' : 'default'}
              />

              {activeUser && (
                <MobileMenuRow
                  icon={<Archive size={18} />}
                  label="Archive"
                  subLabel="Off the board & Master Feed"
                  onClick={() => onViewModeChange('archive')}
                  variant={viewMode === 'archive' ? 'active' : 'default'}
                />
              )}

              {isAdmin && (
                <MobileMenuRow
                  icon={<ShieldCheck size={18} />}
                  label="Admin"
                  subLabel="Manage users & posts"
                  onClick={() => onViewModeChange('admin')}
                  variant={viewMode === 'admin' ? 'active' : 'default'}
                />
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }} />

            {/* Account */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <MobileMenuSectionLabel>Account</MobileMenuSectionLabel>

              {activeUser && (
                <MobileMenuRow
                  icon={<Plus size={18} />}
                  label="New Post"
                  onClick={onOpenCreatePostModal}
                  variant="primary"
                />
              )}

              {activeUser ? (
                <>
                  <MobileMenuRow
                    icon={
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: activeUser.payload.avatarColor || '#3b82f6',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                        }}
                      >
                        {activeUser.name.charAt(0).toUpperCase()}
                      </div>
                    }
                    label={activeUser.name}
                    subLabel={usingDefaultPassword ? 'Default password — tap to secure' : 'Account settings'}
                    subLabelColor={usingDefaultPassword ? '#f59e0b' : undefined}
                    onClick={usingDefaultPassword ? onOpenSecurityModal : onOpenUserModal}
                    trailing={<ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                  />
                  <MobileMenuRow icon={<LogOut size={18} />} label="Log Out" onClick={onLogout} variant="danger" />
                </>
              ) : (
                <>
                  <MobileMenuRow
                    icon={<Lock size={18} />}
                    label="Private Board"
                    subLabel="Personal — not visible to the team"
                    onClick={onOpenPrivateLoginModal}
                  />
                  <MobileMenuRow
                    icon={<LogIn size={18} />}
                    label="Sign In"
                    onClick={() => onOpenLoginModal()}
                    variant="primary"
                  />
                </>
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }} />

            {/* Preferences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <MobileMenuSectionLabel>Preferences</MobileMenuSectionLabel>
              <MobileMenuRow
                icon={theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} />}
                label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                onClick={onToggleTheme}
              />
            </div>
          </div>
        )}
      </header>
    </>
  );
};
