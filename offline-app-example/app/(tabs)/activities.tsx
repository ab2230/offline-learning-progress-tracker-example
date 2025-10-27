import React, { useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { enqueue, ProgressEntry } from '../storage';
import { useApp } from '../context';

function nowISO() {
  return new Date().toISOString();
}

type Activity = { id: string; label: string; correct: string };

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(index: number): Activity {
  const op = Math.random() < 0.5 ? '+' : '-';
  let a = randomInt(1, 10);
  let b = randomInt(1, 10);
  if (op === '-' && b > a) {
    // avoid negative results
    [a, b] = [b, a];
  }
  const correct = op === '+' ? String(a + b) : String(a - b);
  return { id: `q${index}`, label: `${a} ${op} ${b} = ?`, correct };
}

function randomQuestions(): Activity[] {
  return [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
}

export default function ActivitiesScreen() {
  const { currentUser, isOnline, submitProgress } = useApp();
  const [answers, setAnswers] = useState<{ [k: string]: string }>({});
  const [activities, setActivities] = useState<Activity[]>(() => randomQuestions());

  const onAnswer = (id: string, val: string) => setAnswers((a) => ({ ...a, [id]: val }));

  const onSubmit = async () => {
    if (!currentUser) {
      Alert.alert('No student selected', 'Please select a student on the Students tab.');
      return;
    }

    // Build entries from current answers
    const entries: ProgressEntry[] = activities.map((a) => {
      const given = (answers[a.id] || '').trim();
      const correct = given.length > 0 ? given === a.correct : null;
      return {
        user: currentUser!,
        activityId: a.id,
        answer: given || null,
        correct,
        timestamp: nowISO(),
      } as ProgressEntry;
    });

    if (isOnline) {
      try {
        await submitProgress(entries);
        Alert.alert('Saved and synced', `Sent ${entries.length} entries for ${currentUser}.`);
      } catch (e: any) {
        // Fallback to offline queue if post fails
        for (const entry of entries) await enqueue(entry);
        Alert.alert('Saved offline', `Queued ${entries.length} entries. Sync failed now, will retry later.`);
      }
    } else {
      for (const entry of entries) await enqueue(entry);
      Alert.alert('Saved offline', `Queued ${entries.length} activity entries for ${currentUser}. Go to Sync tab when online.`);
    }
    setAnswers({});
  };

  const onRefreshQuestions = () => {
    setActivities(randomQuestions());
    setAnswers({});
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Activities</Text>
      <Text>
        Answer a few quick questions. Entries are saved offline and can be synced later.
      </Text>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Current student: {currentUser ?? 'None selected'}</Text>
      </View>

      <View style={styles.row}>
        <Button title="Refresh Questions" onPress={onRefreshQuestions} />
      </View>

      {activities.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.label}>{a.label}</Text>
          <TextInput
            placeholder="Your answer"
            value={answers[a.id] || ''}
            onChangeText={(t) => onAnswer(a.id, t)}
            style={styles.input}
            keyboardType="numeric"
          />
        </View>
      ))}

      <Button title={!isOnline ? "Save Offline" : "Save"} onPress={onSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    backgroundColor: 'white',
  },
  label: { fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  banner: {
    padding: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  bannerText: { color: '#3730a3' },
});
