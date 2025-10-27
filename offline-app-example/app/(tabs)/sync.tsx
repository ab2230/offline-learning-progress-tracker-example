import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View, ScrollView } from 'react-native';
import { clearQueue, getQueue, getSyncPayload } from '../storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function SyncScreen() {
  const [queueCount, setQueueCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<string>('');
  const [users, setUsers] = useState<string[]>([]);
  const [progress, setProgress] = useState<
    { user: string; activityId: string; answer?: string | null; correct?: boolean | null; timestamp: string }[]
  >([]);

  async function refresh() {
    const [q, payload] = await Promise.all([getQueue(), getSyncPayload()]);
    setQueueCount(q.length);
    setUsers(payload.users || []);
    setProgress(payload.progress || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  // Auto-refresh when the tab/screen is focused, and poll every 2s while focused
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      refresh();
      const id = setInterval(() => {
        if (mounted) refresh();
      }, 2000);
      return () => {
        mounted = false;
        clearInterval(id);
      };
    }, [])
  );

  const onHealthCheck = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      const data = await res.json();
      Alert.alert('Backend Health', JSON.stringify(data, null, 2));
    } catch (e: any) {
      Alert.alert('Health check failed', e?.message ?? String(e));
    }
  };

  const onSync = async () => {
    setLoading(true);
    try {
      const payload = await getSyncPayload();
      const res = await fetch(`${BACKEND_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await clearQueue();
      setLastStatus(`Synced successfully: users=${data.savedUsers}, progress=${data.savedProgress}`);
      Alert.alert('Synced', 'Data synced successfully.');
    } catch (e: any) {
      setLastStatus(`Sync failed: ${e?.message ?? String(e)}`);
      Alert.alert('Sync failed', e?.message ?? String(e));
    } finally {
      setLoading(false);
      refresh();
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Sync</Text>
      <Text>
        This screen sends locally saved progress to the backend once you have internet.
      </Text>

      <View style={styles.card}>
        <Text>Backend URL:</Text>
        <Text style={styles.mono}>{BACKEND_URL}</Text>
      </View>

      <View style={styles.row}>
        <Button title="Health Check" onPress={onHealthCheck} />
        <Button title="Refresh" onPress={refresh} />
        <Button title={loading ? 'Syncing…' : 'Sync Now'} onPress={onSync} disabled={loading || queueCount === 0} />
      </View>

      <View style={styles.card}>
        <Text>Queued entries: {queueCount}</Text>
        {lastStatus ? <Text style={styles.small}>{lastStatus}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Users to include</Text>
        {users.length === 0 ? (
          <Text style={styles.small}>No users yet.</Text>
        ) : (
          users.map((u) => (
            <Text key={u} style={styles.listItem}>• {u}</Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Progress queued</Text>
        {progress.length === 0 ? (
          <Text style={styles.small}>No offline entries queued.</Text>
        ) : (
          progress.map((p, idx) => (
            <View key={`${p.user}-${p.activityId}-${p.timestamp}-${idx}`} style={styles.itemRow}>
              <Text style={styles.itemTitle}>{p.user}</Text>
              <Text style={styles.small}>Activity: {p.activityId}</Text>
              <Text style={styles.small}>Answer: {p.answer ?? '—'} | Correct: {p.correct === null || p.correct === undefined ? '—' : p.correct ? 'Yes' : 'No'}</Text>
              <Text style={styles.small}>When: {new Date(p.timestamp).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    backgroundColor: 'white',
  },
  sectionTitle: { fontWeight: '600' },
  listItem: { fontSize: 14 },
  itemRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#eee' },
  itemTitle: { fontWeight: '600' },
  mono: { fontFamily: 'Courier', color: '#111827' },
  small: { fontSize: 12, color: '#374151' },
});
