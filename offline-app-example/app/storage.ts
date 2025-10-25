import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProgressEntry = {
  id?: string;
  user: string;
  activityId: string;
  answer?: string | null;
  correct?: boolean | null;
  timestamp: string; // ISO
};

const KEYS = {
  users: 'olt/users',
  currentUser: 'olt/currentUser',
  queue: 'olt/progressQueue',
  autoSync: 'olt/autoSync',
} as const;

export async function getUsers(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.users);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function addUser(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const users = await getUsers();
  if (!users.includes(trimmed)) {
    users.push(trimmed);
    await AsyncStorage.setItem(KEYS.users, JSON.stringify(users));
  }
  await setCurrentUser(trimmed);
}

export async function getCurrentUser(): Promise<string | null> {
  return (await AsyncStorage.getItem(KEYS.currentUser)) as string | null;
}

export async function setCurrentUser(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.currentUser, name);
}

export async function getQueue(): Promise<ProgressEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.queue);
  return raw ? (JSON.parse(raw) as ProgressEntry[]) : [];
}

export async function enqueue(entry: ProgressEntry): Promise<void> {
  const queue = await getQueue();
  queue.push(entry);
  await AsyncStorage.setItem(KEYS.queue, JSON.stringify(queue));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.setItem(KEYS.queue, JSON.stringify([]));
}

export async function getSyncPayload() {
  const [users, progress] = await Promise.all([getUsers(), getQueue()]);
  return { users, progress };
}

export async function getAutoSync(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.autoSync);
  return raw ? raw === 'true' : false;
}

export async function setAutoSync(v: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.autoSync, v ? 'true' : 'false');
}

export async function mergeUsersLocal(newUsers: string[]): Promise<void> {
  const existing = await getUsers();
  const set = new Set(existing);
  for (const u of newUsers) if (u && !set.has(u)) set.add(u);
  await AsyncStorage.setItem(KEYS.users, JSON.stringify(Array.from(set)));
}
