import { View, Text as RNText } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppProvider } from './context';
import { useApp } from './context';

export const unstable_settings = {
  anchor: '(tabs)',
};

const MainApp = () => {
  const insets = useSafeAreaInsets();
  const { isOnline, isSyncing, justCameOnline } = useApp();
  const showBanner = !isOnline || isSyncing || justCameOnline;
  const bannerBg = !isOnline ? '#dc2626' : '#16a34a';
  const bannerText = !isOnline
    ? 'Offline: Saving locally. Sync when back online.'
    : isSyncing
      ? 'Online: Auto-sync in progress…'
      : 'Back online';
  return (
    <View
    style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}
  >
        {showBanner && (
          <View style={{ backgroundColor: bannerBg, paddingVertical: 6, paddingHorizontal: 12 }}>
            <StatusBar style="light" />
            <BannerText text={bannerText} />
          </View>
        )}
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      </View>
  );
}

function BannerText({ text }: { text: string }) {
  return (
    <View>
      <TextComponent text={text} />
    </View>
  );
}
function TextComponent({ text }: { text: string }) {
  return <RNText style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>{text}</RNText>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
