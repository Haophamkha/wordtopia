import { Alert } from '../../components/ui/AppDialog';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Pressable, RefreshControl, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { errorMessage } from '../../api/client';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { usePath } from '../../hooks/usePath';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';
import type { LessonSummary, UnitSummary } from '../../types/path';

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

const LEVEL: Record<string, string> = {
  BEGINNER: 'Sơ cấp',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};
const LEVEL_ICON: Record<string, MciName> = {
  BEGINNER: 'sprout',
  INTERMEDIATE: 'rocket-launch',
  ADVANCED: 'crown',
};

type Theme = {
  head: string;
  headDark: string;
  node: string;
  nodeDark: string;
  bg: string;
  deco: string;
  pat: string;
};

const THEMES: Record<string, Theme> = {
  BEGINNER: { head: '#7461EE', headDark: '#4330B5', node: '#7461EE', nodeDark: '#4A38C4', bg: '#E4DCFF', deco: '#C6B9FF', pat: '#F6F3FF' },
  INTERMEDIATE: { head: '#FF8A7A', headDark: '#DE503D', node: '#FF7A6B', nodeDark: '#D9503F', bg: '#FFE0D9', deco: '#FFBCAF', pat: '#FFF4F1' },
  ADVANCED: { head: '#2CC4B0', headDark: '#118A7C', node: '#20B8A4', nodeDark: '#0E8274', bg: '#D0F3EA', deco: '#9ADFD1', pat: '#EFFCF9' },
};
const LOCKED: Theme = {
  head: '#B9B9C7',
  headDark: '#8E8EA0',
  node: '#DEDEE6',
  nodeDark: '#BABAC7',
  bg: '#EBEBF0',
  deco: '#D8D8E1',
  pat: '#F7F7FA',
};

const OFFSETS = [0, 60, 92, 60, 0, -60, -92, -60];
const ROW_H = 170;
const TOP_PAD = 56;
const NODE = 72;
const HEAD_MT = 16;
const HEAD_H = 118;
const UNIT_PB = 10;
const DIVIDER_H = 76;

const unitHeight = (n: number) => HEAD_MT + HEAD_H + TOP_PAD + n * ROW_H + UNIT_PB;
const isUnitLocked = (u: UnitSummary) => u.lessons.length > 0 && u.lessons.every((l) => l.locked);

function openLesson(lesson: LessonSummary, unitLocked = false) {
  if (unitLocked) {
    Alert.alert('Chặng đang khóa', 'Hoàn thành chặng trước để mở khóa chặng này.');
    return;
  }
  if (lesson.locked) {
    Alert.alert('Màn đang khóa', 'Hoàn thành màn trước để mở khóa màn này.');
    return;
  }
  router.push(`/lesson/${lesson.id}` as never);
}

/* ---------- nền hoa văn (SVG tĩnh, màu đặc) ---------- */
function starPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}

const Pattern = memo(function Pattern({ w, h, seed, t }: { w: number; h: number; seed: number; t: Theme }) {
  const shapes = useMemo(() => {
    let s = (seed * 7919 + 13) % 233280;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const out: { type: number; x: number; y: number; r: number; c: string }[] = [];
    const count = Math.round(h / 62);
    for (let i = 0; i < count; i++) {
      out.push({
        type: Math.floor(rnd() * 5),
        x: 14 + rnd() * (w - 28),
        y: 150 + rnd() * (h - 170),
        r: 6 + rnd() * 11,
        c: rnd() > 0.45 ? t.deco : t.pat,
      });
    }
    return out;
  }, [w, h, seed, t]);

  return (
    <Svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      {shapes.map((sh, i) => {
        switch (sh.type) {
          case 0:
            return <Circle key={i} cx={sh.x} cy={sh.y} r={sh.r * 0.8} fill={sh.c} />;
          case 1:
            return <Circle key={i} cx={sh.x} cy={sh.y} r={sh.r} fill="none" stroke={sh.c} strokeWidth={3} />;
          case 2:
            return <Path key={i} d={starPath(sh.x, sh.y, sh.r * 1.1)} fill={sh.c} />;
          case 3:
            return (
              <Path
                key={i}
                d={`M${sh.x - sh.r} ${sh.y} H${sh.x + sh.r} M${sh.x} ${sh.y - sh.r} V${sh.y + sh.r}`}
                stroke={sh.c}
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          default:
            return (
              <Rect
                key={i}
                x={sh.x - sh.r * 0.7}
                y={sh.y - sh.r * 0.7}
                width={sh.r * 1.4}
                height={sh.r * 1.4}
                rx={3}
                fill={sh.c}
                rotation={45}
                origin={`${sh.x}, ${sh.y}`}
              />
            );
        }
      })}
    </Svg>
  );
});

/* ---------- vòng sáng nhấp nháy cho màn hiện tại ---------- */
function Pulse({ color }: { color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: NODE + 8,
        height: NODE + 8,
        borderRadius: (NODE + 8) / 2,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
      }}
    />
  );
}

