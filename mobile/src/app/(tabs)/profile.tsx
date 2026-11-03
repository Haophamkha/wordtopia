import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { StatsSection } from '../../components/StatsSection';
import { Avatar } from '../../components/ui/Avatar';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

function Row({ icon, tint, title, onPress, soon, last }: {
  icon: IconName; tint: string; title: string; onPress: () => void; soon?: boolean; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: '#00000010' }}>
      <XStack
        alignItems="center"
        gap={14}
        paddingHorizontal={16}
        paddingVertical={14}
        borderBottomWidth={last ? 0 : 1}
        borderBottomColor={colors.border}
      >
        <YStack width={38} height={38} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={tint + '1A'}>
          <Ionicons name={icon} size={20} color={tint} />
        </YStack>
        <Text flex={1} fontSize={16} fontWeight="600" color={colors.text}>{title}</Text>
        {soon ? (
          <YStack backgroundColor={colors.bg} paddingHorizontal={8} paddingVertical={3} borderRadius={8}>
            <Text fontSize={11} fontWeight="700" color={colors.muted}>Sắp có</Text>
          </YStack>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </XStack>
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="800" color={colors.muted} letterSpacing={0.6} paddingLeft={4}>{title}</Text>
      <YStack backgroundColor={colors.card} borderRadius={20} borderWidth={1} borderColor={colors.border} overflow="hidden">
        {children}
      </YStack>
    </YStack>
  );
}

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const avatar = (user as { avatar?: string | null } | null)?.avatar ?? null;

  const soon = (title: string) => () =>
    Alert.alert(title, 'Tính năng này sẽ có ở bản cập nhật sau.');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <YStack gap={22}>
          <YStack alignItems="center" gap={6} marginTop={6}>
            <Pressable onPress={() => router.push('/personal-info' as never)}>
              <YStack>
                <Avatar uri={avatar} name={user?.name} size={96} />
              </YStack>
            </Pressable>
            <Text fontSize={22} fontWeight="800" color={colors.text}>{user?.name}</Text>
            <Text color={colors.muted}>{user?.email}</Text>
          </YStack>

          <Group title="TÀI KHOẢN">
            <Row icon="person-outline" tint="#6C5CE7" title="Thông tin cá nhân" onPress={() => router.push('/personal-info' as never)} />
            <Row icon="star-outline" tint="#F5A623" title="Từ yêu thích" onPress={() => router.push('/favorites' as never)} last />
          </Group>

          <Group title="ỨNG DỤNG">
            <Row icon="notifications-outline" tint="#4C8DF6" title="Nhắc học hằng ngày" onPress={() => router.push('/reminder' as never)} />
            <Row icon="settings-outline" tint="#7A7A8C" title="Cài đặt" onPress={soon('Cài đặt')} soon last />
          </Group>

          <Group title="HỖ TRỢ">
            <Row icon="help-circle-outline" tint="#2EB67D" title="Trợ giúp và phản hồi" onPress={soon('Trợ giúp và phản hồi')} soon last />
          </Group>

          <YStack gap={10}>
            <Text fontSize={12} fontWeight="800" color={colors.muted} letterSpacing={0.6} paddingLeft={4}>THỐNG KÊ HỌC TẬP</Text>
            <StatsSection />
          </YStack>

          <PrimaryButton
            icon="log-out-outline"
            title="Đăng xuất"
            variant="danger"
            onPress={() =>
              Alert.alert('Đăng xuất?', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng xuất', style: 'destructive', onPress: async () => { qc.clear(); await logout(); } },
              ])
            }
          />
        </YStack>
      </ScrollView>
    </Screen>
  );
}