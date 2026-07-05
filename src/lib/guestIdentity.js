const NAME_KEY = 'compass-display-name';
const SESSION_KEY = 'compass-session-id';

const COLORS = ['#c8102e', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#4f46e5'];

/** Persistent display name — shared across tabs on the same browser */
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

/** Unique per browser tab — used as Supabase presence key */
export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Returns saved name or empty string — never auto-generates fake names */
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
