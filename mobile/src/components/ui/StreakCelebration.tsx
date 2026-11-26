import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export function StreakCelebration({
  visible,
  variant = 'gain',
  streak,
  onClose,
}: {
  visible: boolean;
  variant?: 'gain' | 'lost';
  streak: number;
  onClose: () => void;
}) {
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const gain = variant === 'gain';

  useEffect(() => {
    if (!visible) return undefined;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    Haptics.notificationAsync(
      gain ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    if (!gain) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, gain, pop, pulse]);

  const milestone = gain && MILESTONES.includes(streak);
  const title = gain ? `${streak} ngày liên tiếp!` : 'Chuỗi ngày học đã bị ngắt';
  const sub = gain
    ? milestone
      ? `Mốc ${streak} ngày, quá tuyệt vời! 🎉`
      : 'Bạn đã giữ được chuỗi học hôm nay. Mai nhớ quay lại nhé!'
    : `Bạn đã mất chuỗi ${streak} ngày. Bắt đầu lại ngay hôm nay nhé!`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: '#fff',
            borderRadius: 28,
            padding: 28,
            alignItems: 'center',
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            opacity: pop,
          }}
        >
          <Animated.View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: gain ? '#FFF1E6' : '#F1F1F5',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: gain ? pulse : 1 }],
            }}
          >
            <Text style={{ fontSize: 64 }}>{gain ? '🔥' : '💔'}</Text>
          </Animated.View>

          <Text style={{ marginTop: 18, fontSize: 26, fontWeight: '900', color: gain ? '#E8590C' : colors.text, textAlign: 'center' }}>
            {title}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 15, color: colors.muted, textAlign: 'center' }}>{sub}</Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              marginTop: 24,
              alignSelf: 'stretch',
              height: 52,
              borderRadius: 26,
              backgroundColor: gain ? '#FF8A3D' : colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{gain ? 'Tiếp tục' : 'Học lại ngay'}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}