import React, { useState, useEffect } from 'react';
import { X, Plus, Save, AlertCircle } from 'lucide-react';
import type { Post, Category, Priority, PostStatus } from '../types';

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: Partial<Post>) => void;
  initialCategory?: Category;
  editingPost?: Post | null;
  // On a private/personal board, the category dropdown reads "Tasks"
  // instead of "Works" — display-only, the underlying Category values
  // (used as the <option> values) never change.
  useTaskLabels?: boolean;
  // Editing an archived post — hides Category/Status (edits there are
  // ignored on save; only Restore moves a post back onto the board).
  archiveMode?: boolean;
}

export const PostFormModal: React.FC<PostFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCategory = 'Ongoing Works',
  editingPost = null,
  useTaskLabels = false,
  archiveMode = false,
}) => {
  const categoryLabel = (cat: Category) => (useTaskLabels ? cat.replace('Works', 'Tasks') : cat);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory);
  const [status, setStatus] = useState<PostStatus>('In Progress');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completionPercent, setCompletionPercent] = useState<number>(50);
  const [tagsInput, setTagsInput] = useState('');
  const [assigneeNotes, setAssigneeNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setCategory(editingPost.category);
      setStatus(editingPost.status);
      setPriority(editingPost.priority);
      setContent(editingPost.content);
      setStartDate(editingPost.startDate || '');
      setDueDate(editingPost.dueDate || '');
      setCompletionPercent(editingPost.completionPercent ?? 50);
      setTagsInput(editingPost.tags ? editingPost.tags.join(', ') : '');
      setAssigneeNotes(editingPost.assigneeNotes || '');
    } else {
      setTitle('');
      setCategory(initialCategory);
      setStatus(
        initialCategory === 'Completed Works'
          ? 'Completed'
          : initialCategory === 'Ongoing Works'
          ? 'In Progress'
          : initialCategory === 'Upcoming Works'
          ? 'Scheduled'
          : 'Pending'
      );
      setPriority('Medium');
      setContent('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setCompletionPercent(initialCategory === 'Completed Works' ? 100 : initialCategory === 'Ongoing Works' ? 25 : 0);
      setTagsInput('');
      setAssigneeNotes('');
    }
    setErrorMsg('');
  }, [editingPost, initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a valid post title.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Please enter post content / description.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      id: editingPost?.id,
      title: title.trim(),
      category,
      status: category === 'Completed Works' ? 'Completed' : status,
      priority,
      content: content.trim(),
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      completionPercent: category === 'Completed Works' ? 100 : Number(completionPercent),
      tags: parsedTags,
      assigneeNotes: assigneeNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
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
              {editingPost ? <Save size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {archiveMode ? 'Edit Archived Post' : editingPost ? 'Edit Bulletin Post' : 'Create New Bulletin Item'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {archiveMode
                  ? 'Category and status stay frozen while archived — use Restore to bring it back to the board.'
                  : 'Organize work details across Ongoing, Upcoming, Holiday, or Completed sections'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
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

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Post Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Substation Transformer Relay Calibration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          {/* Category & Status Grid — hidden while editing an archived post,
              since those edits are ignored on save (only Restore re-files
              a post onto the board) */}
          {!archiveMode && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Category Section <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as Category;
                  setCategory(newCat);
                  if (newCat === 'Completed Works') {
                    setStatus('Completed');
                    setCompletionPercent(100);
                  }
                }}
                className="select"
              >
                <option value="Ongoing Works">{categoryLabel('Ongoing Works')}</option>
                <option value="Upcoming Works">{categoryLabel('Upcoming Works')}</option>
                <option value="Holiday Works">{categoryLabel('Holiday Works')}</option>
                <option value="Completed Works">{categoryLabel('Completed Works')}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Work Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as PostStatus;
                  setStatus(newStatus);
                  if (newStatus === 'Completed') {
                    setCategory('Completed Works');
                    setCompletionPercent(100);
                  }
                }}
                className="select"
              >
                <option value="In Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
          )}

          {/* Priority & Completion % Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="select"
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <span>Completion Percentage</span>
                <span style={{ color: 'var(--ongoing-color)' }}>{completionPercent}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={completionPercent}
                onChange={(e) => setCompletionPercent(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', marginTop: '6px' }}
              />
            </div>
          </div>

          {/* Start Date & Due Date Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                Target / Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Content / Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Work Description / Details <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of the task, requirements, scope, or instructions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="textarea"
            />
          </div>

          {/* Tags (comma separated) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Maintenance, High Voltage, Safety Audit"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="input"
            />
          </div>

          {/* Assignee / Handover Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              Assignee Handover / Status Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Primary injection complete. Secondary loop pending test rig."
              value={assigneeNotes}
              onChange={(e) => setAssigneeNotes(e.target.value)}
              className="input"
            />
          </div>

          {/* Modal Footer Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              {editingPost ? 'Save Changes' : 'Create Post'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
