import { useQueryClient } from '@tanstack/react-query';
import { Text, YStack } from 'tamagui';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();

  return (
    <Screen>
      <YStack padding={20} gap={20}>
        <YStack alignItems="center" gap={8} marginTop={20}>
          <YStack width={88} height={88} borderRadius={44} backgroundColor={colors.primary} alignItems="center" justifyContent="center">
            <Text color="#fff" fontSize={36} fontWeight="800">{user?.name?.charAt(0).toUpperCase()}</Text>
          </YStack>
          <Text fontSize={22} fontWeight="800" color={colors.text}>{user?.name}</Text>
          <Text color={colors.muted}>{user?.email}</Text>
        </YStack>

        <PrimaryButton
          title="Đăng xuất"
          variant="danger"
          onPress={async () => {
            qc.clear();
            await logout();
          }}
        />
      </YStack>
    </Screen>
  );
}