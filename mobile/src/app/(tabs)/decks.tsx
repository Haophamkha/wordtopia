import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { errorMessage } from '../../api/client';
import { GenerateDeckModal } from '../../components/GenerateDeckModal';
import { DeckCard } from '../../components/ui/DeckCard';
import { Field } from '../../components/ui/Field';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Screen } from '../../components/ui/Screen';
import { useDecks } from '../../hooks/useDecks';
import { colors } from '../../theme/colors';

export default function Decks() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error, refetch, isRefetching } = useDecks(q);

  return (
    <Screen>
      <YStack padding={20} gap={14} flex={1}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={26} fontWeight="800" color={colors.text}>Bộ từ vựng</Text>
        </XStack>

        <Field label="" value={search} onChangeText={setSearch} placeholder="🔍 Tìm bộ từ..." />
        <PrimaryButton title="🤖 Tạo bộ từ bằng AI" variant="outline" onPress={() => setOpen(true)} />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : error ? (
          <YStack gap={10}>
            <Text color={colors.danger}>{errorMessage(error)}</Text>
            <PrimaryButton title="Thử lại" variant="outline" onPress={() => refetch()} />
          </YStack>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(d) => String(d.id)}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
            ListEmptyComponent={<Text color={colors.muted} textAlign="center" marginTop={30}>Chưa có bộ từ nào</Text>}
            renderItem={({ item }) => (
              <DeckCard deck={item} onPress={() => router.push(`/deck/${item.id}` as never)} />
            )}
          />
        )}
      </YStack>

      <GenerateDeckModal
        visible={open}
        onClose={() => setOpen(false)}
        onDone={(id) => { setOpen(false); router.push(`/deck/${id}` as never); }}
      />
    </Screen>
  );
}