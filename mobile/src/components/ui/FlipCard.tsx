import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';
import type { Word } from '../../types/word';

export function FlipCard({ word, flipped, onFlip }: { word: Word; flipped: boolean; onFlip: () => void }) {
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withTiming(flipped ? 180 : 0, { duration: 350 });
  }, [flipped, rot]);

  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rot.value}deg` }],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rot.value + 180}deg` }],
  }));

  return (
    <Pressable onPress={onFlip} style={{ height: 340 }}>
      <Animated.View style={[styles.face, { backgroundColor: colors.card }, front]}>
        <YStack alignItems="center" gap={10} padding={20}>
          <Text fontSize={34} fontWeight="800" color={colors.primary} textAlign="center">{word.term}</Text>
          {word.phonetic ? <Text fontSize={16} color={colors.muted}>{word.phonetic}</Text> : null}
          {word.partOfSpeech ? <Text fontSize={13} color={colors.muted}>{word.partOfSpeech}</Text> : null}
          <Pressable onPress={() => Speech.speak(word.term, { language: 'en-US' })} hitSlop={12}>
            <Text fontSize={30}>🔊</Text>
          </Pressable>
          <Text fontSize={12} color={colors.muted} marginTop={10}>Chạm để lật thẻ</Text>
        </YStack>
      </Animated.View>

      <Animated.View style={[styles.face, { backgroundColor: colors.primary }, back]}>
        <YStack alignItems="center" gap={12} padding={20}>
          <Text fontSize={26} fontWeight="800" color="#fff" textAlign="center">{word.meaning}</Text>
          {word.example ? (
            <YStack gap={4} alignItems="center">
              <Text fontSize={15} color="#fff" textAlign="center" fontStyle="italic">{word.example}</Text>
              {word.exampleMeaning ? (
                <Text fontSize={13} color="#fff" opacity={0.8} textAlign="center">{word.exampleMeaning}</Text>
              ) : null}
            </YStack>
          ) : null}
        </YStack>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});