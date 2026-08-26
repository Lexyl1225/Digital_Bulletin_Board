import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAllUsersRaw,
  createNewUser,
  registerPrivateUser,
  updateUserData,
  deleteUserAccount,
  createSiteSettingsRecord,
  updateSiteSettingsRecord,
  loginUser,
  logoutUser,
  fetchCurrentUser,
  setUserAdminStatus,
} from './services/api';
import type { FormattedUser } from './services/api';
import { DEFAULT_USER_PASSWORD, parseUserDescription } from './services/initialData';
import { applyPostSave } from './services/postHelpers';
import { SITE_SETTINGS_RECORD_NAME, DEFAULT_SITE_SETTINGS, parseSiteSettings } from './services/siteSettings';
import type { Post, Category, PostStatus, FilterState, ViewMode, LayoutMode, UserPayload, SiteSettings } from './types';
import { Navbar } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { FilterBar } from './components/FilterBar';
import { CategorySection } from './components/CategorySection';
import { PostFormModal } from './components/PostFormModal';
import { UserSelectorModal } from './components/UserSelectorModal';
import { LoginFormModal } from './components/LoginFormModal';
import { PrivateLoginModal } from './components/PrivateLoginModal';
import { TeamOverview } from './components/TeamOverview';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchivePage } from './components/ArchivePage';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import {
  UserCheck,
  RefreshCw,
  AlertCircle,
  Sparkles,
  LogIn,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';

type PendingAction =
  | { type: 'create'; category?: Category }
  | { type: 'edit'; post: Post }
  | null;

export const App: React.FC = () => {
  const [users, setUsers] = useState<FormattedUser[]>([]);
  // Currently authenticated user (null when in Guest / Logged-out mode)
  const [activeUser, setActiveUser] = useState<FormattedUser | null>(null);
  // User whose board is currently being viewed on screen
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View & Layout State
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPrivateLoginModalOpen, setIsPrivateLoginModalOpen] = useState<boolean>(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userModalTab, setUserModalTab] = useState<'select' | 'create' | 'edit' | 'security'>('select');
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [targetCategoryForAdd, setTargetCategoryForAdd] = useState<Category>('Ongoing Works');
  // When set, the Post Form Modal is editing another user's post (Admin Dashboard context)
  const [adminEditContext, setAdminEditContext] = useState<{ userId: number } | null>(null);
  // When set, the Post Form Modal is editing an ARCHIVED post (own archive
  // only — editing someone else's archive isn't a capability anyone gets).
  const [archiveEditMode, setArchiveEditMode] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Site-wide Homepage Settings (Admin controlled)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [siteSettingsRecordId, setSiteSettingsRecordId] = useState<number | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All',
    status: 'All',
    priority: 'All',
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load the public user directory from the backend. This never determines
  // *who's logged in* — that's exclusively decided by refreshCurrentUser()
  // below, which asks the server about the session cookie. preferredUserId
  // only picks which board is displayed, a read-only UI preference.
  const loadUsers = async (preferredUserId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const rawRows = await fetchAllUsersRaw();

      // The homepage settings sentinel row is not a real user account — split
      // it out before building the user list the rest of the app works with.
      const settingsRow = rawRows.find((u) => u.name === SITE_SETTINGS_RECORD_NAME);
      setSiteSettingsRecordId(settingsRow?.id ?? null);
      setSiteSettings(settingsRow ? parseSiteSettings(settingsRow.description) : DEFAULT_SITE_SETTINGS);

      const userList: FormattedUser[] = rawRows
        .filter((u) => u.name !== SITE_SETTINGS_RECORD_NAME)
        .map((u) => ({
          id: u.id,
          name: u.name,
          payload: {
            ...parseUserDescription(u.description),
            gender: u.gender || 'Unspecified',
            isAdmin: !!u.isAdmin,
            isPrivate: !!u.isPrivate,
          },
        }));

      setUsers(userList);

      if (userList.length > 0) {
        const savedViewId = Number(localStorage.getItem('viewingUserId'));
        const targetId = preferredUserId ?? savedViewId;
        const found = userList.find((u) => u.id === targetId);
        setViewingUserId(found ? found.id : userList[0].id);
      } else {
        setViewingUserId(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to Flask API server.');
    } finally {
      setLoading(false);
    }
  };

  // The one and only source of truth for authentication — asks the server
  // which account (if any) the httpOnly session cookie belongs to. Never
  // infer "who's logged in" from anything stored client-side.
  const refreshCurrentUser = async () => {
    try {
      const me = await fetchCurrentUser();
      setActiveUser(me);
      if (me) {
        setViewingUserId(me.id);
        localStorage.setItem('viewingUserId', String(me.id));
      }
    } catch (err) {
      console.error('Failed to refresh current session', err);
      setActiveUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      await loadUsers();
      await refreshCurrentUser();
    })();
  }, []);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle Login — the server already set the session cookie on the /login
  // response by the time this is called; nothing client-side to persist.
  const handleLogin = async (user: FormattedUser): Promise<boolean> => {
    setActiveUser(user);
    setViewingUserId(user.id);
    localStorage.setItem('viewingUserId', String(user.id));
    addToast('success', `Welcome back, ${user.name}! You are now signed in.`);

    // Execute any queued pending action
    if (pendingAction) {
      if (pendingAction.type === 'create') {
        setEditingPost(null);
        setTargetCategoryForAdd(pendingAction.category || 'Ongoing Works');
        setIsPostModalOpen(true);
      } else if (pendingAction.type === 'edit') {
        setEditingPost(pendingAction.post);
        setIsPostModalOpen(true);
      }
      setPendingAction(null);
    }
    return true;
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Failed to clear session on the server', err);
    }
    setActiveUser(null);
    addToast('info', 'Signed out. Public homepage is now in clean read-only mode.');
  };

  // Guard action: if not logged in, show login modal with customized prompt
  const requireAuth = (promptMsg: string, onAuthed?: () => void, pending?: PendingAction): boolean => {
    if (!activeUser) {
      setLoginPromptMessage(promptMsg);
      if (pending) {
        setPendingAction(pending);
      }
      setIsLoginModalOpen(true);
      return false;
    }
    if (onAuthed) onAuthed();
    return true;
  };

  // Create New User Account (Registration)
  const handleRegister = async (
    name: string,
    bio?: string,
    role?: string,
    password?: string,
    gender?: string,
    department?: string,
    avatarColor?: string
  ) => {
    const newUser = await createNewUser(name, bio, role, password, gender, department, avatarColor);
    addToast('success', `Account created successfully! Signed in as ${name}.`);
    await loadUsers(newUser.id);

    if (pendingAction) {
      if (pendingAction.type === 'create') {
        setEditingPost(null);
        setTargetCategoryForAdd(pendingAction.category || 'Ongoing Works');
        setIsPostModalOpen(true);
      } else if (pendingAction.type === 'edit') {
        setEditingPost(pendingAction.post);
        setIsPostModalOpen(true);
      }
      setPendingAction(null);
    }
  };

  // Create a private/personal account (separate flow from public
  // registration) — its board is never shared with the team.
  const handleRegisterPrivate = async (name: string, password?: string, bio?: string) => {
    const newUser = await registerPrivateUser(name, password, bio);
    addToast('success', `Private account created. Signed in as ${name}.`);
    // Deliberately NOT added to the shared `users` list — the server never
    // returns private accounts from GET /users, and doing so locally would
    // transiently leak it into Team Overview / the board switcher / the
    // login list until the next refresh.
    setActiveUser(newUser);
    setViewingUserId(newUser.id);
    localStorage.setItem('viewingUserId', String(newUser.id));
  };

  // Switch which board is being VIEWED. This must never change who you're
  // authenticated as — that used to be a real bug here (clicking a card in
  // the account switcher silently logged you in as that user with no
  // password check). Viewing someone's board is read-only; acting on it
  // still requires actually being logged in as them (or as an admin).
  const handleSelectUser = (user: FormattedUser) => {
    setViewingUserId(user.id);
    localStorage.setItem('viewingUserId', String(user.id));
    if (activeUser && activeUser.id !== user.id) {
      addToast('info', `Now viewing '${user.name}'s board (read-only — sign in as them to make changes).`);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (bio: string, role: string, avatarColor: string) => {
    if (!activeUser) {
      requireAuth('Please sign in to update profile settings.');
      return;
    }
    const updatedPayload = {
      ...activeUser.payload,
      bio,
      role,
      avatarColor,
    };

    await updateUserData(activeUser.id, activeUser.name, updatedPayload);
    const updatedUser = { ...activeUser, payload: updatedPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));
    addToast('success', 'Profile updated successfully!');
  };

  // Change Account Password
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!activeUser) {
      requireAuth('Please sign in to change your password.');
      return;
    }

    try {
      await loginUser(activeUser.name, currentPassword);
    } catch {
      throw new Error('Current password is incorrect.');
    }

    const updatedPayload = { ...activeUser.payload, password: newPassword };
    await updateUserData(activeUser.id, activeUser.name, updatedPayload);
    const updatedUser = { ...activeUser, payload: updatedPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));
    addToast('success', 'Password updated successfully!');
  };

  // Delete User Account
  const handleDeleteUser = async (userId: number) => {
    if (!activeUser) {
      requireAuth('Please sign in to manage accounts.');
      return;
    }
    if (!activeUser.payload.isAdmin) {
      addToast('error', 'Only administrators can delete user accounts.');
      return;
    }
    await deleteUserAccount(userId);
    addToast('info', 'User account deleted.');
    if (activeUser.id === userId) {
      handleLogout();
    }
    await loadUsers();
  };

  // Trigger Create Post (Guarded)
  const handleOpenCreatePost = (category: Category = 'Ongoing Works') => {
    requireAuth(
      'Authentication required: Please sign in or register before adding posts to the bulletin board.',
      () => {
        setEditingPost(null);
        setTargetCategoryForAdd(category);
        setIsPostModalOpen(true);
      },
      { type: 'create', category }
    );
  };

  // Trigger Edit Post (Guarded)
  const handleOpenEditPost = (post: Post) => {
    requireAuth(
      'Authentication required: Please sign in to edit bulletin board posts.',
      () => {
        setEditingPost(post);
        setIsPostModalOpen(true);
      },
      { type: 'edit', post }
    );
  };

  // Post Operations: Save / Create / Edit (Guarded)
  const handleSavePost = async (postData: Partial<Post>) => {
    // Editing an archived post (own archive only)
    if (archiveEditMode) {
      await handleSaveArchivedPost(postData);
      setArchiveEditMode(false);
      return;
    }

    // Editing another user's post from the Admin Dashboard
    if (adminEditContext) {
      await handleAdminSavePost(adminEditContext.userId, postData);
      setAdminEditContext(null);
      return;
    }

    if (!activeUser) {
      requireAuth('Please sign in before saving posts.');
      return;
    }

    const isCompleted = postData.status === 'Completed' || postData.category === 'Completed Works';
    const updatedPosts = applyPostSave(activeUser.payload.posts, postData, targetCategoryForAdd);

    addToast(
      'success',
      postData.id
        ? isCompleted
          ? 'Post marked as Completed & moved to Completed Cards!'
          : 'Bulletin post updated!'
        : isCompleted
        ? 'Created & placed in Completed Cards!'
        : 'New bulletin post created!'
    );

    const newPayload = {
      ...activeUser.payload,
      posts: updatedPosts,
    };

    // Optimistic UI update
    const updatedUser = { ...activeUser, payload: newPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));

    // Sync to backend SQLite API via PUT /users/<id>
    try {
      await updateUserData(activeUser.id, activeUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to save post to server DB');
    }
  };

  // Delete Post (Guarded)
  const handleDeletePost = async (postId: string) => {
    if (!activeUser) {
      requireAuth('Authentication required: Please sign in to delete bulletin posts.');
      return;
    }

    const updatedPosts = activeUser.payload.posts.filter((p) => p.id !== postId);
    const newPayload = {
      ...activeUser.payload,
      posts: updatedPosts,
    };

    const updatedUser = { ...activeUser, payload: newPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));
    addToast('info', 'Post deleted');

    try {
      await updateUserData(activeUser.id, activeUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to sync deletion to server DB');
    }
  };

  // ---------------------------------------------------------------------
  // Archive Operations — moving a post into the archive pulls it out of
  // `posts` entirely, so it disappears from the board's category cards AND
  // the Team Overview master feed in one step (both only ever read
  // `posts`). Everything here operates on the CALLER'S OWN account except
  // handleDeleteArchivedPost, which an admin can also use on a non-private
  // account's archive.
  // ---------------------------------------------------------------------

  const handleArchivePost = async (postId: string) => {
    if (!activeUser) {
      requireAuth('Please sign in to archive bulletin posts.');
      return;
    }
    const target = activeUser.payload.posts.find((p) => p.id === postId);
    if (!target) return;

    const archivedPost: Post = { ...target, archivedAt: new Date().toISOString() };
    const newPayload = {
      ...activeUser.payload,
      posts: activeUser.payload.posts.filter((p) => p.id !== postId),
      archivedPosts: [archivedPost, ...activeUser.payload.archivedPosts],
    };

    const updatedUser = { ...activeUser, payload: newPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));
    addToast('info', 'Post moved to Archive.');

    try {
      await updateUserData(activeUser.id, activeUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to sync archive to server DB');
    }
  };

  // Restore an archived post back onto the board — own archive only.
  const handleRestoreArchivedPost = async (postId: string) => {
    if (!activeUser) return;
    const target = activeUser.payload.archivedPosts.find((p) => p.id === postId);
    if (!target) return;

    const { archivedAt, ...restoredPost } = target;
    const newPayload = {
      ...activeUser.payload,
      posts: [restoredPost as Post, ...activeUser.payload.posts],
      archivedPosts: activeUser.payload.archivedPosts.filter((p) => p.id !== postId),
    };

    const updatedUser = { ...activeUser, payload: newPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));
    addToast('success', 'Post restored to your board.');

    try {
      await updateUserData(activeUser.id, activeUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to sync restore to server DB');
    }
  };

  // Save an edit made to an archived post — own archive only. Deliberately
  // ignores category/status: editing an archived item shouldn't re-file it
  // or un-archive it, only Restore does that.
  const handleSaveArchivedPost = async (postData: Partial<Post>) => {
    if (!activeUser || !postData.id) return;

    const newArchivedPosts = activeUser.payload.archivedPosts.map((p) =>
      p.id === postData.id
        ? {
            ...p,
            title: postData.title ?? p.title,
            content: postData.content ?? p.content,
            priority: postData.priority ?? p.priority,
            tags: postData.tags ?? p.tags,
            startDate: postData.startDate,
            dueDate: postData.dueDate,
            assigneeNotes: postData.assigneeNotes,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    const newPayload = { ...activeUser.payload, archivedPosts: newArchivedPosts };
    const updatedUser = { ...activeUser, payload: newPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));
    addToast('success', 'Archived post updated.');

    try {
      await updateUserData(activeUser.id, activeUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to save changes to server DB');
    }
  };

  // Open the Post Form Modal in "edit an archived post" mode
  const handleOpenEditArchivedPost = (post: Post) => {
    setArchiveEditMode(true);
    setEditingPost(post);
    setIsPostModalOpen(true);
  };

  // Permanently delete an archived post. Works for the owner's own archive,
  // and — for a non-private account — for an admin acting on someone
  // else's archive (their only capability there: view + delete, no
  // edit/restore).
  const handleDeleteArchivedPost = async (userId: number, postId: string) => {
    const isSelf = activeUser?.id === userId;
    const targetUser = isSelf ? activeUser : users.find((u) => u.id === userId);
    if (!targetUser) return;

    const newPayload = {
      ...targetUser.payload,
      archivedPosts: targetUser.payload.archivedPosts.filter((p) => p.id !== postId),
    };
    const updatedUser = { ...targetUser, payload: newPayload };

    if (isSelf) setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    addToast('info', 'Archived post permanently deleted.');

    try {
      await updateUserData(userId, targetUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to delete archived post on server DB');
    }
  };

  // ---------------------------------------------------------------------
  // Admin Dashboard Operations — an administrator can update/delete ANY
  // user's account or bulletin posts, not just their own.
  // ---------------------------------------------------------------------

  // Trigger Edit Post for another user (Admin Dashboard)
  const handleAdminOpenEditPost = (userId: number, post: Post) => {
    setAdminEditContext({ userId });
    setEditingPost(post);
    setIsPostModalOpen(true);
  };

  // Save an edited post that belongs to another user
  const handleAdminSavePost = async (userId: number, postData: Partial<Post>) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const updatedPosts = applyPostSave(targetUser.payload.posts, postData, 'Ongoing Works');
    const newPayload = { ...targetUser.payload, posts: updatedPosts };
    const updatedUser = { ...targetUser, payload: newPayload };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (activeUser?.id === userId) setActiveUser(updatedUser);

    try {
      await updateUserData(userId, targetUser.name, newPayload);
      addToast('success', `Updated "${postData.title || 'post'}" on ${targetUser.name}'s board.`);
    } catch (err: any) {
      addToast('error', `Failed to save changes to ${targetUser.name}'s board.`);
    }
  };

  // Delete a post that belongs to another user
  const handleAdminDeletePost = async (userId: number, postId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const updatedPosts = targetUser.payload.posts.filter((p) => p.id !== postId);
    const newPayload = { ...targetUser.payload, posts: updatedPosts };
    const updatedUser = { ...targetUser, payload: newPayload };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (activeUser?.id === userId) setActiveUser(updatedUser);
    addToast('info', `Deleted post from ${targetUser.name}'s board.`);

    try {
      await updateUserData(userId, targetUser.name, newPayload);
    } catch (err: any) {
      addToast('error', `Failed to sync deletion for ${targetUser.name}.`);
    }
  };

  // Update any user's account fields (name, role, bio, department, avatar).
  // 'isAdmin' is handled separately below — it's a protected column the
  // generic profile-update endpoint doesn't accept — routed through the
  // dedicated admin-only endpoint instead.
  // Errors are re-thrown so the calling form can surface inline validation feedback.
  const handleAdminUpdateUser = async (
    userId: number,
    name: string,
    payloadUpdates: Partial<UserPayload>
  ) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) throw new Error('User not found.');

    const { isAdmin: newIsAdmin, ...restUpdates } = payloadUpdates;
    const newPayload = { ...targetUser.payload, ...restUpdates };
    await updateUserData(userId, name, newPayload);

    if (newIsAdmin !== undefined && newIsAdmin !== targetUser.payload.isAdmin) {
      await setUserAdminStatus(userId, newIsAdmin);
      newPayload.isAdmin = newIsAdmin;
    }

    const updatedUser = { ...targetUser, name, payload: newPayload };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (activeUser?.id === userId) setActiveUser(updatedUser);
  };

  // Reset a user's password back to the shared default
  const handleAdminResetPassword = async (userId: number) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    try {
      await handleAdminUpdateUser(userId, targetUser.name, { password: DEFAULT_USER_PASSWORD });
      addToast('success', `Password reset to the default for ${targetUser.name}.`);
    } catch (err: any) {
      addToast('error', err.message || `Failed to reset password for ${targetUser.name}.`);
    }
  };

  // Grant or revoke Administrator access, guarding against removing the last admin
  const handleAdminToggleAdmin = async (userId: number) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const adminCount = users.filter((u) => u.payload.isAdmin).length;
    if (targetUser.payload.isAdmin && adminCount <= 1) {
      addToast('error', 'At least one administrator must remain.');
      return;
    }

    try {
      await handleAdminUpdateUser(userId, targetUser.name, { isAdmin: !targetUser.payload.isAdmin });
      addToast(
        'success',
        targetUser.payload.isAdmin
          ? `Removed administrator access from ${targetUser.name}.`
          : `Granted administrator access to ${targetUser.name}.`
      );
    } catch (err: any) {
      addToast('error', err.message || `Failed to update admin access for ${targetUser.name}.`);
    }
  };

  // Update site-wide Homepage Settings (creates the sentinel record on first use)
  const handleUpdateSiteSettings = async (updates: Partial<SiteSettings>) => {
    const newSettings = { ...siteSettings, ...updates };
    setSiteSettings(newSettings);

    try {
      if (siteSettingsRecordId) {
        await updateSiteSettingsRecord(siteSettingsRecordId, SITE_SETTINGS_RECORD_NAME, newSettings);
      } else {
        const newId = await createSiteSettingsRecord(SITE_SETTINGS_RECORD_NAME, newSettings);
        setSiteSettingsRecordId(newId);
      }
      addToast('success', 'Homepage settings updated.');
    } catch (err: any) {
      setSiteSettings(siteSettings);
      addToast('error', err.message || 'Failed to save homepage settings.');
    }
  };

  // Quick Status Change (Guarded)
  const handleStatusChange = async (postId: string, nextStatus: PostStatus) => {
    if (!activeUser) {
      requireAuth('Authentication required: Please sign in to update post status.');
      return;
    }

    const now = new Date().toISOString();
    const updatedPosts = activeUser.payload.posts.map((p) => {
      if (p.id === postId) {
        const isCompleted = nextStatus === 'Completed';
        const originalCat =
          p.category !== 'Completed Works'
            ? p.category
            : p.originalCategory || 'Ongoing Works';
        const finalCategory = isCompleted
          ? 'Completed Works'
          : p.originalCategory || 'Ongoing Works';

        return {
          ...p,
          status: nextStatus,
          category: finalCategory,
          originalCategory: originalCat,
          completionPercent: isCompleted
            ? 100
            : p.completionPercent === 100
            ? 75
            : p.completionPercent,
          completedAt: isCompleted ? now : undefined,
          updatedAt: now,
        };
      }
      return p;
    });

    const newPayload = { ...activeUser.payload, posts: updatedPosts };
    const updatedUser = { ...activeUser, payload: newPayload };
    setActiveUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === activeUser.id ? updatedUser : u)));

    if (nextStatus === 'Completed') {
      addToast('success', 'Work marked as Completed! Moved to Completed Cards.');
    } else {
      addToast('info', `Status updated to ${nextStatus}`);
    }

    try {
      await updateUserData(activeUser.id, activeUser.name, newPayload);
    } catch (err: any) {
      addToast('error', 'Failed to sync status change');
    }
  };

  // The active board to display
  const currentBoardUser = useMemo(() => {
    if (activeUser) return activeUser;
    if (viewingUserId) {
      return users.find((u) => u.id === viewingUserId) || users[0] || null;
    }
    return users[0] || null;
  }, [activeUser, viewingUserId, users]);

  const usingDefaultPassword = !!currentBoardUser && !!currentBoardUser.payload.usingDefaultPassword;

  const isAdminUser = !!activeUser?.payload.isAdmin;
  const isPrivateUser = !!activeUser?.payload.isPrivate;

  // Private accounts are confined to their own board — Team Overview (and
  // the Admin dashboard, which they're never granted anyway) are off the
  // table even if viewMode was left in that state from a prior session.
  useEffect(() => {
    if (isPrivateUser && viewMode === 'team') {
      setViewMode('board');
    }
  }, [isPrivateUser, viewMode]);

  // Filter & Sort Logic
  const filteredPosts = useMemo(() => {
    if (!currentBoardUser) return [];

    return currentBoardUser.payload.posts
      .filter((post) => {
        // Search filter
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchContent = post.content.toLowerCase().includes(q);
          const matchTag = post.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTag) return false;
        }

        // Category filter
        if (filters.category !== 'All' && post.category !== filters.category) {
          return false;
        }

        // Status filter
        if (filters.status !== 'All' && post.status !== filters.status) {
          return false;
        }

        // Priority filter
        if (filters.priority !== 'All' && post.priority !== filters.priority) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[filters.sortBy as keyof Post] || '';
        let valB: any = b[filters.sortBy as keyof Post] || '';

        if (filters.sortBy === 'priority') {
          const pRank = { High: 3, Medium: 2, Low: 1 };
          valA = pRank[a.priority] || 0;
          valB = pRank[b.priority] || 0;
        }

        if (valA < valB) return filters.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [currentBoardUser, filters]);

  // Group filtered posts by category
  const ongoingPosts = filteredPosts.filter(
    (p) => p.category === 'Ongoing Works' && p.status !== 'Completed'
  );
  const upcomingPosts = filteredPosts.filter(
    (p) => p.category === 'Upcoming Works' && p.status !== 'Completed'
  );
  const holidayPosts = filteredPosts.filter(
    (p) => p.category === 'Holiday Works' && p.status !== 'Completed'
  );
  const completedPosts = filteredPosts.filter(
    (p) => p.category === 'Completed Works' || p.status === 'Completed'
  );

  const isLoggedIn = !!activeUser;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        activeUser={activeUser}
        allUsers={users}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isAdmin={isAdminUser}
        onOpenLoginModal={(prompt) => {
          setLoginPromptMessage(prompt || 'Sign in to access your personal bulletin board.');
          setIsLoginModalOpen(true);
        }}
        onOpenPrivateLoginModal={() => setIsPrivateLoginModalOpen(true)}
        onOpenUserModal={() => {
          setUserModalTab(isPrivateUser ? 'edit' : 'select');
          setIsUserModalOpen(true);
        }}
        onOpenSecurityModal={() => {
          setUserModalTab('security');
          setIsUserModalOpen(true);
        }}
        onOpenCreatePostModal={() => handleOpenCreatePost('Ongoing Works')}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      {/* Main Page Content Container */}
      <main
        style={{
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 60px 24px',
          flex: 1,
        }}
      >
        {loading ? (
          /* Loading Skeletons */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton" style={{ height: '100px', width: '100%' }} />
            <div className="skeleton" style={{ height: '60px', width: '100%' }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
              }}
            >
              <div className="skeleton" style={{ height: '350px' }} />
              <div className="skeleton" style={{ height: '350px' }} />
              <div className="skeleton" style={{ height: '350px' }} />
              <div className="skeleton" style={{ height: '350px' }} />
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div
            className="glass-panel"
            style={{
              padding: '40px',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '40px auto',
            }}
          >
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              API Connection Error
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {error}
            </p>
            <button onClick={() => loadUsers()} className="btn btn-primary">
              <RefreshCw size={16} /> Retry Connection
            </button>
          </div>
        ) : !currentBoardUser ? (
          /* Empty Database State */
          <div
            className="glass-panel"
            style={{
              padding: '48px',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '40px auto',
            }}
          >
            <UserCheck size={56} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>
              Welcome to Engineers Bulletin Board
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              No registered user accounts found. Create your account to start managing bulletin posts.
            </p>
            <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary">
              <LogIn size={18} /> Sign In / Register
            </button>
          </div>
        ) : viewMode === 'team' ? (
          /* TEAM OVERVIEW MODE */
          <TeamOverview
            users={users}
            siteSettings={siteSettings}
            onSwitchUser={(user) => {
              setViewingUserId(user.id);
              setViewMode('board');
            }}
          />
        ) : viewMode === 'admin' ? (
          /* ADMIN DASHBOARD MODE */
          isAdminUser && activeUser ? (
            <AdminDashboard
              users={users}
              activeUser={activeUser}
              siteSettings={siteSettings}
              onUpdateSiteSettings={handleUpdateSiteSettings}
              onEditPost={handleAdminOpenEditPost}
              onDeletePost={handleAdminDeletePost}
              onUpdateUser={handleAdminUpdateUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleAdminResetPassword}
              onToggleAdmin={handleAdminToggleAdmin}
            />
          ) : (
            <div
              className="glass-panel"
              style={{ padding: '48px', textAlign: 'center', maxWidth: '480px', margin: '40px auto' }}
            >
              <ShieldAlert size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
                Administrator Access Required
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                You need administrator access to view this page.
              </p>
              <button onClick={() => setViewMode('board')} className="btn btn-primary">
                Back to Board
              </button>
            </div>
          )
        ) : viewMode === 'archive' ? (
          /* ARCHIVE MODE */
          activeUser ? (
            <ArchivePage
              activeUser={activeUser}
              users={users}
              useTaskLabels={isPrivateUser}
              onEditPost={handleOpenEditArchivedPost}
              onRestorePost={handleRestoreArchivedPost}
              onDeletePost={handleDeleteArchivedPost}
            />
          ) : (
            <div
              className="glass-panel"
              style={{ padding: '48px', textAlign: 'center', maxWidth: '480px', margin: '40px auto' }}
            >
              <ShieldAlert size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
                Sign In Required
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Sign in to view and manage your archive.
              </p>
              <button onClick={() => setViewMode('board')} className="btn btn-primary">
                Back to Board
              </button>
            </div>
          )
        ) : (
          /* BULLETIN BOARD VIEW (PUBLIC HOME OR PERSONAL BOARD) */
          <div>
            {/* Clean Public Homepage Hero Banner when NOT logged in */}
            {!isLoggedIn ? (
              <div
                className="glass-panel"
                style={{
                  padding: '24px 28px',
                  marginBottom: '24px',
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: 'var(--ongoing-color)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid var(--ongoing-border)',
                      }}
                    >
                      ● Live Public Bulletin Board
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Read-Only View
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Engineering & Operations Bulletin Board
                  </h2>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '640px' }}>
                    Workspace tracking active projects, planned milestones, holiday coverage, and completed works.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Select Board to View */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Board:
                    </span>
                    <select
                      value={currentBoardUser.id}
                      onChange={(e) => setViewingUserId(Number(e.target.value))}
                      className="select"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.payload.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sign In CTA */}
                  <button
                    onClick={() => {
                      setLoginPromptMessage('Sign in to add, edit, or manage bulletin works.');
                      setIsLoginModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    <LogIn size={15} />
                    Sign In to Post & Edit
                  </button>
                </div>
              </div>
            ) : (
              /* User Profile Header Bar when LOGGED IN */
              <div
                className="glass-panel"
                style={{
                  padding: '18px 24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: currentBoardUser.payload.avatarColor || '#3b82f6',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    }}
                  >
                    {currentBoardUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                        {currentBoardUser.name}'s Personal Board
                      </h2>
                      <span className="badge badge-ongoing">{currentBoardUser.payload.role}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontWeight: 700,
                        }}
                      >
                        Active Editor Mode
                      </span>
                      {usingDefaultPassword && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="This account is still using the default password. Update it for better security."
                        >
                          <ShieldAlert size={12} />
                          Default Password
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {currentBoardUser.payload.bio}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setUserModalTab('security');
                      setIsUserModalOpen(true);
                    }}
                    className={usingDefaultPassword ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    <KeyRound size={14} />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setUserModalTab('select');
                      setIsUserModalOpen(true);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    <Sparkles size={14} />
                    Manage Profile
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard Statistics Overview */}
            <StatsBanner
              posts={currentBoardUser.payload.posts}
              activeCategoryFilter={filters.category}
              onSelectCategoryFilter={(cat) => setFilters((f) => ({ ...f, category: cat }))}
              useTaskLabels={isPrivateUser}
            />

            {/* Search, Filter & View Mode Controls */}
            <FilterBar
              filters={filters}
              onFilterChange={(updated) => setFilters((f) => ({ ...f, ...updated }))}
              onResetFilters={() =>
                setFilters({
                  search: '',
                  category: 'All',
                  status: 'All',
                  priority: 'All',
                  sortBy: 'dueDate',
                  sortOrder: 'asc',
                })
              }
              layoutMode={layoutMode}
              onLayoutModeChange={setLayoutMode}
              useTaskLabels={isPrivateUser}
            />

            {/* The 4 Core Bulletin Categories Sections Container */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  filters.category !== 'All'
                    ? '1fr'
                    : layoutMode === 'kanban'
                    ? 'repeat(auto-fit, minmax(300px, 1fr))'
                    : 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {/* Category 1: Ongoing Works */}
              {(filters.category === 'All' || filters.category === 'Ongoing Works') && (
                <CategorySection
                  category="Ongoing Works"
                  posts={ongoingPosts}
                  isLoggedIn={isLoggedIn}
                  onAddPost={(cat) => handleOpenCreatePost(cat)}
                  onEditPost={(p) => handleOpenEditPost(p)}
                  onDeletePost={handleDeletePost}
                  onArchivePost={handleArchivePost}
                  onStatusChange={handleStatusChange}
                  layoutMode={layoutMode}
                  useTaskLabels={isPrivateUser}
                />
              )}

              {/* Category 2: Upcoming Works */}
              {(filters.category === 'All' || filters.category === 'Upcoming Works') && (
                <CategorySection
                  category="Upcoming Works"
                  posts={upcomingPosts}
                  isLoggedIn={isLoggedIn}
                  onAddPost={(cat) => handleOpenCreatePost(cat)}
                  onEditPost={(p) => handleOpenEditPost(p)}
                  onDeletePost={handleDeletePost}
                  onArchivePost={handleArchivePost}
                  onStatusChange={handleStatusChange}
                  layoutMode={layoutMode}
                  useTaskLabels={isPrivateUser}
                />
              )}

              {/* Category 3: Holiday Works */}
              {(filters.category === 'All' || filters.category === 'Holiday Works') && (
                <CategorySection
                  category="Holiday Works"
                  posts={holidayPosts}
                  isLoggedIn={isLoggedIn}
                  onAddPost={(cat) => handleOpenCreatePost(cat)}
                  onEditPost={(p) => handleOpenEditPost(p)}
                  onDeletePost={handleDeletePost}
                  onArchivePost={handleArchivePost}
                  onStatusChange={handleStatusChange}
                  layoutMode={layoutMode}
                  useTaskLabels={isPrivateUser}
                />
              )}

              {/* Category 4: Completed Works Cards */}
              {(filters.category === 'All' || filters.category === 'Completed Works') && (
                <CategorySection
                  category="Completed Works"
                  posts={completedPosts}
                  isLoggedIn={isLoggedIn}
                  onAddPost={(cat) => handleOpenCreatePost(cat)}
                  onEditPost={(p) => handleOpenEditPost(p)}
                  onDeletePost={handleDeletePost}
                  onArchivePost={handleArchivePost}
                  onStatusChange={handleStatusChange}
                  layoutMode={layoutMode}
                  useTaskLabels={isPrivateUser}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Login / Registration Modal */}
      <LoginFormModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingAction(null);
        }}
        users={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
        promptMessage={loginPromptMessage}
      />

      {/* Private / Personal Board Login Modal — separate flow, no shared user list */}
      <PrivateLoginModal
        isOpen={isPrivateLoginModalOpen}
        onClose={() => setIsPrivateLoginModalOpen(false)}
        onLogin={handleLogin}
        onRegisterPrivate={handleRegisterPrivate}
      />

      {/* Post Create / Edit Modal (also reused by the Admin Dashboard to edit any user's post) */}
      <PostFormModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setAdminEditContext(null);
          setArchiveEditMode(false);
        }}
        onSave={handleSavePost}
        initialCategory={targetCategoryForAdd}
        editingPost={editingPost}
        useTaskLabels={isPrivateUser}
        archiveMode={archiveEditMode}
      />

      {/* User / Profile Management Modal */}
      <UserSelectorModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        activeUser={activeUser}
        initialTab={userModalTab}
        onSelectUser={handleSelectUser}
        onCreateUser={handleRegister}
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
        onUpdateUser={handleAdminUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Notification Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
