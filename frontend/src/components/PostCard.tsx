import React, { useState } from 'react';
import { Calendar, Tag, Edit3, Trash2, CheckCircle, Clock, AlertTriangle, FileText, RotateCcw, Pin, Archive } from 'lucide-react';
import type { Post, PostStatus } from '../types';

interface PostCardProps {
  post: Post;
  isLoggedIn?: boolean;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onStatusChange: (postId: string, nextStatus: PostStatus) => void;
  // Optional — omitted wherever a card is rendered read-only or already
  // inside the archive itself (an archived post can't be re-archived).
  onArchive?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isLoggedIn = false,
  onEdit,
  onDelete,
  onStatusChange,
  onArchive,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Status color mapping
  const getStatusBadgeStyle = (status: PostStatus) => {
    switch (status) {
      case 'In Progress':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'Completed':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Under Review':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Blocked':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Scheduled':
        return { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' };
      default:
        return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
    }
  };

  // Priority badge styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return { color: '#f43f5e', label: 'High Priority' };
      case 'Medium':
        return { color: '#fbbf24', label: 'Medium Priority' };
      default:
        return { color: '#34d399', label: 'Low Priority' };
    }
  };

  // Cycle status on quick action
  const cycleStatus = () => {
    if (!isLoggedIn) return;
    const sequence: PostStatus[] = ['Pending', 'In Progress', 'Under Review', 'Completed'];
    const currentIndex = sequence.indexOf(post.status);
    const nextStatus = sequence[(currentIndex + 1) % sequence.length];
    onStatusChange(post.id, nextStatus);
  };

  const statusStyle = getStatusBadgeStyle(post.status);
  const priorityStyle = getPriorityStyle(post.priority);

  // Check if due date is near or past
  const isOverdue = post.dueDate && new Date(post.dueDate) < new Date() && post.status !== 'Completed';

  const getBorderColor = () => {
    if (post.category === 'Completed Works' || post.status === 'Completed') {
      return 'var(--completed-color)';
    }
    switch (post.category) {
      case 'Ongoing Works':
        return 'var(--ongoing-color)';
      case 'Upcoming Works':
        return 'var(--upcoming-color)';
      case 'Holiday Works':
        return 'var(--holiday-color)';
      default:
        return 'var(--border-focus)';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        // Layer the "completed" tint ON TOP of the normal card background
        // (instead of a bare low-alpha rgba, which let the page background
        // show through and looked grayed-out in light theme) so completed
        // cards keep the same base color/contrast as every other card.
        background:
          post.status === 'Completed'
            ? 'linear-gradient(rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.08)), var(--bg-card)'
            : 'var(--bg-card)',
        borderLeft: `4px solid ${getBorderColor()}`,
      }}
    >
      {/* Pin Tag — upper-center, simulating a physical bulletin board pin */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-26px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-6deg)',
          zIndex: 2,
          filter: 'drop-shadow(0 3px 3px rgba(0, 0, 0, 0.35))',
          pointerEvents: 'none',
        }}
      >
        <Pin size={40} fill={getBorderColor()} color="rgba(0, 0, 0, 0.35)" strokeWidth={1.25} />
      </div>

      {/* Card Header: Category & Priority & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Priority Pill */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: priorityStyle.color,
              boxShadow: `0 0 8px ${priorityStyle.color}`,
            }}
            title={priorityStyle.label}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: priorityStyle.color }}>
            {post.priority} Priority
          </span>
          {post.originalCategory && post.category === 'Completed Works' && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({post.originalCategory})
            </span>
          )}
        </div>

        {/* Status Badge */}
        {isLoggedIn ? (
          <button
            onClick={cycleStatus}
            title="Click to cycle status"
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            {post.status === 'Completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
            {post.status}
          </button>
        ) : (
          <div
            title={`Status: ${post.status}`}
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {post.status === 'Completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
            {post.status}
          </div>
        )}
      </div>

      {/* Title & Description */}
      <div>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: '6px',
            textDecoration: post.status === 'Completed' ? 'line-through' : 'none',
            opacity: post.status === 'Completed' ? 0.75 : 1,
          }}
        >
          {post.title}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.content}
        </p>
      </div>

      {/* Progress Bar (if ongoing or completion percent exists) */}
      {typeof post.completionPercent === 'number' && (
        <div style={{ marginTop: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Progress</span>
            <span style={{ fontWeight: 700, color: post.status === 'Completed' ? 'var(--completed-color)' : 'var(--ongoing-color)' }}>
              {post.completionPercent}%
            </span>
          </div>
          <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${post.completionPercent}%`,
                height: '100%',
                backgroundColor: post.status === 'Completed' ? 'var(--completed-color)' : 'var(--ongoing-color)',
                borderRadius: '3px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Assignee Notes snippet if present */}
      {post.assigneeNotes && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            border: '1px solid var(--border-color)',
          }}
        >
          <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontStyle: 'italic' }}>{post.assigneeNotes}</span>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Dates & (if logged in) Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          marginTop: '4px',
        }}
      >
        {/* Date information */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isOverdue ? '#f87171' : 'var(--text-muted)' }}>
          <Calendar size={13} />
          {post.status === 'Completed' && post.completedAt ? (
            <span>Finished: {new Date(post.completedAt).toLocaleDateString()}</span>
          ) : post.dueDate ? (
            <span>
              {isOverdue && <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />}
              Due: {post.dueDate}
            </span>
          ) : (
            <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Action Buttons: ONLY SHOWN WHEN LOGGED IN */}
        {isLoggedIn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {post.status === 'Completed' && (
              <button
                onClick={() => onStatusChange(post.id, 'In Progress')}
                className="btn-icon"
                title="Reopen Work"
                style={{ width: '28px', height: '28px', color: 'var(--ongoing-color)' }}
              >
                <RotateCcw size={14} />
              </button>
            )}

            {showConfirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => onDelete(post.id)}
                  className="btn btn-danger"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onEdit(post)}
                  className="btn-icon"
                  title="Edit Post"
                  style={{ width: '28px', height: '28px' }}
                >
                  <Edit3 size={14} />
                </button>
                {onArchive && (
                  <button
                    onClick={() => onArchive(post.id)}
                    className="btn-icon"
                    title="Move to Archive"
                    style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                  >
                    <Archive size={14} />
                  </button>
                )}
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="btn-icon"
                  title="Delete Post"
                  style={{ width: '28px', height: '28px', color: '#f87171' }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
