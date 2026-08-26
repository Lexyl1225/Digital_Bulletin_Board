import type { SiteSettings } from '../types';

// A dedicated backend table doesn't exist, so homepage settings are persisted
// as a hidden sentinel row in the `users` table, identified by this name.
// Every place that lists real user accounts must filter this name out.
export const SITE_SETTINGS_RECORD_NAME = '__site_settings__';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  showRegisteredTeamMembers: true,
  showTeamBulletinMatrix: true,
};

export const parseSiteSettings = (rawDescription: string | null): SiteSettings => {
  if (!rawDescription) return { ...DEFAULT_SITE_SETTINGS };
  try {
    const parsed = JSON.parse(rawDescription);
    return {
      showRegisteredTeamMembers:
        typeof parsed.showRegisteredTeamMembers === 'boolean'
          ? parsed.showRegisteredTeamMembers
          : DEFAULT_SITE_SETTINGS.showRegisteredTeamMembers,
      showTeamBulletinMatrix:
        typeof parsed.showTeamBulletinMatrix === 'boolean'
          ? parsed.showTeamBulletinMatrix
          : DEFAULT_SITE_SETTINGS.showTeamBulletinMatrix,
    };
  } catch {
    return { ...DEFAULT_SITE_SETTINGS };
  }
};
