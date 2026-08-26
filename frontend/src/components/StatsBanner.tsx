import React from 'react';
import { Activity, Clock, Palmtree, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Post, Category } from '../types';

interface StatsBannerProps {
  posts: Post[];
  activeCategoryFilter: Category | 'All';
  onSelectCategoryFilter: (category: Category | 'All') => void;
  // On a private/personal board, these stat cards read "Tasks" instead of
  // "Works" — display-only, the underlying Category values never change.
  useTaskLabels?: boolean;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  posts,
  activeCategoryFilter,
  onSelectCategoryFilter,
  useTaskLabels = false,
}) => {
  const label = (text: string) => (useTaskLabels ? text.replace('Works', 'Tasks') : text);
  const ongoingCount = posts.filter((p) => p.category === 'Ongoing Works').length;
  const upcomingCount = posts.filter((p) => p.category === 'Upcoming Works').length;
  const holidayCount = posts.filter((p) => p.category === 'Holiday Works').length;
  const completedCount = posts.filter((p) => p.category === 'Completed Works' || p.status === 'Completed').length;
  
  const completionRate = posts.length > 0 ? Math.round((completedCount / posts.length) * 100) : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '28px'
    }}>
      
      {/* Total Overview Card */}
      <div 
        onClick={() => onSelectCategoryFilter('All')}
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          cursor: 'pointer',
          border: activeCategoryFilter === 'All' ? '1.5px solid var(--border-focus)' : '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          boxShadow: activeCategoryFilter === 'All' ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Board Items
          </span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <TrendingUp size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '10px' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{posts.length}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {completedCount} finished
          </span>
        </div>
        
        {/* Completion Progress Bar */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Completion Rate</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{completionRate}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Ongoing Works Stat Card */}
      <div 
        onClick={() => onSelectCategoryFilter('Ongoing Works')}
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          cursor: 'pointer',
          border: activeCategoryFilter === 'Ongoing Works' ? '1.5px solid var(--ongoing-color)' : '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          background: activeCategoryFilter === 'Ongoing Works' ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ongoing-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label('Ongoing Works')}
          </span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--ongoing-bg)', color: 'var(--ongoing-color)' }}>
            <Activity size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
          {ongoingCount}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Active & in-progress tasks
        </div>
      </div>

      {/* Upcoming Works Stat Card */}
      <div 
        onClick={() => onSelectCategoryFilter('Upcoming Works')}
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          cursor: 'pointer',
          border: activeCategoryFilter === 'Upcoming Works' ? '1.5px solid var(--upcoming-color)' : '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          background: activeCategoryFilter === 'Upcoming Works' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--upcoming-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label('Upcoming Works')}
          </span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--upcoming-bg)', color: 'var(--upcoming-color)' }}>
            <Clock size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
          {upcomingCount}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Scheduled future initiatives
        </div>
      </div>

      {/* Holiday Works Stat Card */}
      <div 
        onClick={() => onSelectCategoryFilter('Holiday Works')}
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          cursor: 'pointer',
          border: activeCategoryFilter === 'Holiday Works' ? '1.5px solid var(--holiday-color)' : '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          background: activeCategoryFilter === 'Holiday Works' ? 'rgba(236, 72, 153, 0.08)' : 'var(--bg-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--holiday-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label('Holiday Works')}
          </span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--holiday-bg)', color: 'var(--holiday-color)' }}>
            <Palmtree size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
          {holidayCount}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Leave duty & maintenance
        </div>
      </div>

      {/* Completed Works Stat Card */}
      <div 
        onClick={() => onSelectCategoryFilter('Completed Works')}
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          cursor: 'pointer',
          border: activeCategoryFilter === 'Completed Works' ? '1.5px solid var(--completed-color)' : '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          background: activeCategoryFilter === 'Completed Works' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--completed-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label('Completed Works')}
          </span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--completed-bg)', color: 'var(--completed-color)' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
          {completedCount}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Finished & verified items
        </div>
      </div>

    </div>
  );
};
