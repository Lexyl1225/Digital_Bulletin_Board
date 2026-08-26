import React, { useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import type { FormattedUser } from '../services/api';
import type { Category, Post, SiteSettings } from '../types';
import { DEFAULT_SITE_SETTINGS } from '../services/siteSettings';
import { PostCard } from './PostCard';

interface TeamOverviewProps {
  users: FormattedUser[];
  siteSettings?: SiteSettings;
  onSwitchUser: (user: FormattedUser) => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({
  users,
  siteSettings = DEFAULT_SITE_SETTINGS,
  onSwitchUser,
}) => {
  const [selectedUserFilter, setSelectedUserFilter] = useState<number | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');

  // Aggregate all posts across all users
  const allTeamPosts: (Post & { ownerName: string; ownerColor: string })[] = [];
  users.forEach((u) => {
    u.payload.posts.forEach((p) => {
      allTeamPosts.push({
        ...p,
        ownerName: u.name,
        ownerColor: u.payload.avatarColor || '#3b82f6',
      });
    });
  });

  const filteredPosts = allTeamPosts.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (selectedUserFilter !== 'All') {
      const u = users.find((usr) => usr.id === selectedUserFilter);
      if (u && p.ownerName !== u.name) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Team Summary Header Banner */}
      {siteSettings.showTeamBulletinMatrix && (
        <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  <Users size={22} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Team Bulletin Matrix</h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Cross-organization overview of {users.length} registered team member bulletin boards & workload distribution.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Members</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--border-focus)' }}>{users.length}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Team Posts</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{allTeamPosts.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Member Cards Grid */}
      {siteSettings.showRegisteredTeamMembers && (
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Registered Team Members
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {users.map((u) => {
            const ongoing = u.payload.posts.filter((p) => p.category === 'Ongoing Works' && p.status !== 'Completed').length;
            const upcoming = u.payload.posts.filter((p) => p.category === 'Upcoming Works' && p.status !== 'Completed').length;
            const holiday = u.payload.posts.filter((p) => p.category === 'Holiday Works' && p.status !== 'Completed').length;
            const completed = u.payload.posts.filter((p) => p.category === 'Completed Works' || p.status === 'Completed').length;

            return (
              <div
                key={u.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: selectedUserFilter === u.id ? '1.5px solid var(--border-focus)' : '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: u.payload.avatarColor || '#3b82f6',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{u.name}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.payload.role}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSwitchUser(u)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    title="Switch to this user's board"
                  >
                    View Board <ArrowRight size={12} />
                  </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{u.payload.bio}"
                </p>

                {/* Categories breakdown pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '0.72rem', textAlign: 'center' }}>
                  <div style={{ background: 'var(--ongoing-bg)', color: 'var(--ongoing-color)', padding: '6px 2px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{ongoing}</div>
                    <div>Ongoing</div>
                  </div>
                  <div style={{ background: 'var(--upcoming-bg)', color: 'var(--upcoming-color)', padding: '6px 2px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{upcoming}</div>
                    <div>Upcoming</div>
                  </div>
                  <div style={{ background: 'var(--holiday-bg)', color: 'var(--holiday-color)', padding: '6px 2px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{holiday}</div>
                    <div>Holiday</div>
                  </div>
                  <div style={{ background: 'var(--completed-bg)', color: 'var(--completed-color)', padding: '6px 2px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{completed}</div>
                    <div>Done</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Unified Master Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Master Team Feed</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Real-time feed of all bulletin posts across team members
            </p>
          </div>

          {/* User Filter Dropdown */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <option value="All">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
              className="select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <option value="All">All Categories</option>
              <option value="Ongoing Works">Ongoing Works</option>
              <option value="Upcoming Works">Upcoming Works</option>
              <option value="Holiday Works">Holiday Works</option>
              <option value="Completed Works">Completed Works</option>
            </select>
          </div>
        </div>

        {/* Master Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No posts found matching the selected filter criteria.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredPosts.map((post) => (
              <div key={`${post.ownerName}-${post.id}`} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '16px',
                    zIndex: 10,
                    background: post.ownerColor,
                    color: '#ffffff',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  Posted By: {post.ownerName}
                </div>
                <PostCard
                  post={post}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onStatusChange={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
