let skipUntil = 0;
let composing = false;
let saveLock = 0;
let lastLocalSaveAt = null;

export function pauseCommentSync(ms = 3000) {
  skipUntil = Date.now() + ms;
}

export function beginSaveLock() {
  saveLock += 1;
}

export function endSaveLock() {
  saveLock = Math.max(0, saveLock - 1);
}

export function shouldSkipCommentSync() {
  return Date.now() < skipUntil || composing || saveLock > 0;
}

/** Skip realtime board reload while saving or briefly after a local save */
export function shouldSkipBoardReload() {
  return shouldSkipCommentSync();
}

export function markBoardSaveComplete(updatedAt) {
  if (updatedAt) lastLocalSaveAt = updatedAt;
  pauseCommentSync(2500);
}

export function getLastLocalSaveAt() {
  return lastLocalSaveAt;
}

export function setCommentComposing(active) {
  composing = !!active;
}

export function isCommentComposing() {
  return composing;
}

/** Keep local draft threads (no replies yet) when merging remote saves. */
export function mergeComments(local = [], remote = []) {
  const remoteIds = new Set(remote.map((c) => c.id));
  const drafts = local.filter((c) => c.replies.length === 0 && !remoteIds.has(c.id));
  return [...remote, ...drafts];
}
