import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldOff,
  Crown,
  Users,
  FileText,
  CheckCircle2,
  KeyRound,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ChevronsDownUp,
  ChevronsUpDown,
  Settings,
} from 'lucide-react';
import type { FormattedUser } from '../services/api';
import type { Category, Post, PostStatus, SiteSettings, UserPayload } from '../types';
import { AdminUserModal } from './AdminUserModal';

interface AdminDashboardProps {
  users: FormattedUser[];
  activeUser: FormattedUser;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (updates: Partial<SiteSettings>) => Promise<void>;
  onEditPost: (userId: number, post: Post) => void;
  onDeletePost: (userId: number, postId: string) => void;
  onUpdateUser: (userId: number, name: string, updates: Partial<UserPayload>) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
  onResetPassword: (userId: number) => void;
  onToggleAdmin: (userId: number) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    style={{
      width: '44px',
      height: '24px',
      borderRadius: '9999px',
      background: checked ? '#3b82f6' : 'var(--bg-secondary)',
      border: checked ? '1px solid #3b82f6' : '1px solid var(--border-color)',
      position: 'relative',
      flexShrink: 0,
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        transition: 'left 0.2s ease',
      }}
    />
  </button>
);

const CATEGORY_BADGE_CLASS: Record<Category, string> = {
  'Ongoing Works': 'badge badge-ongoing',
  'Upcoming Works': 'badge badge-upcoming',
  'Holiday Works': 'badge badge-holiday',
  'Completed Works': 'badge badge-completed',
};

