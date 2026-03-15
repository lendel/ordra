import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { PriceLabel } from '@/components/ui/PriceLabel';
import { CardShadow, Fonts, FontSizes, Radius, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { STATUS_BG_COLORS, STATUS_COLORS, STATUS_LABELS } from '@/db/types';
import type { RequestWithStats } from '@/db/types';
import { useRequestStore } from '@/stores/useRequestStore';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Строка заявки ────────────────────────────────────────────────────────────

function RequestRow({ item, isLast: _isLast }: { item: RequestWithStats; isLast: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/request/${item.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
        CardShadow,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Заявка ${item.title}`}
    >
      <View style={styles.rowTop}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_BG_COLORS[item.status] },
          ]}
        >
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>
      <View style={styles.rowBottom}>
        <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>
          {item.item_count === 0 ? 'Нет позиций' : `${item.item_count} поз.`}
        </Text>
        {item.total > 0 && <PriceLabel value={item.total} />}
      </View>
    </Pressable>
  );
}

// ─── Экран заявок ─────────────────────────────────────────────────────────────

function todayTitle(): string {
  return new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function RequestsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requests, loadRequests, createRequest } = useRequestStore();

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Заголовок */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl, borderBottomColor: colors.separator }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Заявки</Text>
        {requests.length > 0 && (
          <Text style={[styles.count, { color: colors.secondaryText }]}>
            {requests.length}
          </Text>
        )}
      </View>

      {/* Список */}
      {requests.length === 0 ? (
        <EmptyState message="Создайте первую заявку" icon="📋" />
      ) : (
        <FlashList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <RequestRow item={item} isLast={index === requests.length - 1} />
          )}
          contentContainerStyle={{ paddingBottom: 96, paddingTop: Spacing.sm }}
        />
      )}

      <FAB onPress={() => {
        const id = createRequest(todayTitle());
        router.push(`/request/${id}`);
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxxl,
  },
  count: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingBottom: 4,
  },

  row: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginVertical: 4,
    borderRadius: Radius.card,
    minHeight: 72,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  rowTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    flex: 1,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowMeta: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },

  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
});
