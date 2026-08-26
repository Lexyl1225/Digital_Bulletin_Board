import type { ApiUser, SiteSettings, UserPayload } from '../types';
import { parseUserDescription, serializeUserPayload, DEFAULT_USER_PASSWORD } from './initialData';

const BASE_URL = '';

export interface FormattedUser {
  id: number;
  name: string;
  payload: UserPayload;
}

const toFormattedUser = (u: ApiUser): FormattedUser => ({
  id: u.id,
  name: u.name,
  payload: {
    ...parseUserDescription(u.description),
    gender: u.gender || 'Unspecified',
    isAdmin: !!u.isAdmin,
    isPrivate: !!u.isPrivate,
  },
});

// Raw fetch with no UserPayload parsing — used when a row (like the site
// settings record) isn't shaped like a real user account.
export const fetchAllUsersRaw = async (): Promise<ApiUser[]> => {
  const response = await fetch(`${BASE_URL}/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return response.json();
};

export const fetchAllUsers = async (): Promise<FormattedUser[]> => {
  const data = await fetchAllUsersRaw();
  return data.map(toFormattedUser);
};

// Verifies credentials server-side. The plaintext password is only ever sent
// once, over this call; it is never stored or echoed back by the API. On
// success the server sets an httpOnly session cookie — nothing else to do
// here to "stay logged in".
export const loginUser = async (name: string, password: string): Promise<FormattedUser> => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Incorrect password.');
  }

  const u: ApiUser = await response.json();
  return toFormattedUser(u);
};

export const logoutUser = async (): Promise<void> => {
  await fetch(`${BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
};

// Asks the server who — if anyone — the current session cookie belongs to.
// This is the only source of truth for "am I logged in"; never trust a
// locally-remembered user id for that.
export const fetchCurrentUser = async (): Promise<FormattedUser | null> => {
  const response = await fetch(`${BASE_URL}/me`, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch current session: ${response.statusText}`);
  }
  const u: ApiUser = await response.json();
  return toFormattedUser(u);
};

export const fetchUserById = async (userId: number): Promise<FormattedUser> => {
  const response = await fetch(`${BASE_URL}/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user ${userId}: ${response.statusText}`);
  }
  const u: ApiUser = await response.json();
  return toFormattedUser(u);
};

export const createNewUser = async (
  name: string,
  bio?: string,
  role?: string,
  password?: string,
  gender?: string,
  department?: string,
  avatarColor?: string,
  isPrivate?: boolean
): Promise<FormattedUser> => {
  const initialPayload: UserPayload = {
    bio: bio || 'Bulletin board contributor',
    role: role || 'Team Member',
    department: department || 'Engineering',
    gender: gender || 'Unspecified',
    password: password || DEFAULT_USER_PASSWORD,
    isAdmin: false,
    isPrivate: !!isPrivate,
    avatarColor:
      avatarColor ||
      ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'][
        Math.floor(Math.random() * 6)
      ],
    posts: [],
    archivedPosts: [],
  };

  const serialized = serializeUserPayload(initialPayload);

  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      gender: initialPayload.gender,
      description: serialized,
      isPrivate: initialPayload.isPrivate,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create user: ${response.statusText}`);
  }

  // Registration auto-signs the new account in (the server sets the session
  // cookie on this same response), same as /login.
  const result = await response.json();
  return {
    id: result.id,
    name,
    payload: { ...initialPayload, isAdmin: !!result.isAdmin, isPrivate: !!result.isPrivate },
  };
};

// Registers a private/personal account — same endpoint as createNewUser,
// just with sensible non-identifying defaults for the fields the private
// registration form doesn't ask for (role/department/gender don't matter
// for a board nobody else will ever see).
export const registerPrivateUser = async (
  name: string,
  password?: string,
  bio?: string
): Promise<FormattedUser> =>
  createNewUser(
    name,
    bio || 'Personal notes & tasks',
    'Private Account',
    password,
    'Unspecified',
    'Personal',
    undefined,
    true
  );

export const updateUserData = async (
  userId: number,
  userName: string,
  payload: UserPayload
): Promise<void> => {
  const serialized = serializeUserPayload(payload);

  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: userName,
      gender: payload.gender || 'Unspecified',
      description: serialized,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update user: ${response.statusText}`);
  }
};

// The only way 'isAdmin' can ever change — a dedicated, admin-only route the
// generic profile-update endpoint deliberately never touches.
export const setUserAdminStatus = async (userId: number, isAdmin: boolean): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/${userId}/admin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAdmin }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update admin status: ${response.statusText}`);
  }
};

export const deleteUserAccount = async (userId: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete user: ${response.statusText}`);
  }
};

// -----------------------------------------------------------------------
// Site-wide Homepage Settings — stored as a hidden sentinel row in the same
// `users` table (this backend has no dedicated settings table), so it must
// be filtered out of every normal user listing by the caller.
// -----------------------------------------------------------------------

export const createSiteSettingsRecord = async (name: string, settings: SiteSettings): Promise<number> => {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, gender: 'System', description: JSON.stringify(settings) }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save homepage settings: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
};

export const updateSiteSettingsRecord = async (id: number, name: string, settings: SiteSettings): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, gender: 'System', description: JSON.stringify(settings) }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save homepage settings: ${response.statusText}`);
  }
};
