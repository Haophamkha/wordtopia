import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, Switch } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { api, errorMessage } from '../api/client';
import { Avatar } from '../components/ui/Avatar';
import { Field } from '../components/ui/Field';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { colors } from '../theme/colors';

interface Person {
  id: number;
  userId: number;
  name: string;
  avatar: string | null;
  streak: number;
  xp: number;
}

interface FriendsData {
  code: string;
  hide: boolean;
  friends: Person[];
  incoming: Person[];
  outgoing: Person[];
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/profile' as never);
}

function PersonRow({ p, sub, children }: { p: Person; sub?: string; children?: ReactNode }) {
  return (
    <XStack
      alignItems="center" gap={12} padding={12} borderRadius={16}
      backgroundColor={colors.card} borderWidth={1} borderColor={colors.border}
    >
      <Avatar uri={p.avatar} name={p.name} size={42} />
      <YStack flex={1}>
        <Text fontWeight="800" color={colors.text} numberOfLines={1}>{p.name}</Text>
        {sub ? <Text fontSize={12} color={colors.muted}>{sub}</Text> : null}
      </YStack>
      {children}
    </XStack>
  );
}

function Chip({ title, onPress, tone = 'primary', disabled }: {
  title: string; onPress: () => void; tone?: 'primary' | 'danger' | 'muted'; disabled?: boolean;
}) {
  const c = tone === 'danger' ? colors.danger : tone === 'muted' ? colors.muted : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 2, borderColor: c, opacity: disabled ? 0.5 : 1 }}
    >
      <Text fontSize={13} fontWeight="700" color={c}>{title}</Text>
    </Pressable>
  );
}

export default function Friends() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get<FriendsData>('/friends').then((r) => r.data),
  });

  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['leaderboard'] });
  };

  async function send() {
    const c = code.trim();
    if (!c) return;
    setSending(true);
    setMsg(null);
    try {
      const r = await api.post<{ status: 'sent' | 'accepted'; name: string }>('/friends/request', { code: c }).then((x) => x.data);
      setMsg({ ok: true, text: r.status === 'accepted' ? `Bạn và ${r.name} đã là bạn bè!` : `Đã gửi lời mời cho ${r.name}.` });
      setCode('');
      refresh();
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    } finally {
      setSending(false);
    }
  }

  async function run(id: number, fn: () => Promise<unknown>) {
    setBusyId(id);
    setMsg(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  async function shareCode() {
    if (!data) return;
    try {
      await Share.share({ message: `Kết bạn với mình trên Wordtopia nhé! Mã bạn bè của mình: ${data.code}` });
    } catch {
      // người dùng đóng khung chia sẻ
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <XStack padding={20} paddingBottom={8} alignItems="center" justifyContent="space-between">
        <Text fontSize={24} fontWeight="800" color={colors.text}>👥 Bạn bè</Text>
        <Pressable onPress={goBack} hitSlop={10}><Text fontSize={22} color={colors.muted}>✕</Text></Pressable>
      </XStack>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }}
        keyboardShouldPersistTaps="handled"
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
          <>
            <YStack backgroundColor={colors.card} borderRadius={18} padding={16} gap={8} borderWidth={1} borderColor={colors.border}>
              <Text color={colors.muted} fontSize={13}>Mã bạn bè của bạn</Text>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={28} fontWeight="800" color={colors.primary} letterSpacing={1}>{data.code}</Text>
                <Chip title="Chia sẻ mã" onPress={shareCode} />
              </XStack>
              <Text color={colors.muted} fontSize={12}>Gửi mã này cho bạn bè để họ gửi lời mời kết bạn cho bạn.</Text>
            </YStack>

            <YStack gap={10}>
              <Text fontWeight="800" color={colors.text}>Thêm bạn bằng mã</Text>
              <Field label="Mã bạn bè" value={code} onChangeText={setCode} placeholder="VD: WT-4K9Q2M" onSubmitEditing={send} />
              <PrimaryButton title="Gửi lời mời" onPress={send} loading={sending} disabled={!code.trim()} />
              {msg ? <Text color={msg.ok ? '#1B7F57' : colors.danger}>{msg.text}</Text> : null}
            </YStack>

            {data.incoming.length > 0 ? (
              <YStack gap={8}>
                <Text fontWeight="800" color={colors.text}>Lời mời đến ({data.incoming.length})</Text>
                {data.incoming.map((p) => (
                  <PersonRow key={p.id} p={p}>
                    <XStack gap={8}>
                      <Chip title="Chấp nhận" disabled={busyId === p.id} onPress={() => run(p.id, () => api.post(`/friends/requests/${p.id}/accept`))} />
                      <Chip title="Từ chối" tone="muted" disabled={busyId === p.id} onPress={() => run(p.id, () => api.delete(`/friends/requests/${p.id}`))} />
                    </XStack>
                  </PersonRow>
                ))}
              </YStack>
            ) : null}

            <YStack gap={8}>
              <Text fontWeight="800" color={colors.text}>Bạn bè ({data.friends.length})</Text>
              {data.friends.length === 0 ? (
                <Text color={colors.muted}>Chưa có bạn nào. Nhập mã của bạn bè ở trên để bắt đầu.</Text>
              ) : (
                data.friends.map((p) => (
                  <PersonRow key={p.id} p={p} sub={`${p.xp} XP${p.streak > 0 ? `  ·  🔥 ${p.streak} ngày` : ''}`}>
                    {confirmId === p.id ? (
                      <Chip title="Xác nhận xóa" tone="danger" disabled={busyId === p.id} onPress={() => run(p.id, () => api.delete(`/friends/${p.userId}`))} />
                    ) : (
                      <Chip title="Xóa" tone="muted" onPress={() => setConfirmId(p.id)} />
                    )}
                  </PersonRow>
                ))
              )}
            </YStack>

            {data.outgoing.length > 0 ? (
              <YStack gap={8}>
                <Text fontWeight="800" color={colors.text}>Đã gửi lời mời ({data.outgoing.length})</Text>
                {data.outgoing.map((p) => (
                  <PersonRow key={p.id} p={p} sub="Đang chờ chấp nhận">
                    <Chip title="Hủy" tone="muted" disabled={busyId === p.id} onPress={() => run(p.id, () => api.delete(`/friends/requests/${p.id}`))} />
                  </PersonRow>
                ))}
              </YStack>
            ) : null}

            <XStack
              alignItems="center" gap={12} padding={14} borderRadius={16}
              backgroundColor={colors.card} borderWidth={1} borderColor={colors.border}
            >
              <YStack flex={1} gap={2}>
                <Text fontWeight="800" color={colors.text}>Ẩn khỏi bảng xếp hạng chung</Text>
                <Text fontSize={12} color={colors.muted}>Bạn bè vẫn thấy bạn trong bảng xếp hạng bạn bè.</Text>
              </YStack>
              <Switch
                value={data.hide}
                onValueChange={(v) => run(-1, () => api.patch('/friends/settings', { hide: v }))}
                trackColor={{ true: colors.primary }}
              />
            </XStack>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