/* ---------- 1 nút màn học ---------- */
function LessonNode({
  lesson,
  number,
  x,
  y,
  isCurrent,
  verb,
  theme,
  unitLocked,
  special,
}: {
  lesson: LessonSummary;
  number: number;
  x: number;
  y: number;
  isCurrent: boolean;
  verb: string;
  theme: Theme;
  unitLocked: boolean;
  special: 'chest' | 'trophy' | null;
}) {
  const locked = unitLocked || lesson.locked;
  const c = locked ? LOCKED : theme;

  let icon: MciName = 'play';
  if (locked) icon = special === 'trophy' ? 'trophy' : special === 'chest' ? 'treasure-chest' : 'lock';
  else if (isCurrent) icon = 'play';
  else if (lesson.completed) icon = 'check-bold';
  else if (special === 'trophy') icon = 'trophy';
  else if (special === 'chest') icon = 'treasure-chest';

  const iconColor = locked ? '#A3A3B4' : '#fff';

  return (
    <Pressable
      onPress={() => openLesson(lesson, unitLocked)}
      style={{ position: 'absolute', left: x - 70, top: y - 48, width: 140, alignItems: 'center' }}
    >
      {({ pressed }) => (
        <>
          {isCurrent && !locked ? (
            <View style={{ position: 'absolute', top: -46, width: 140, alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 7,
                  borderBottomWidth: 3,
                  borderBottomColor: c.deco,
                }}
              >
                <Text style={{ color: c.headDark, fontSize: 15, fontWeight: '900' }}>{verb}</Text>
              </View>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#fff',
                  transform: [{ rotate: '45deg' }],
                  marginTop: -7,
                }}
              />
            </View>
          ) : null}

          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrent && !locked ? (
              <>
                <Pulse color={c.node} />
                <View
                  style={{
                    position: 'absolute',
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 6,
                    borderColor: '#fff',
                  }}
                />
              </>
            ) : null}
            <View style={{ width: NODE, height: NODE + 8 }}>
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  width: NODE,
                  height: NODE,
                  borderRadius: NODE / 2,
                  backgroundColor: c.nodeDark,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: pressed ? 6 : 0,
                  width: NODE,
                  height: NODE,
                  borderRadius: NODE / 2,
                  backgroundColor: c.node,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!locked ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 14,
                      width: 24,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: 'rgba(255,255,255,0.32)',
                      transform: [{ rotate: '-20deg' }],
                    }}
                  />
                ) : null}
                <MaterialCommunityIcons name={icon} size={special && !isCurrent ? 36 : 32} color={iconColor} />
              </View>
            </View>
          </View>

          <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '800', color: locked ? '#A3A3B4' : colors.text }}>
            Màn {number}
          </Text>
          <Text numberOfLines={1} style={{ maxWidth: 130, fontSize: 11, color: locked ? '#B4B4C2' : colors.muted }}>
            {lesson.title}
          </Text>
          {!locked && lesson.completed ? (
            <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
              {[1, 2, 3].map((n) => (
                <Ionicons key={n} name="star" size={14} color={n <= lesson.stars ? '#FFC800' : '#D8D8E0'} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

/* ---------- dải phân cách cấp độ ---------- */
function LevelDivider({ level, locked }: { level: string; locked: boolean }) {
  const t = locked ? LOCKED : THEMES[level] ?? THEMES.BEGINNER;
  return (
    <View
      style={{
        height: DIVIDER_H,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 20,
      }}
    >
      <View style={{ flex: 1, height: 2, backgroundColor: t.deco }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: t.head,
          borderBottomWidth: 4,
          borderBottomColor: t.headDark,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 16,
        }}
      >
        <MaterialCommunityIcons name={locked ? 'lock' : LEVEL_ICON[level] ?? 'sprout'} size={20} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>
          {(LEVEL[level] ?? level).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, height: 2, backgroundColor: t.deco }} />
    </View>
  );
}

/* ---------- 1 chặng (unit) ---------- */
const UnitSection = memo(function UnitSection({
  unit,
  number,
  nextLessonId,
}: {
  unit: UnitSummary;
  number: number;
  nextLessonId: number | null;
}) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 720);
  const k = Math.min(1, W / 390);
  const unitLocked = isUnitLocked(unit);
  const t = unitLocked ? LOCKED : THEMES[unit.level] ?? THEMES.BEGINNER;
  const n = unit.lessons.length;
  const verb = unit.completedLessons > 0 ? 'Tiếp tục' : 'Bắt đầu';
  const allDone = n > 0 && unit.completedLessons === n;
  const unitPct = n ? Math.round((unit.completedLessons / n) * 100) : 0;

  const pts = unit.lessons.map((_, i) => ({
    x: W / 2 + OFFSETS[i % OFFSETS.length] * k,
    y: TOP_PAD + i * ROW_H + 48,
  }));
  const areaH = TOP_PAD + n * ROW_H;
  const totalH = unitHeight(n);

  return (
    <View style={{ height: totalH, backgroundColor: t.bg, overflow: 'hidden' }}>
      <Pattern w={W} h={totalH} seed={unit.id} t={t} />

      <View
        style={{
          height: HEAD_H,
          marginHorizontal: 16,
          marginTop: HEAD_MT,
          borderRadius: 22,
          backgroundColor: t.head,
          borderBottomWidth: 5,
          borderBottomColor: t.headDark,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }}>
            CHẶNG {number}
          </Text>
          <Text style={{ color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 2 }} numberOfLines={1}>
            {unit.titleVi}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {unit.title} · {unit.completedLessons}/{unit.totalLessons} màn
          </Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 10, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${unitPct}%`, backgroundColor: '#fff', borderRadius: 3 }} />
          </View>
        </View>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 4,
            borderBottomColor: 'rgba(0,0,0,0.12)',
          }}
        >
          {unitLocked ? (
            <MaterialCommunityIcons name="lock" size={28} color="#A3A3B4" />
          ) : allDone ? (
            <MaterialCommunityIcons name="check-decagram" size={32} color="#2EB67D" />
          ) : (
            <Text style={{ fontSize: 30 }}>{unit.emoji}</Text>
          )}
        </View>
      </View>

      <View style={{ width: W, height: areaH, alignSelf: 'center' }}>
        <Svg width={W} height={areaH} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
          {pts.slice(0, -1).map((a, i) => {
            const b = pts[i + 1];
            const my = (a.y + b.y) / 2;
            const done = !unitLocked && unit.lessons[i].completed;
            return (
              <Path
                key={i}
                d={`M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`}
                stroke={done ? t.node : '#fff'}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray="10 14"
                fill="none"
              />
            );
          })}
        </Svg>

        {unit.lessons.map((l, i) => {
          const isLast = i === n - 1;
          const special = l.type === 'CHECKPOINT' ? 'trophy' : (i + 1) % 4 === 0 && !isLast ? 'chest' : null;
          return (
            <LessonNode
              key={l.id}
              lesson={l}
              number={i + 1}
              x={pts[i].x}
              y={pts[i].y}
              isCurrent={l.id === nextLessonId}
              verb={verb}
              theme={t}
              unitLocked={unitLocked}
              special={special}
            />
          );
        })}
      </View>
    </View>
  );
});

/* ---------- thẻ tổng quan ---------- */
function SummaryCard({
  levelName,
  done,
  total,
  stars,
  pct,
  nextLabel,
  onContinue,
}: {
  levelName: string;
  done: number;
  total: number;
  stars: number;
  pct: number;
  nextLabel: string | null;
  onContinue: () => void;
}) {
  return (
    <LinearGradient
      colors={['#7461EE', '#4330B5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={{ borderRadius: 26, overflow: 'hidden', padding: 20 }}
    >
      <Svg width={150} height={143} viewBox="0 0 220 210" style={{ position: 'absolute', top: 0, right: 0 }}>
        <Path
          d="M78 0 H220 V92 C186 78 150 98 134 142 C120 182 92 214 60 186 C30 158 68 108 76 62 C80 36 68 16 78 0 Z"
          fill="#FF7A6B"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 18, right: 22, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{pct}%</Text>
      </View>

      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 14,
        }}
      >
        <MaterialCommunityIcons name="school" size={16} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Trình độ: {levelName}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 }}>
        <Text style={{ color: '#fff', fontSize: 40, fontWeight: '900', lineHeight: 44 }}>{done}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '700', marginBottom: 5 }}>
          / {total} màn hoàn thành
        </Text>
      </View>

      <View style={{ height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 12, padding: 2 }}>
        {pct > 0 ? (
          <LinearGradient
            colors={['#FF7A6B', '#FFC96B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 10, width: `${Math.max(pct, 5)}%`, borderRadius: 5 }}
          />
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 }}>
          <Ionicons name="star" size={16} color="#FFC800" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{stars} sao</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 }}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Còn {Math.max(total - done, 0)} màn</Text>
        </View>
      </View>

      {nextLabel ? (
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            marginTop: 16,
            height: 54,
            borderRadius: 27,
            backgroundColor: '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: 16,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <MaterialCommunityIcons name="play-circle" size={24} color="#FF7A6B" />
          <Text numberOfLines={1} style={{ flexShrink: 1, color: '#4330B5', fontSize: 16, fontWeight: '800' }}>
            {nextLabel}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#4330B5" />
        </Pressable>
      ) : (
        <View style={{ marginTop: 16, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>🎉 Bạn đã hoàn thành toàn bộ lộ trình</Text>
        </View>
      )}
    </LinearGradient>
  );
}

type Row = { unit: UnitSummary; number: number; divider: boolean; height: number; offset: number };

export default function PathScreen() {
  const user = useAuthStore((s) => s.user);
  const needPlacement = (user as { onboarded?: boolean } | null)?.onboarded === false;
  const { data, isLoading, error, refetch, isRefetching } = usePath();
  const listRef = useRef<FlatList<Row>>(null);
  const [headerH, setHeaderH] = useState(0);
  const scrolledFor = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const rows = useMemo<Row[]>(() => {
    const count: Record<string, number> = {};
    let offset = 0;
    return (data?.units ?? []).map((u, i, arr) => {
      count[u.level] = (count[u.level] ?? 0) + 1;
      const divider = i === 0 || arr[i - 1].level !== u.level;
      const height = (divider ? DIVIDER_H : 0) + unitHeight(u.lessons.length);
      const row = { unit: u, number: count[u.level], divider, height, offset };
      offset += height;
      return row;
    });
  }, [data]);

  /* tự cuộn tới màn đang học */
  useEffect(() => {
    if (!data || data.nextLessonId == null || headerH === 0) return;
    if (scrolledFor.current === data.nextLessonId) return;
    let target = -1;
    let idx = -1;
    for (let r = 0; r < rows.length; r++) {
      const i = rows[r].unit.lessons.findIndex((l) => l.id === data.nextLessonId);
      if (i >= 0) {
        target = r;
        idx = i;
        break;
      }
    }
    if (target < 0) return;
    const row = rows[target];
    const y =
      headerH + row.offset + (row.divider ? DIVIDER_H : 0) + HEAD_MT + HEAD_H + TOP_PAD + idx * ROW_H - 150;
    const timer = setTimeout(() => {
      scrolledFor.current = data.nextLessonId;
      listRef.current?.scrollToOffset({ offset: Math.max(0, y), animated: false });
    }, 200);
    return () => clearTimeout(timer);
  }, [data, rows, headerH]);

  let next: { lesson: LessonSummary; unit: UnitSummary; idx: number } | null = null;
  if (data) {
    for (const u of data.units) {
      const i = u.lessons.findIndex((l) => l.id === data.nextLessonId);
      if (i >= 0) {
        next = { lesson: u.lessons[i], unit: u, idx: i };
        break;
      }
    }
  }
  const pct = data && data.totalLessons ? Math.round((data.completedLessons / data.totalLessons) * 100) : 0;
  const stars = data
    ? data.units.reduce((s, u) => s + u.lessons.reduce((a, l) => a + (l.completed ? l.stars : 0), 0), 0)
    : 0;
  const nextLabel = next
    ? `${next.unit.completedLessons > 0 ? 'Tiếp tục' : 'Bắt đầu'} · Màn ${next.idx + 1}`
    : null;

  return (
    <Screen>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error || !data ? (
        <View style={{ padding: 20, gap: 10 }}>
          <Text style={{ color: colors.danger }}>{errorMessage(error)}</Text>
          <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(r) => String(r.unit.id)}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: rows[index].height,
            offset: headerH + rows[index].offset,
            index,
          })}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={5}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListHeaderComponent={
            <View
              onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}
              style={{ padding: 20, gap: 14 }}
            >
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>Lộ trình học</Text>

              {needPlacement ? (
                <View style={{ backgroundColor: '#FFF6E5', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#FFE0A3' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>🎯 Kiểm tra trình độ</Text>
                  <Text style={{ color: colors.muted }}>10 câu, khoảng 2 phút để xếp lộ trình phù hợp với bạn.</Text>
                  <PrimaryButton title="Làm bài test" onPress={() => router.push('/placement' as never)} />
                </View>
              ) : null}

              <SummaryCard
                levelName={LEVEL[data.level] ?? data.level}
                done={data.completedLessons}
                total={data.totalLessons}
                stars={stars}
                pct={pct}
                nextLabel={nextLabel}
                onContinue={() => next && openLesson(next.lesson)}
              />
            </View>
          }
          renderItem={({ item }) => (
            <View>
              {item.divider ? <LevelDivider level={item.unit.level} locked={isUnitLocked(item.unit)} /> : null}
              <UnitSection unit={item.unit} number={item.number} nextLessonId={data.nextLessonId} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}