const NAME_KEY = 'compass-display-name';

const COLORS = ['#c8102e', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#4f46e5'];

/** Unique per tab — in-memory only (sessionStorage is cloned when duplicating tabs) */
const TAB_SESSION_ID = crypto.randomUUID();

export function getDisplayName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function setDisplayName(name) {
  const trimmed = name.trim().slice(0, 32);
  try {
    if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* private browsing */
  }
  return trimmed;
}

export function needsDisplayName() {
  return !getDisplayName();
}

export function getSessionId() {
  return TAB_SESSION_ID;
}

export function ensureDisplayName() {
  return getDisplayName();
}

export function colorForSession(sessionId) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function displayLabel(name) {
  const trimmed = (name || '').trim();
  return trimmed || 'Guest';
}
