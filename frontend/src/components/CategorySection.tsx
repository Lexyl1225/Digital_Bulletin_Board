import React from 'react';
import { Activity, Clock, Palmtree, CheckCircle2, Plus, Layers } from 'lucide-react';
import type { Post, Category, PostStatus } from '../types';
import { PostCard } from './PostCard';

interface CategorySectionProps {
  category: Category;
  posts: Post[];
  isLoggedIn?: boolean;
  onAddPost: (category: Category) => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onStatusChange: (postId: string, nextStatus: PostStatus) => void;
  onArchivePost?: (postId: string) => void;
  layoutMode: 'grid' | 'kanban' | 'list';
  // On a private/personal board, the card titles read "Tasks" instead of
  // "Works" — this doesn't change the underlying Category data values,
  // only the label rendered on the card.
  useTaskLabels?: boolean;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  posts,
  isLoggedIn = false,
  onAddPost,
  onEditPost,
  onDeletePost,
  onStatusChange,
  onArchivePost,
  layoutMode,
  useTaskLabels = false,
}) => {
  // Category configuration
  const getCategoryConfig = (cat: Category) => {
    switch (cat) {
      case 'Ongoing Works':
        return {
          icon: <Activity size={20} color="var(--ongoing-color)" />,
          color: 'var(--ongoing-color)',
          bg: 'var(--ongoing-bg)',
          border: 'var(--ongoing-border)',
          title: useTaskLabels ? 'Ongoing Tasks' : 'Ongoing Works',
          subtitle: 'Active, operational tasks & items currently in progress',
        };
      case 'Upcoming Works':
        return {
          icon: <Clock size={20} color="var(--upcoming-color)" />,
          color: 'var(--upcoming-color)',
          bg: 'var(--upcoming-bg)',
          border: 'var(--upcoming-border)',
          title: useTaskLabels ? 'Upcoming Tasks' : 'Upcoming Works',
          subtitle: 'Scheduled future initiatives, planning & upcoming milestones',
        };
      case 'Holiday Works':
        return {
          icon: <Palmtree size={20} color="var(--holiday-color)" />,
          color: 'var(--holiday-color)',
          bg: 'var(--holiday-bg)',
          border: 'var(--holiday-border)',
          title: useTaskLabels ? 'Holiday Tasks' : 'Holiday Works',
          subtitle: 'Leave period handovers, emergency on-call duty & automated tasks',
        };
      case 'Completed Works':
        return {
          icon: <CheckCircle2 size={20} color="var(--completed-color)" />,
          color: 'var(--completed-color)',
          bg: 'var(--completed-bg)',
          border: 'var(--completed-border)',
          title: useTaskLabels ? 'Completed Tasks' : 'Completed Works',
          subtitle: 'Finished, verified, & signed-off bulletin work items',
        };
    }
  };

  const config = getCategoryConfig(category);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderTop: `4px solid ${config.color}`,
        // Was a hardcoded dark navy rgba, which ignored light theme
        // entirely and muddied text contrast there. var(--bg-glass) is
        // the same theme-aware background .glass-panel already uses.
        background: 'var(--bg-glass)',
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: config.bg, border: `1px solid ${config.border}` }}>
            {config.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {config.title}
              </h2>
              <span
                style={{
                  background: config.bg,
                  color: config.color,
                  border: `1px solid ${config.border}`,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {posts.length}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Quick Add Button: ONLY SHOWN WHEN USER IS LOGGED IN */}
        {isLoggedIn && (
          <button
            onClick={() => onAddPost(category)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            <Plus size={14} />
            Add Item
          </button>
        )}
      </div>

      {/* Posts Container */}
      {posts.length === 0 ? (
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
          <Layers size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            No posts in {config.title}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
            {category === 'Completed Works'
              ? 'Works marked as Completed will automatically appear in this section.'
              : isLoggedIn
              ? 'Click below to create your first bulletin item in this section.'
              : 'Sign in to add work items to this section.'}
          </p>
          {isLoggedIn && (
            <button
              onClick={() => onAddPost(category)}
              className="btn btn-primary"
              style={{ marginTop: '8px', padding: '6px 14px', fontSize: '0.8rem' }}
            >
              <Plus size={14} />
              Post to {config.title}
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              layoutMode === 'list'
                ? '1fr'
                : 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={isLoggedIn}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              onStatusChange={onStatusChange}
              onArchive={onArchivePost}
            />
          ))}
        </div>
      )}

    </div>
  );
};
