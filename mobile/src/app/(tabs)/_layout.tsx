import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useSurveyStore } from '../../store/survey';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (on: IconName, off: IconName) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? on : off} size={24} color={color} />;
  };

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const surveyLoaded = useSurveyStore((s) => s.loadedFor === userId);
  const surveyDone = useSurveyStore((s) => s.done);
  const loadSurvey = useSurveyStore((s) => s.load);
  const insets = useSafeAreaInsets();
  const tabBottom = Math.max(insets.bottom, 12);

  useEffect(() => {
    if (userId) loadSurvey(userId);
  }, [userId, loadSurvey]);

  if (!token) return <Redirect href="/login" />;
  if (!surveyLoaded) return null;
  if (!surveyDone) return <Redirect href="/survey" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 14,
          shadowColor: '#3D2FA8',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          paddingTop: 6,
          height: 58 + tabBottom,
          paddingBottom: tabBottom + 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Trang chủ', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="path" options={{ title: 'Lộ trình', tabBarIcon: icon('map', 'map-outline') }} />
      <Tabs.Screen name="decks" options={{ title: 'Bộ từ', tabBarIcon: icon('library', 'library-outline') }} />
      <Tabs.Screen name="chat" options={{ title: 'Gia sư AI', tabBarIcon: icon('chatbubble-ellipses', 'chatbubble-ellipses-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}