const getStatusStyle = (status: PostStatus) => {
  switch (status) {
    case 'In Progress':
      return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
    case 'Completed':
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    case 'Under Review':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    case 'Blocked':
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    case 'Scheduled':
      return { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' };
    default:
      return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return '#f43f5e';
    case 'Medium':
      return '#fbbf24';
    default:
      return '#34d399';
  }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  activeUser,
  siteSettings,
  onUpdateSiteSettings,
  onEditPost,
  onDeletePost,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  onToggleAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingUser, setEditingUser] = useState<FormattedUser | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<number | null>(null);
  const [pendingDeletePostKey, setPendingDeletePostKey] = useState<string | null>(null);

  const totalPosts = users.reduce((sum, u) => sum + u.payload.posts.length, 0);
  const totalAdmins = users.filter((u) => u.payload.isAdmin).length;
  const totalCompleted = users.reduce(
    (sum, u) =>
      sum + u.payload.posts.filter((p) => p.category === 'Completed Works' || p.status === 'Completed').length,
    0
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = search.trim().toLowerCase();

  const userMatchesSearch = (u: FormattedUser) => {
    if (!q) return true;
    if (u.name.toLowerCase().includes(q)) return true;
    if (u.payload.role?.toLowerCase().includes(q)) return true;
    if (u.payload.department?.toLowerCase().includes(q)) return true;
    return u.payload.posts.some(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  };

  const getVisiblePosts = (u: FormattedUser): Post[] => {
    let posts = u.payload.posts;
    if (categoryFilter !== 'All') {
      posts = posts.filter((p) => p.category === categoryFilter);
    }
    if (q && !(u.name.toLowerCase().includes(q) || u.payload.role?.toLowerCase().includes(q))) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return posts;
  };

  const filteredUsers = users.filter(userMatchesSearch);
  const allExpanded = filteredUsers.length > 0 && filteredUsers.every((u) => expandedIds.has(u.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <ShieldCheck size={22} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Admin Dashboard</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Full control over every account and bulletin post on the board.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#93c5fd',
          }}
        >
          <Crown size={14} />
          Signed in as {activeUser.name} · Administrator
        </div>
      </div>

      {/* Homepage Settings */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
            <Settings size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Homepage Settings</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Control which sections appear on the Team Overview page for everyone, including guests.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Bulletin Matrix</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                The summary banner showing active member and total post counts.
              </div>
            </div>
            <ToggleSwitch
              checked={siteSettings.showTeamBulletinMatrix}
              onChange={() => onUpdateSiteSettings({ showTeamBulletinMatrix: !siteSettings.showTeamBulletinMatrix })}
              label="Show Team Bulletin Matrix"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Registered Team Members</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                The grid of member cards with per-user workload breakdowns.
              </div>
            </div>
            <ToggleSwitch
              checked={siteSettings.showRegisteredTeamMembers}
              onChange={() =>
                onUpdateSiteSettings({ showRegisteredTeamMembers: !siteSettings.showRegisteredTeamMembers })
              }
              label="Show Registered Team Members"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Users
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px' }}>{users.length}</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Posts
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--ongoing-bg)', color: 'var(--ongoing-color)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px' }}>{totalPosts}</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administrators
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Crown size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px' }}>{totalAdmins}</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--completed-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed Works
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--completed-bg)', color: 'var(--completed-color)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px' }}>{totalCompleted}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search users, roles, or post titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: '42px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
            className="select"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.82rem' }}
          >
            <option value="All">All Categories</option>
            <option value="Ongoing Works">Ongoing Works</option>
            <option value="Upcoming Works">Upcoming Works</option>
            <option value="Holiday Works">Holiday Works</option>
            <option value="Completed Works">Completed Works</option>
          </select>

          <button
            onClick={() => setExpandedIds(allExpanded ? new Set() : new Set(filteredUsers.map((u) => u.id)))}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            {allExpanded ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* User Accounts List */}
      {filteredUsers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No users or posts match your search.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredUsers.map((u) => {
            const isExpanded = expandedIds.has(u.id);
            const isSelf = u.id === activeUser.id;
            const isLastRemainingAdmin = !!u.payload.isAdmin && totalAdmins <= 1;
            const usingDefaultPassword = !!u.payload.usingDefaultPassword;
            const visiblePosts = getVisiblePosts(u);

            return (
              <div key={u.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                {/* Row Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpand(u.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    {isExpanded ? (
                      <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    ) : (
                      <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
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
                        flexShrink: 0,
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</span>
                        {u.payload.isAdmin && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            <Crown size={10} />
                            Admin
                          </span>
                        )}
                        {isSelf && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                            }}
                          >
                            You
                          </span>
                        )}
                        {usingDefaultPassword && (
                          <span
                            title="This account is using the shared default password"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            <ShieldAlert size={10} />
                            Default Password
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.payload.role}
                        {u.payload.department ? ` • ${u.payload.department}` : ''} • {u.payload.posts.length} posts
                      </div>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setEditingUser(u)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      title="Edit account details"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>

                    <button
                      onClick={() => onResetPassword(u.id)}
                      className="btn-icon"
                      title="Reset password to default"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <KeyRound size={15} />
                    </button>

                    <button
                      onClick={() => !isSelf && !isLastRemainingAdmin && onToggleAdmin(u.id)}
                      className="btn-icon"
                      disabled={isSelf || isLastRemainingAdmin}
                      title={
                        isSelf
                          ? 'You cannot change your own admin access'
                          : isLastRemainingAdmin
                          ? 'At least one administrator must remain'
                          : u.payload.isAdmin
                          ? 'Revoke administrator access'
                          : 'Grant administrator access'
                      }
                      style={{
                        width: '32px',
                        height: '32px',
                        color: u.payload.isAdmin ? '#f59e0b' : 'var(--text-secondary)',
                        opacity: isSelf || isLastRemainingAdmin ? 0.4 : 1,
                        cursor: isSelf || isLastRemainingAdmin ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {u.payload.isAdmin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                    </button>

                    {pendingDeleteUserId === u.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={async () => {
                            await onDeleteUser(u.id);
                            setPendingDeleteUserId(null);
                          }}
                          className="btn btn-danger"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setPendingDeleteUserId(null)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !isSelf && setPendingDeleteUserId(u.id)}
                        className="btn-icon"
                        disabled={isSelf}
                        title={isSelf ? 'You cannot delete your own account from here' : 'Delete user account'}
                        style={{ width: '32px', height: '32px', color: isSelf ? 'var(--text-muted)' : '#f87171', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: Posts List */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 18px 20px', borderTop: '1px solid var(--border-color)' }}>
                    {u.payload.posts.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '16px 0 0 0' }}>
                        This user hasn't created any posts yet.
                      </p>
                    ) : visiblePosts.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '16px 0 0 0' }}>
                        No posts match the current filter for this user.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                        {visiblePosts.map((post) => {
                          const statusStyle = getStatusStyle(post.status);
                          const postKey = `${u.id}:${post.id}`;

                          return (
                            <div
                              key={post.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                flexWrap: 'wrap',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px', minWidth: 0 }}>
                                <span
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: getPriorityColor(post.priority),
                                    flexShrink: 0,
                                  }}
                                  title={`${post.priority} Priority`}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '0.86rem',
                                      fontWeight: 700,
                                      color: 'var(--text-primary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {post.title}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Updated {new Date(post.updatedAt).toLocaleDateString()}
                                    {post.dueDate ? ` • Due ${post.dueDate}` : ''}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className={CATEGORY_BADGE_CLASS[post.category]} style={{ fontSize: '0.68rem' }}>
                                  {post.category.replace(' Works', '')}
                                </span>
                                <span
                                  style={{
                                    background: statusStyle.bg,
                                    color: statusStyle.color,
                                    padding: '2px 9px',
                                    borderRadius: '9999px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {post.status}
                                </span>

                                <button
                                  onClick={() => onEditPost(u.id, post)}
                                  className="btn-icon"
                                  title="Edit post"
                                  style={{ width: '28px', height: '28px' }}
                                >
                                  <Edit3 size={13} />
                                </button>

                                {pendingDeletePostKey === postKey ? (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      onClick={() => {
                                        onDeletePost(u.id, post.id);
                                        setPendingDeletePostKey(null);
                                      }}
                                      className="btn btn-danger"
                                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setPendingDeletePostKey(null)}
                                      className="btn btn-secondary"
                                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setPendingDeletePostKey(postKey)}
                                    className="btn-icon"
                                    title="Delete post"
                                    style={{ width: '28px', height: '28px', color: '#f87171' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit User Modal */}
      <AdminUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        targetUser={editingUser}
        allUsers={users}
        isLastRemainingAdmin={!!editingUser?.payload.isAdmin && totalAdmins <= 1}
        onSave={onUpdateUser}
      />
    </div>
  );
};
