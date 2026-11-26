import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

export function GoalCelebration({
  visible,
  goal,
  onClose,
}: {
  visible: boolean;
  goal: number;
  onClose: () => void;
}) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [visible, pop]);

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
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#E6F7EF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 64 }}>🎯</Text>
          </View>
          <Text style={{ marginTop: 18, fontSize: 26, fontWeight: '900', color: '#1B7F57', textAlign: 'center' }}>
            Đạt mục tiêu hôm nay!
          </Text>
          <Text style={{ marginTop: 8, fontSize: 15, color: colors.muted, textAlign: 'center' }}>
            Bạn đã hoàn thành {goal} từ trong ngày. Giỏi quá! 🎉
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              marginTop: 24,
              alignSelf: 'stretch',
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.success,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Tuyệt vời</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}