import type { UserPayload, Post } from '../types';

// Set via VITE_DEFAULT_PASSWORD in .env / .env.local (gitignored) — must
// match the backend's DEFAULT_USER_PASSWORD (app.py) exactly, since this
// value is only ever used for UI hint text, not for actual authentication.
export const DEFAULT_USER_PASSWORD = import.meta.env.VITE_DEFAULT_PASSWORD || 'ChangeMe123!';

export const DEFAULT_AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const getDefaultPosts = (): Post[] => {
  const now = new Date();
  const dateStr = (daysAdd: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAdd);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: `post-${Date.now()}-1`,
      title: 'Substation Transformer Relay Calibration',
      category: 'Ongoing Works',
      content: 'Conducting routine diagnostic calibration and secondary injection testing on Main Transformer T1 protection relays.',
      status: 'In Progress',
      priority: 'High',
      startDate: dateStr(-3),
      dueDate: dateStr(4),
      tags: ['Substation', 'High Voltage', 'Safety Audit'],
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
      assigneeNotes: 'Primary injection tests completed. Secondary loop testing remaining.',
      completionPercent: 65,
    },
    {
      id: `post-${Date.now()}-2`,
      title: 'SCADA Telemetry System Firmware Patching',
      category: 'Ongoing Works',
      content: 'Applying critical security hotfixes to field RTU units and verifying IEC 60870-5-104 protocol telemetry handshake.',
      status: 'Under Review',
      priority: 'Medium',
      startDate: dateStr(-1),
      dueDate: dateStr(2),
      tags: ['SCADA', 'Cybersecurity', 'RTU'],
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
      assigneeNotes: 'Pending final sign-off from IT Security Officer.',
      completionPercent: 90,
    },
    {
      id: `post-${Date.now()}-3`,
      title: 'Q4 Electrical Distribution Network Expansion Plan',
      category: 'Upcoming Works',
      content: 'Drafting engineering schematics and load flow simulations for 33kV feeder extension to the new Industrial Zone B.',
      status: 'Scheduled',
      priority: 'High',
      startDate: dateStr(10),
      dueDate: dateStr(30),
      tags: ['Grid Planning', 'Load Flow', 'Schematics'],
      createdAt: new Date(now.getTime() - 86400000 * 1).toISOString(),
      updatedAt: new Date().toISOString(),
      assigneeNotes: 'Awaiting geographical survey data from municipal authority.',
      completionPercent: 15,
    },
    {
      id: `post-${Date.now()}-4`,
      title: 'Solar Inverter Grid Interconnection Testing',
      category: 'Upcoming Works',
      content: 'Perform harmonic distortion and reactive power injection verification for 5MW rooftop PV array.',
      status: 'Pending',
      priority: 'Medium',
      startDate: dateStr(14),
      dueDate: dateStr(21),
      tags: ['Renewable', 'Solar', 'Compliance'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assigneeNotes: 'Testing equipment calibrated and reserved.',
      completionPercent: 0,
    },
    {
      id: `post-${Date.now()}-5`,
      title: 'Labor Day Weekend Duty & Emergency On-Call Duty',
      category: 'Holiday Works',
      content: 'Primary emergency dispatch responder for power distribution outages during the upcoming holiday weekend.',
      status: 'Scheduled',
      priority: 'High',
      startDate: dateStr(18),
      dueDate: dateStr(20),
      tags: ['Holiday Coverage', 'On-Call', 'Emergency Dispatch'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assigneeNotes: 'Satphone and emergency vehicle keys verified.',
      completionPercent: 0,
    },
    {
      id: `post-${Date.now()}-6`,
      title: 'Annual High-Voltage Breaker Insulation Test',
      category: 'Completed Works',
      originalCategory: 'Ongoing Works',
      content: 'Successfully executed insulation resistance testing and dielectric oil sample analysis on Circuit Breaker CB-104.',
      status: 'Completed',
      priority: 'High',
      startDate: dateStr(-10),
      dueDate: dateStr(-2),
      tags: ['Maintenance', 'High Voltage', 'Insulation Test'],
      createdAt: new Date(now.getTime() - 86400000 * 10).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      completedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      assigneeNotes: 'All insulation resistance values passed IEC 62271 standards.',
      completionPercent: 100,
    },
  ];
};

export const parseUserDescription = (rawDescription: string | null): UserPayload => {
  if (!rawDescription) {
    return {
      bio: 'Professional Team Member',
      role: 'Engineer / Operations',
      avatarColor: DEFAULT_AVATAR_COLORS[Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length)],
      usingDefaultPassword: true,
      isAdmin: false,
      posts: getDefaultPosts(),
      archivedPosts: [],
    };
  }

  try {
    const parsed = JSON.parse(rawDescription);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        bio: parsed.bio || 'Professional Team Member',
        role: parsed.role || 'Team Member',
        department: parsed.department || 'Operations',
        avatarColor: parsed.avatarColor || DEFAULT_AVATAR_COLORS[0],
        usingDefaultPassword: !!parsed.usingDefaultPassword,
        themePreference: parsed.themePreference || 'dark',
        isAdmin: !!parsed.isAdmin,
        posts: Array.isArray(parsed.posts) ? parsed.posts : getDefaultPosts(),
        archivedPosts: Array.isArray(parsed.archivedPosts) ? parsed.archivedPosts : [],
      };
    }
  } catch {
    return {
      bio: rawDescription,
      role: 'Electrical / Software Engineer',
      avatarColor: DEFAULT_AVATAR_COLORS[0],
      usingDefaultPassword: true,
      isAdmin: false,
      posts: getDefaultPosts(),
      archivedPosts: [],
    };
  }

  return {
    bio: 'Professional Team Member',
    role: 'Team Member',
    avatarColor: DEFAULT_AVATAR_COLORS[0],
    usingDefaultPassword: true,
    isAdmin: false,
    posts: getDefaultPosts(),
    archivedPosts: [],
  };
};

// 'isAdmin' and 'isPrivate' are server-owned columns now, never
// client-writable JSON fields — the backend ignores them in this blob
// anyway, but omit them here too so nothing suggests they're a real write
// channel.
export const serializeUserPayload = (payload: UserPayload): string => {
  const { isAdmin, isPrivate, ...rest } = payload;
  return JSON.stringify(rest);
};
