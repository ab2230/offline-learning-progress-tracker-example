import React, { useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, TextInput, View, Text, TouchableOpacity, Switch } from 'react-native';
import { useApp } from '../context';

export default function StudentsScreen() {
  const [name, setName] = useState('');
  const { displayUsers, currentUser, addUser, selectUser, autoSync, setAutoSync, isOnline, syncNow } = useApp();

  const onAdd = async () => {
    if (!name.trim()) return;
    await addUser(name.trim());
    setName('');
    Alert.alert('Saved', 'Student added and selected for this session.');
  };

  const onSelect = async (u: string) => {
    await selectUser(u);
    Alert.alert('Selected', `${u} is now the active student.`);
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.title}>Students</Text>
      <Text>Create or select a student profile.</Text>

      <View style={styles.row}>
        <TextInput
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Button title="Add" onPress={onAdd} />
      </View>

      <Text style={styles.subtitle}>Students</Text>
      <FlatList
        data={displayUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelect(item.name)} style={[styles.userItem, currentUser === item.name && styles.userItemActive]}>
            <Text style={styles.userText}>{item.name}</Text>
            {currentUser === item.name && <Text style={styles.badge}>current</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No students yet. Add one above.</Text>}
      />

      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Sync Settings</Text>
      <View style={[styles.userItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <Text style={styles.userText}>Auto Sync on reconnect</Text>
        <Switch
          value={autoSync}
          onValueChange={async (v) => {
            await setAutoSync(v);
            if (v && isOnline) {
              try {
                await syncNow();
                Alert.alert('Auto Sync', 'Online: queued data synced.');
              } catch {}
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: 'white',
  },
  userItemActive: {
    borderColor: '#4f46e5',
  },
  userText: { fontSize: 16 },
  badge: { color: '#4f46e5', fontSize: 12 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '500', marginTop: 16 },
});
