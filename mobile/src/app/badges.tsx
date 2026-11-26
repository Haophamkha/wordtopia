import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../api/client';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

interface Badge {
  key: string;
  emoji: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  earned: boolean;
  earnedAt: string | null;
}

interface BadgesData {
  earned: number;
  total: number;
  badges: Badge[];
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/profile' as never);
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function Badges() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get<BadgesData>('/badges').then((r) => r.data),
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" justifyContent="space-between">
        <YStack>
          <Text fontSize={24} fontWeight="800" color={colors.text}>🏅 Huy hiệu</Text>
          {data ? <Text color={colors.muted}>Đã nhận {data.earned}/{data.total}</Text> : null}
        </YStack>
        <Pressable onPress={goBack} hitSlop={10}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
      </XStack>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : error || !data ? (
          <YStack gap={8}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <Pressable onPress={() => refetch()}><Text color={colors.primary} fontWeight="700">Thử lại</Text></Pressable>
          </YStack>
        ) : (
          <XStack flexWrap="wrap" justifyContent="space-between" rowGap={12}>
            {data.badges.map((b) => {
              const pct = Math.round((b.progress / b.target) * 100);
              return (
                <YStack
                  key={b.key}
                  width="48%"
                  padding={14}
                  gap={6}
                  alignItems="center"
                  borderRadius={18}
                  borderWidth={2}
                  borderColor={b.earned ? colors.primary : colors.border}
                  backgroundColor={b.earned ? '#EFEBFF' : colors.card}
                >
                  <Text fontSize={40} opacity={b.earned ? 1 : 0.3}>{b.emoji}</Text>
                  <Text fontWeight="800" color={b.earned ? colors.text : colors.muted} textAlign="center">{b.title}</Text>
                  <Text fontSize={12} color={colors.muted} textAlign="center">{b.description}</Text>
                  {b.earned ? (
                    <Text fontSize={12} fontWeight="700" color="#1B7F57">
                      ✓ {b.earnedAt ? fmt(b.earnedAt) : 'Đã nhận'}
                    </Text>
                  ) : (
                    <YStack width="100%" gap={3}>
                      <YStack height={6} borderRadius={3} backgroundColor={colors.border} overflow="hidden">
                        <YStack height={6} width={`${pct}%`} backgroundColor={colors.primary} />
                      </YStack>
                      <Text fontSize={11} color={colors.muted} textAlign="center">{b.progress}/{b.target}</Text>
                    </YStack>
                  )}
                </YStack>
              );
            })}
          </XStack>
        )}
      </ScrollView>
    </Screen>
  );
}
