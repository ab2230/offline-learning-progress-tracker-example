# Offline Learning Progress Tracker (Expo)

This is a simple demo app for an offline-first learning progress tracker. Students can:

- Create/select their name.
- Complete a few simple activities (3 math questions).
- Save progress locally so it works fully offline.
- When internet is available, sync the data to a mock backend server.

Tech: Expo (React Native), AsyncStorage, minimal Express backend.

## Project structure

- App directory: `offline-app-example/`
- Backend server: `../backend-offline-app/`

## Prerequisites

- Node 18+
- Expo CLI (installed automatically via `npx expo start`)

## Install dependencies

```bash
# in the app directory
npm install

# install AsyncStorage if not already present
npm install @react-native-async-storage/async-storage
```

## Configure backend URL (optional)

By default the app syncs to `http://localhost:4000`. You can override this by setting an environment variable when starting the app:

```bash
EXPO_PUBLIC_BACKEND_URL="http://<your-ip>:4000" npx expo start
```

Tip: On a real device, use your computer's LAN IP instead of `localhost`.

## Run the backend server

Follow the backend README in `../backend-offline-app/`, or quick start:

```bash
cd ../backend-offline-app
npm install
npm run start
# server runs at http://localhost:4000
```

## Start the app

From this directory:

```bash
npx expo start
```

Open on iOS simulator, Android emulator, or Expo Go.

## How it works

- Students tab: create/select a student (stored in AsyncStorage).
- Activities tab: answer 3 math questions. Submissions are queued locally (offline safe).
- Sync tab: when online, press "Sync Now" to POST queued data to the backend and clear the queue. Shows success/failure.

## Files of interest

- Tabs layout: `app/(tabs)/_layout.tsx`
- Students screen: `app/(tabs)/students.tsx`
- Activities screen: `app/(tabs)/activities.tsx`
- Sync screen: `app/(tabs)/sync.tsx`
- Storage helpers: `app/storage.ts`

## Notes

- The UI is intentionally minimal to focus on functionality.
- Multiple students are supported. Current selection is indicated and used for activity submissions.
- Queue deduplication is handled server-side based on `user + activityId + timestamp`.
