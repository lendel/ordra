import { PriceLabel } from '@/components/ui/PriceLabel';
import { EmptyState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Fonts, FontSizes, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useRequestStore } from '@/stores/useRequestStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function progressBarColor(pct: number): string {
  if (pct === 0) return '#A08060'; // нейтральный тёплый
  if (pct < 100) return '#C8956C'; // карамельный — в процессе
  return '#3B5C1E'; // тёплый зелёный — выполнено
}

export default function DashboardScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { products, load: loadCatalog } = useCatalogStore();
  const { requests, loadRequests } = useRequestStore();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
      loadRequests();
    }, [loadCatalog, loadRequests])
  );

  // Метрики
  const productCount = products.length;
  const totalRequests = requests.length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const sentRequests = requests.filter((r) => r.status === 'sent');
  const sentCount = sentRequests.length;

  // Последние изменения цен
  const recentPrices = [...products]
    .sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1))
    .slice(0, 5);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]}
    >
      <Text style={[styles.heading, { color: colors.text }]}>Дашборд</Text>

      {/* Метрики */}
      <View style={[styles.metrics, { borderColor: colors.separator }]}>
        {/* Товары */}
        <View style={[styles.metric, { borderRightColor: colors.separator }]}>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>ТОВАРОВ</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{productCount}</Text>
        </View>

        {/* Заявки */}
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>ЗАЯВОК</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{totalRequests}</Text>
          {totalRequests > 0 && (
            <View style={styles.metricSub}>
              {completedCount > 0 && (
                <Text style={[styles.metricSubText, { color: '#3B5C1E' }]}>
                  {completedCount} вып.
                </Text>
              )}
              {completedCount > 0 && sentCount > 0 && (
                <Text style={[styles.metricSubDot, { color: colors.secondaryText }]}>·</Text>
              )}
              {sentCount > 0 && (
                <Text style={[styles.metricSubText, { color: '#C8956C' }]}>
                  {sentCount} в работе
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Прогресс получения */}
      <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>
        Прогресс получения
      </Text>

      {sentRequests.length === 0 ? (
        <View style={[styles.emptySection, { borderColor: colors.separator }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Нет отправленных заявок
          </Text>
        </View>
      ) : (
        sentRequests.map((req, i) => {
          const pct = req.item_count > 0 ? Math.round((req.received_count / req.item_count) * 100) : 0;
          const barColor = progressBarColor(pct);
          return (
            <Pressable
              key={req.id}
              onPress={() => router.push(`/request/${req.id}`)}
              style={({ pressed }) => [
                styles.progressRow,
                {
                  opacity: pressed ? 0.6 : 1,
                  borderBottomColor: colors.separator,
                  borderTopWidth: i === 0 ? StyleSheet.hairlineWidth : 0,
                  borderTopColor: colors.separator,
                },
              ]}
            >
              <View style={styles.progressTop}>
                <Text style={[styles.progressTitle, { color: colors.text }]} numberOfLines={1}>
                  {req.title}
                </Text>
                <Text style={[styles.progressCount, { color: colors.secondaryText }]}>
                  {req.received_count}/{req.item_count}
                </Text>
              </View>

              {/* Трек */}
              <View style={[styles.progressTrack, { backgroundColor: colors.separator }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: pct > 0 ? `${pct}%` : '100%', backgroundColor: barColor },
                  ]}
                />
              </View>

              <View style={styles.progressBottom}>
                <Text style={[styles.progressPct, { color: barColor }]}>{pct}%</Text>
                <PriceLabel value={req.total} />
              </View>
            </Pressable>
          );
        })
      )}

      {/* Последние изменения цен */}
      <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>
        Последние изменения цен
      </Text>

      {recentPrices.length === 0 ? (
        <EmptyState message="Добавьте первый товар в каталоге" icon="📊" />
      ) : (
        recentPrices.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/product/${p.id}`)}
            style={({ pressed }) => [
              styles.row,
              {
                opacity: pressed ? 0.6 : 1,
                borderBottomColor: colors.separator,
                borderTopWidth: i === 0 ? StyleSheet.hairlineWidth : 0,
                borderTopColor: colors.separator,
              },
            ]}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.rowDate, { color: colors.secondaryText }]}>
                {new Date(p.updated_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </Text>
            </View>
            <PriceLabel value={p.current_price} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 96 },

  heading: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  // Метрики
  metrics: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metric: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  metricLabel: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
  },
  metricValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
  },
  metricSub: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  metricSubText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
  metricSubDot: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },

  // Заголовки секций
  sectionHeader: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },

  // Пустая секция
  emptySection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },

  // Строки прогресса
  progressRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  progressCount: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  progressTrack: {
    height: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
  },
  progressBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  progressPct: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },

  // Строки цен
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  rowLeft: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  rowName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },
  rowDate: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
});
