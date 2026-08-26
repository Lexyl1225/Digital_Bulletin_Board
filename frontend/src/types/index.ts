export type Category = 'Ongoing Works' | 'Upcoming Works' | 'Holiday Works' | 'Completed Works';
export type Priority = 'High' | 'Medium' | 'Low';
export type PostStatus = 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'Blocked' | 'Scheduled';

export interface Post {
  id: string;
  title: string;
  category: Category;
  originalCategory?: Category;
  content: string;
  status: PostStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assigneeNotes?: string;
  completionPercent?: number;
  // Set when a post is moved into the archive — the original category/
  // status are left untouched so restoring puts it right back where it was.
  archivedAt?: string;
}

export interface UserPayload {
  bio: string;
  role: string;
  department?: string;
  gender?: string;
  avatarColor?: string;
  password?: string;
  usingDefaultPassword?: boolean;
  themePreference?: 'dark' | 'light';
  isAdmin?: boolean;
  isPrivate?: boolean;
  posts: Post[];
  // Archived posts are excluded from the board, its category cards, and
  // the Team Overview master feed — all of those only ever read `posts`.
  archivedPosts: Post[];
}

export interface ApiUser {
  id: number;
  name: string;
  gender: string | null;
  isAdmin: boolean;
  isPrivate: boolean;
  description: string | null;
}

export interface FilterState {
  search: string;
  category: Category | 'All';
  status: PostStatus | 'All';
  priority: Priority | 'All';
  sortBy: 'dueDate' | 'createdAt' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
}

export type ViewMode = 'board' | 'team' | 'admin' | 'archive';
export type LayoutMode = 'grid' | 'kanban' | 'list';

export interface SiteSettings {
  showRegisteredTeamMembers: boolean;
  showTeamBulletinMatrix: boolean;
}
