import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, useWindowDimensions } from 'react-native';
import { Text, YStack } from 'tamagui';
import { colors } from '../theme/colors';
import { SpeakButton } from './exercises/ui';

export interface ReviewWord {
  id: number;
  term: string;
  meaning: string;
  phonetic?: string | null;
  example?: string | null;
  exampleMeaning?: string | null;
  imageUrl?: string | null;
  isNew?: boolean;
}

const face = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backfaceVisibility: 'hidden' as const,
  backgroundColor: '#fff',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 24,
};

export function ReviewCard({ word, flipped, onFlip }: { word: ReviewWord; flipped: boolean; onFlip: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const { height: winH } = useWindowDimensions();
  const cardH = Math.min(380, Math.max(170, winH * 0.4));

  useEffect(() => {
    Animated.spring(anim, { toValue: flipped ? 1 : 0, friction: 8, tension: 10, useNativeDriver: true }).start();
  }, [flipped, anim]);

  const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Pressable onPress={onFlip} style={{ width: '100%', maxWidth: 520, alignSelf: 'center', height: cardH }}>
      <Animated.View style={[face, { transform: [{ perspective: 1000 }, { rotateY: frontRot }] }]}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          {word.isNew ? (
            <YStack backgroundColor="#EFEBFF" paddingHorizontal={10} paddingVertical={4} borderRadius={10}>
              <Text fontSize={12} fontWeight="700" color={colors.primary}>Từ mới</Text>
            </YStack>
          ) : null}
          <Text fontSize={40} fontWeight="800" color={colors.text} textAlign="center">{word.term}</Text>
          {word.phonetic ? <Text fontSize={16} color={colors.muted}>{word.phonetic}</Text> : null}
          <SpeakButton text={word.term} />
          <Text fontSize={12} color={colors.muted} marginTop={8}>Chạm để lật thẻ</Text>
        </YStack>
      </Animated.View>

      <Animated.View style={[face, { transform: [{ perspective: 1000 }, { rotateY: backRot }] }]}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap={10}>
          {word.imageUrl ? (
            <Image source={{ uri: word.imageUrl }} style={{ width: 110, height: 110, borderRadius: 14 }} contentFit="cover" />
          ) : null}
          <Text fontSize={30} fontWeight="800" color={colors.primary} textAlign="center">{word.meaning}</Text>
          {word.example ? (
            <YStack gap={4} marginTop={8} alignItems="center">
              <Text fontSize={15} color={colors.text} textAlign="center">{word.example}</Text>
              {word.exampleMeaning ? (
                <Text fontSize={13} color={colors.muted} textAlign="center">{word.exampleMeaning}</Text>
              ) : null}
            </YStack>
          ) : null}
        </YStack>
      </Animated.View>
    </Pressable>
  );
}