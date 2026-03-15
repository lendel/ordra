import { PriceLabel } from '@/components/ui/PriceLabel';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CardShadow, Fonts, FontSizes, Primary, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Product } from '@/db/types';
import { categoryService } from '@/services/categoryService';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { exportCategoryPdf } from '@/utils/exportPdf';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ProductRow({ item, isLast: _isLast }: { item: Product; isLast: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
        CardShadow,
      ]}
    >
      <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.rowRight}>
        <PriceLabel value={item.current_price} />
        <Text style={[styles.chevron, { color: colors.secondaryText }]}>›</Text>
      </View>
    </Pressable>
  );
}

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Number(id);
  const colors = useThemeColors();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { load: loadCatalog } = useCatalogStore();

  const [name, setName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const refresh = useCallback(() => {
    const cat = categoryService.getById(categoryId);
    if (cat) setName(cat.name);
    setProducts(categoryService.getProducts(categoryId));
  }, [categoryId]);

  useFocusEffect(refresh);

  const handleExport = useCallback(async () => {
    if (isExporting || products.length === 0) return;
    setIsExporting(true);
    try {
      await exportCategoryPdf(name, products);
    } catch (e: unknown) {
      Alert.alert('Ошибка экспорта', e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, name, products]);

  const handleDelete = useCallback(() => {
    Alert.alert('Удалить категорию?', 'Товары останутся, но потеряют категорию', [
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          categoryService.delete(categoryId);
          loadCatalog();
          router.back();
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }, [categoryId, loadCatalog, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name || 'Категория',
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          {products.length > 0 && (
            <Pressable
              onPress={handleExport}
              disabled={isExporting}
              style={{ opacity: isExporting ? 0.4 : 1 }}
              accessibilityRole="button"
              accessibilityLabel="Экспортировать категорию в PDF"
            >
              <Ionicons name="share-outline" size={22} color={colors.tint} />
            </Pressable>
          )}
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Удалить категорию"
          >
            <Ionicons name="trash-outline" size={20} color="#8B2020" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, name, handleDelete, handleExport, isExporting, products.length]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {products.length === 0 ? (
        <EmptyState message="Нет товаров в этой категории" icon="📦" />
      ) : (
        <FlashList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <ProductRow item={item} isLast={index === products.length - 1} />
          )}
          contentContainerStyle={{ paddingBottom: 96, paddingTop: Spacing.sm }}
        />
      )}

      <FAB
        bottomInset={insets.bottom}
        onPress={() =>
          router.push({
            pathname: '/modal/assign-products',
            params: { categoryId: String(categoryId) },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: 4,
    borderRadius: Radius.card,
    minHeight: 56,
  },
  rowName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chevron: { fontSize: 20 },
});
