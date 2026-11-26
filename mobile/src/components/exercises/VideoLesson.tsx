import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { colors } from '../../theme/colors';
import type { Exercise } from '../../types/lesson';
import { PrimaryButton } from '../ui/PrimaryButton';
import type { Result } from './ExerciseView';
import { speak } from './ui';
import { WordLookupSheet } from './WordLookupSheet';

type VideoEx = Extract<Exercise, { type: 'video' }>;

const cleanWord = (w: string) => w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');

export function VideoLesson({ ex, onDone }: { ex: VideoEx; onDone: (r: Result[]) => void }) {
  const subs = ex.subtitles ?? [];
  const subsRef = useRef(subs);
  const player = useVideoPlayer(ex.mediaUrl, (p) => {
    p.timeUpdateEventInterval = 0.25;
  });

  const [t, setT] = useState(0);
  const [watched, setWatched] = useState(false);
  const [showVi, setShowVi] = useState(true);
  const [loopIdx, setLoopIdx] = useState<number | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const loopRef = useRef<number | null>(null);
  const lastActive = useRef(0);
  const wasPlaying = useRef(false);

  loopRef.current = loopIdx;

  useEffect(() => {
    const a = player.addListener('timeUpdate', (e) => {
      setT(e.currentTime);
      const li = loopRef.current;
      const s = li !== null ? subsRef.current[li] : null;
      if (s && e.currentTime >= s.end) player.currentTime = s.start;
      const d = player.duration;
      if (d > 0 && e.currentTime / d >= 0.9) setWatched(true);
    });
    const b = player.addListener('playToEnd', () => setWatched(true));
    return () => {
      a.remove();
      b.remove();
    };
  }, [player]);

  const active = useMemo(() => {
    const i = subs.findIndex((s) => t >= s.start && t < s.end);
    if (i >= 0) lastActive.current = i;
    return i;
  }, [t, subs]);

  function playFrom(i: number) {
    player.currentTime = subs[i].start;
    player.play();
  }

  function openWord(c: string) {
    wasPlaying.current = player.playing;
    player.pause();
    speak(c);
    setWord(c);
  }

  function closeWord() {
    setWord(null);
    if (wasPlaying.current) player.play();
  }

  function toggleLoop() {
    if (loopIdx !== null) return setLoopIdx(null);
    if (!subs.length) return;
    const i = active >= 0 ? active : lastActive.current;
    setLoopIdx(i);
    playFrom(i);
  }

  return (
    <YStack gap={14}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, backgroundColor: '#000' }}
      />

      <XStack gap={10}>
        <Pressable
          onPress={toggleLoop}
          style={{
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2,
            borderColor: loopIdx !== null ? colors.primary : colors.border,
            backgroundColor: loopIdx !== null ? '#EFEBFF' : '#fff',
          }}
        >
          <Text fontWeight="700" fontSize={13} color={loopIdx !== null ? colors.primary : colors.text}>
            🔁 {loopIdx !== null ? 'Đang lặp câu' : 'Lặp câu'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowVi((v) => !v)}
          style={{
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2,
            borderColor: showVi ? colors.primary : colors.border,
            backgroundColor: showVi ? '#EFEBFF' : '#fff',
          }}
        >
          <Text fontWeight="700" fontSize={13} color={showVi ? colors.primary : colors.text}>
            🇻🇳 Phụ đề Việt
          </Text>
        </Pressable>
      </XStack>

      <Text color={colors.muted} fontSize={12}>
        Chạm một câu để tua tới đó. Chạm một từ để tra nghĩa và lưu vào bộ từ.
      </Text>

      <YStack gap={8}>
        {subs.map((s, i) => {
          const on = i === active;
          return (
            <YStack
              key={i}
              padding={12}
              gap={4}
              borderRadius={14}
              borderWidth={2}
              borderColor={on ? colors.primary : colors.border}
              backgroundColor={on ? '#EFEBFF' : colors.card}
            >
              <XStack flexWrap="wrap" columnGap={5} rowGap={2} alignItems="center">
                <Pressable onPress={() => playFrom(i)} hitSlop={6}>
                  <Text fontSize={13}>▶️</Text>
                </Pressable>
                {s.en.split(/\s+/).map((w, k) => (
                  <Pressable
                    key={k}
                    onPress={() => {
                      const c = cleanWord(w);
                      if (c) openWord(c);
                    }}
                  >
                    <Text fontSize={17} fontWeight={on ? '800' : '600'} color={colors.text}>{w}</Text>
                  </Pressable>
                ))}
              </XStack>
              {showVi && s.vi ? <Text fontSize={13} color={colors.muted}>{s.vi}</Text> : null}
            </YStack>
          );
        })}
      </YStack>

      {word ? <WordLookupSheet key={word} term={word} onClose={closeWord} /> : null}

      {watched ? (
        <PrimaryButton title="Hoàn thành" onPress={() => onDone([{ wordId: ex.wordId, correct: true }])} />
      ) : (
        <Text color={colors.muted} textAlign="center" fontSize={13}>Xem hết clip để hoàn thành bài</Text>
      )}
    </YStack>
  );
}
