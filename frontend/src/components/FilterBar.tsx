import React from 'react';
import { Search, ArrowUpDown, LayoutGrid, Kanban, List, X } from 'lucide-react';
import type { Priority, PostStatus, FilterState, LayoutMode } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  // On a private/personal board, the category filter tabs read "Tasks"
  // instead of "Works" — display-only, the underlying Category values
  // ('Ongoing Works', etc.) never change.
  useTaskLabels?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  layoutMode,
  onLayoutModeChange,
  useTaskLabels = false,
}) => {
  const categoryLabel = (cat: 'All' | 'Ongoing Works' | 'Upcoming Works' | 'Holiday Works' | 'Completed Works') => {
    if (!useTaskLabels || cat === 'All') return cat;
    return cat.replace('Works', 'Tasks');
  };

  const isFiltered =
    filters.search !== '' ||
    filters.category !== 'All' ||
    filters.status !== 'All' ||
    filters.priority !== 'All';

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Row 1: Search Input & Layout Mode Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 320px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search posts by title, content, or tag..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="input"
              style={{ paddingLeft: '42px', paddingRight: filters.search ? '40px' : '14px' }}
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Layout Mode Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => onLayoutModeChange('grid')}
              className={`btn-icon ${layoutMode === 'grid' ? 'btn-primary' : ''}`}
              title="Category Columns Layout"
              style={{ width: '34px', height: '34px', borderRadius: '8px' }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => onLayoutModeChange('kanban')}
              className={`btn-icon ${layoutMode === 'kanban' ? 'btn-primary' : ''}`}
              title="Kanban Board View"
              style={{ width: '34px', height: '34px', borderRadius: '8px' }}
            >
              <Kanban size={16} />
            </button>
            <button
              onClick={() => onLayoutModeChange('list')}
              className={`btn-icon ${layoutMode === 'list' ? 'btn-primary' : ''}`}
              title="Compact List View"
              style={{ width: '34px', height: '34px', borderRadius: '8px' }}
            >
              <List size={16} />
            </button>
          </div>

        </div>

        {/* Row 2: Category Filter Tabs, Dropdowns & Sort Options */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['All', 'Ongoing Works', 'Upcoming Works', 'Holiday Works', 'Completed Works'] as const).map((cat) => {
              const isActive = filters.category === cat;
              let styleObj: React.CSSProperties = {
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              };

              if (isActive) {
                if (cat === 'Ongoing Works') {
                  styleObj.background = 'var(--ongoing-bg)';
                  styleObj.color = 'var(--ongoing-color)';
                  styleObj.borderColor = 'var(--ongoing-border)';
                } else if (cat === 'Upcoming Works') {
                  styleObj.background = 'var(--upcoming-bg)';
                  styleObj.color = 'var(--upcoming-color)';
                  styleObj.borderColor = 'var(--upcoming-border)';
                } else if (cat === 'Holiday Works') {
                  styleObj.background = 'var(--holiday-bg)';
                  styleObj.color = 'var(--holiday-color)';
                  styleObj.borderColor = 'var(--holiday-border)';
                } else if (cat === 'Completed Works') {
                  styleObj.background = 'var(--completed-bg)';
                  styleObj.color = 'var(--completed-color)';
                  styleObj.borderColor = 'var(--completed-border)';
                } else {
                  styleObj.background = 'var(--bg-tertiary)';
                  styleObj.color = 'var(--text-primary)';
                  styleObj.borderColor = 'var(--border-focus)';
                }
              }

              return (
                <button
                  key={cat}
                  onClick={() => onFilterChange({ category: cat })}
                  style={styleObj}
                >
                  {categoryLabel(cat)}
                </button>
              );
            })}
          </div>

          {/* Secondary Filters (Status, Priority, Sort) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Status Dropdown */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as PostStatus | 'All' })}
              className="select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>

            {/* Priority Dropdown */}
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ priority: e.target.value as Priority | 'All' })}
              className="select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
                className="select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="createdAt">Sort by Date Created</option>
                <option value="priority">Sort by Priority</option>
                <option value="title">Sort by Title</option>
              </select>

              <button
                onClick={() => onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="btn-icon"
                title={`Order: ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                style={{ width: '32px', height: '32px' }}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            {/* Clear Filters Button */}
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#f87171' }}
              >
                Reset Filters
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
