import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Trang chủ', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="decks" options={{ title: 'Bộ từ', tabBarIcon: icon('📚') }} />
      <Tabs.Screen name="stats" options={{ title: 'Thống kê', tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat AI', tabBarIcon: icon('🤖') }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}