import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { PriceLabel } from '@/components/ui/PriceLabel';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Accent, Fonts, FontSizes, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import { useCatalogStore } from '@/stores/useCatalogStore';
import type { ProductWithCategory } from '@/db/types';
import { exportCatalogPdf } from '@/utils/exportPdf';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import Fuse from 'fuse.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Строка товара ────────────────────────────────────────────────────────────

function ProductRow({ item, isLast }: { item: ProductWithCategory; isLast: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: pressed ? 0.6 : 1,
          borderBottomColor: isLast ? 'transparent' : colors.separator,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Товар ${item.name}`}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category_name ? (
          <Text style={[styles.rowCategory, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.category_name}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <PriceLabel value={item.current_price} />
        <Text style={[styles.chevron, { color: colors.secondaryText }]}>›</Text>
      </View>
    </Pressable>
  );
}

// ─── Экран каталога ───────────────────────────────────────────────────────────

export default function CatalogScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { products, load } = useCatalogStore();
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportCatalog() {
    if (isExporting || products.length === 0) return;
    setIsExporting(true);
    try {
      await exportCatalogPdf(products);
    } catch (e: unknown) {
      Alert.alert('Ошибка экспорта', e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setIsExporting(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const fuse = useMemo(
    () => new Fuse(products, { keys: ['name'], threshold: 0.35 }),
    [products]
  );

  const displayed = useMemo(
    () =>
      debouncedQuery.trim() ? fuse.search(debouncedQuery.trim()).map((r) => r.item) : products,
    [debouncedQuery, fuse, products]
  );

  const count = displayed.length;
  const countLabel = count === 0 ? '' : debouncedQuery ? `Найдено: ${count}` : `Всего: ${count}`;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Поиск */}
      <View
        style={[
          styles.searchWrap,
          {
            paddingTop: insets.top + Spacing.lg,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.search,
              {
                color: colors.text,
                borderBottomColor: query ? Accent : colors.separator,
              },
            ]}
            placeholder="Поиск товара…"
            placeholderTextColor={colors.secondaryText}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => router.push('/categories')}
            style={styles.iconBtn}
            accessibilityLabel="Категории"
            accessibilityRole="button"
          >
            <Ionicons name="pricetags-outline" size={20} color={Accent} />
          </Pressable>
          {products.length > 0 && (
            <Pressable
              onPress={handleExportCatalog}
              disabled={isExporting}
              style={[styles.iconBtn, { opacity: isExporting ? 0.4 : 1 }]}
              accessibilityLabel="Экспортировать каталог в PDF"
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={20} color={Accent} />
            </Pressable>
          )}
        </View>
        {countLabel ? (
          <Text style={[styles.countLabel, { color: colors.secondaryText }]}>{countLabel}</Text>
        ) : null}
      </View>

      {/* Список */}
      {displayed.length === 0 ? (
        <EmptyState
          message={debouncedQuery ? 'Ничего не найдено' : 'Добавьте первый товар'}
          icon={debouncedQuery ? '🔍' : '📦'}
        />
      ) : (
        <FlashList
          data={displayed}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <ProductRow item={item} isLast={index === displayed.length - 1} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB onPress={() => router.push('/modal/add-product')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  search: {
    flex: 1,
    height: 44,
    borderBottomWidth: 1,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    paddingBottom: Spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
  },
  list: {
    paddingBottom: 96,
  },

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
    marginRight: Spacing.sm,
    gap: 2,
  },
  rowName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },
  rowCategory: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chevron: {
    fontSize: 20,
  },
});
