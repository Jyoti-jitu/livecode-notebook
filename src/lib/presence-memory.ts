type PresenceEntry = { username: string; roomId: string; lastActive: Date };
const PRESENCE_TTL_MS = 12_000;
const memoryStore = new Map<string, PresenceEntry>();

function presenceKey(username: string, roomId: string) { return `${roomId}::${username}`; }

function cleanupMemory() {
  const expiry = Date.now() - PRESENCE_TTL_MS;
  for (const [key, entry] of memoryStore) {
    if (entry.lastActive.getTime() < expiry) memoryStore.delete(key);
  }
}

export function memoryUpsertPresence(username: string, roomId: string): string[] {
  memoryStore.set(presenceKey(username, roomId), { username, roomId, lastActive: new Date() });
  cleanupMemory();
  return memoryGetOnlineUsers(roomId);
}

export function memoryGetOnlineUsers(roomId: string): string[] {
  cleanupMemory();
  const users = new Set<string>();
  for (const entry of memoryStore.values()) {
    if (entry.roomId === roomId) users.add(entry.username);
  }
  return [...users];
}
