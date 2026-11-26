import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useUnreadCount } from '../../hooks/useNotifications';
import { colors } from '../../theme/colors';

export function BellButton() {
  const { data } = useUnreadCount();
  const n = data?.count ?? 0;
  return (
    <Pressable
      onPress={() => router.push('/notifications' as never)}
      hitSlop={8}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {n > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{n > 99 ? '99+' : n}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}