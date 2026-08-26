import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Search,
  Edit3,
  Trash2,
  Inbox,
  Users,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Tag,
} from 'lucide-react';
import type { FormattedUser } from '../services/api';
import type { Category, Post } from '../types';

interface ArchivePageProps {
  activeUser: FormattedUser;
  users: FormattedUser[];
  useTaskLabels?: boolean;
  onEditPost: (post: Post) => void;
  onRestorePost: (postId: string) => void;
  onDeletePost: (userId: number, postId: string) => void;
}

const CATEGORY_COLOR: Record<Category, string> = {
  'Ongoing Works': 'var(--ongoing-color)',
  'Upcoming Works': 'var(--upcoming-color)',
  'Holiday Works': 'var(--holiday-color)',
  'Completed Works': 'var(--completed-color)',
};

const CATEGORY_BG: Record<Category, string> = {
  'Ongoing Works': 'var(--ongoing-bg)',
  'Upcoming Works': 'var(--upcoming-bg)',
  'Holiday Works': 'var(--holiday-bg)',
  'Completed Works': 'var(--completed-bg)',
};

const categoryLabel = (cat: Category, useTaskLabels?: boolean) =>
  useTaskLabels ? cat.replace('Works', 'Tasks') : cat;

const matchesSearch = (post: Post, query: string) => {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    post.title.toLowerCase().includes(q) ||
    post.content.toLowerCase().includes(q) ||
    (post.tags || []).some((t) => t.toLowerCase().includes(q))
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      padding: '36px 20px',
      textAlign: 'center',
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px dashed var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    <Inbox size={30} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px' }}>{text}</p>
  </div>
);

const ArchivedCard: React.FC<{
  post: Post;
  useTaskLabels?: boolean;
  ownerName?: string;
  ownerColor?: string;
  canManage: boolean;
  onEdit?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}> = ({ post, useTaskLabels, ownerName, ownerColor, canManage, onEdit, onRestore, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = CATEGORY_COLOR[post.category];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderLeft: `4px solid ${color}`,
        opacity: 0.92,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            background: CATEGORY_BG[post.category],
            color,
            border: `1px solid ${color}`,
            padding: '2px 9px',
            borderRadius: '9999px',
            fontSize: '0.68rem',
            fontWeight: 700,
          }}
        >
          {categoryLabel(post.category, useTaskLabels)}
        </span>
        {ownerName && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: ownerColor || '#3b82f6',
                display: 'inline-block',
              }}
            />
            {ownerName}
          </span>
        )}
      </div>

      <h4
        style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'line-through',
          textDecorationColor: 'var(--text-muted)',
          textDecorationThickness: '1px',
        }}
      >
        {post.title}
      </h4>

      <p
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.content}
      </p>

      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '10px',
          marginTop: '2px',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <Calendar size={12} />
          {post.archivedAt ? (
            <span>Archived: {new Date(post.archivedAt).toLocaleDateString()}</span>
          ) : (
            <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
          )}
        </div>

        {confirmDelete ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={onDelete}
              className="btn btn-danger"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {canManage && onEdit && (
              <button onClick={onEdit} className="btn-icon" title="Edit Archived Post" style={{ width: '26px', height: '26px' }}>
                <Edit3 size={13} />
              </button>
            )}
            {canManage && onRestore && (
              <button
                onClick={onRestore}
                className="btn-icon"
                title="Restore to Board"
                style={{ width: '26px', height: '26px', color: 'var(--ongoing-color)' }}
              >
                <ArchiveRestore size={13} />
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-icon"
              title="Delete Permanently"
              style={{ width: '26px', height: '26px', color: '#f87171' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ArchivePage: React.FC<ArchivePageProps> = ({
  activeUser,
  users,
  useTaskLabels,
  onEditPost,
  onRestorePost,
  onDeletePost,
}) => {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const isPrivate = !!activeUser.payload.isPrivate;
  const isAdmin = !!activeUser.payload.isAdmin;

  const myArchive = useMemo(
    () => activeUser.payload.archivedPosts.filter((p) => matchesSearch(p, search)),
    [activeUser.payload.archivedPosts, search]
  );

  // Admin-only: every OTHER non-private user whose archive has at least one
  // matching item. Private accounts never appear in `users` at all (the
  // backend excludes them from GET /users unconditionally), so there's
  // nothing further to filter here for privacy — it's structurally
  // impossible for a private archive to show up in this list.
  const teamArchives = useMemo(() => {
    if (!isAdmin) return [];
    return users
      .filter((u) => u.id !== activeUser.id)
      .map((u) => ({ user: u, posts: u.payload.archivedPosts.filter((p) => matchesSearch(p, search)) }))
      .filter((entry) => entry.posts.length > 0);
  }, [isAdmin, users, activeUser.id, search]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalTeamArchived = teamArchives.reduce((sum, e) => sum + e.posts.length, 0);

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
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(100, 116, 139, 0.18)', color: 'var(--text-secondary)' }}>
              <Archive size={22} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{isPrivate ? 'Private Archive' : 'My Archive'}</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
            {isPrivate
              ? 'Fully yours — visible and manageable only by you. No one else, including administrators, can see it.'
              : 'Archived posts are pulled off your board and out of the Team Overview master feed. Restore or delete them anytime.'}
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search archive by title, content, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* My Archive */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
            {isPrivate ? 'Archived Items' : 'My Archived Posts'}
          </h3>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              padding: '2px 10px',
              borderRadius: '9999px',
            }}
          >
            {myArchive.length}
          </span>
        </div>

        {myArchive.length === 0 ? (
          <EmptyState
            text={
              activeUser.payload.archivedPosts.length === 0
                ? 'Your archive is empty. Use the Archive button on any post to move it here.'
                : 'No archived posts match your search.'
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '16px',
            }}
          >
            {myArchive.map((post) => (
              <ArchivedCard
                key={post.id}
                post={post}
                useTaskLabels={useTaskLabels}
                canManage
                onEdit={() => onEditPost(post)}
                onRestore={() => onRestorePost(post.id)}
                onDelete={() => onDeletePost(activeUser.id, post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Team Archives — Admin only, and structurally never includes a private account */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '7px', borderRadius: '9px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <Users size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Team Archives</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Administrator view — you may delete entries, but cannot edit or restore another member's archived post.
                </p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#93c5fd',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '4px 10px',
                borderRadius: '9999px',
              }}
            >
              <ShieldCheck size={13} />
              {totalTeamArchived} item{totalTeamArchived === 1 ? '' : 's'} across {teamArchives.length} member
              {teamArchives.length === 1 ? '' : 's'}
            </span>
          </div>

          {teamArchives.length === 0 ? (
            <EmptyState text="No team members currently have archived posts matching this view." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teamArchives.map(({ user, posts }) => {
                const isExpanded = expandedIds.has(user.id);
                return (
                  <div key={user.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleExpanded(user.id)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: user.payload.avatarColor || '#3b82f6',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {posts.length} archived post{posts.length === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          padding: '16px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                          gap: '14px',
                        }}
                      >
                        {posts.map((post) => (
                          <ArchivedCard
                            key={post.id}
                            post={post}
                            useTaskLabels={useTaskLabels}
                            canManage={false}
                            onDelete={() => onDeletePost(user.id, post.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
