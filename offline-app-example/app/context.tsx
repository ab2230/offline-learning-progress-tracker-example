import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  addUser as addUserStorage,
  getCurrentUser,
  getUsers,
  setCurrentUser as setCurrentUserStorage,
  getAutoSync,
  setAutoSync as setAutoSyncStorage,
  getSyncPayload,
  clearQueue,
  mergeUsersLocal,
  getQueue,
} from './storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Deterministic ID from name for simple demo (not for production uniqueness)
function makeUserId(name: string): string {
  const base = name.trim().toLowerCase().replace(/\s+/g, '-');
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `${base}-${hash.toString(36)}`;
}

export type AppContextType = {
  users: string[];
  displayUsers: { id: string; name: string }[];
  currentUser: string | null;
  addUser: (name: string) => Promise<void>;
  selectUser: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  // Connectivity
  isOnline: boolean;
  // Auto sync setting
  autoSync: boolean;
  setAutoSync: (v: boolean) => Promise<void>;
  // Sync actions
  syncNow: () => Promise<void>;
  isSyncing: boolean;
  // Server users
  serverUsers: string[];
  refreshServerUsers: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [autoSync, setAutoSyncState] = useState<boolean>(false);
  const [serverUsers, setServerUsers] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refresh = async () => {
    const [u, c] = await Promise.all([getUsers(), getCurrentUser()]);
    setUsers(u);
    setCurrentUser(c);
  };

  useEffect(() => {
    refresh();
    // load auto-sync setting
    (async () => {
      const v = await getAutoSync();
      setAutoSyncState(v);
    })();
    // subscribe to connectivity changes
    const unsub = NetInfo.addEventListener(async (state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) {
        // Fetch server users when coming online
        await refreshServerUsers();
        // Auto-sync queued items if enabled
        if (await getAutoSync()) {
          const q = await getQueue();
          if (q.length > 0) {
            await syncNow();
          }
        }
      }
    });
    return () => unsub();
  }, []);

  const addUser = async (name: string) => {
    // Always update local first for offline safety
    await addUserStorage(name);
    // If online, also push to backend immediately
    try {
      if (isOnline) {
        await postSync({ users: [name], progress: [] });
      }
    } catch {}
    await refresh();
  };

  const selectUser = async (name: string) => {
    await setCurrentUserStorage(name);
    await refresh();
  };

  const setAutoSync = async (v: boolean) => {
    await setAutoSyncStorage(v);
    setAutoSyncState(v);
  };

  const refreshServerUsers = async () => {
    try {
      if (!isOnline) return;
      const res = await fetch(`${BACKEND_URL}/progress`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const srvUsers: string[] = Array.isArray(data?.users) ? data.users : [];
      setServerUsers(srvUsers);
      // Optionally merge them locally so user sees them in the list
      if (srvUsers.length) await mergeUsersLocal(srvUsers);
      await refresh();
    } catch (e) {
      // ignore fetch errors when offline or server unreachable
    }
  };

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      const payload = await getSyncPayload();
      await postSync(payload);
      await clearQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  async function postSync(payload: { users: string[]; progress: any[] }) {
    const res = await fetch(`${BACKEND_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  const value = useMemo(
    () => ({
      users,
      displayUsers: users.map((name) => ({ id: makeUserId(name), name })),
      currentUser,
      addUser,
      selectUser,
      refresh,
      isOnline,
      autoSync,
      setAutoSync,
      syncNow,
      isSyncing,
      serverUsers,
      refreshServerUsers,
    }),
    [users, currentUser, isOnline, autoSync, isSyncing, serverUsers]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
