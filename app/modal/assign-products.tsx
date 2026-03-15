import { PriceLabel } from '@/components/ui/PriceLabel';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Primary, Fonts, FontSizes, Radius, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import type { ProductWithCategory } from '@/db/types';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AssignProductsModal() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const catId = Number(categoryId);
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { load: loadCatalog } = useCatalogStore();

  const [allProducts, setAllProducts] = useState<ProductWithCategory[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const products = productService.getAll();
    setAllProducts(products);
    const preChecked = new Set(
      products.filter((p) => p.category_id === catId).map((p) => p.id)
    );
    setSelected(preChecked);
  }, [catId]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    categoryService.setMembers(catId, Array.from(selected));
    loadCatalog();
    router.back();
  }

  const count = selected.size;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.hint, { color: colors.secondaryText, borderBottomColor: colors.separator }]}>
        Отметьте товары, которые войдут в эту категорию
      </Text>

      <FlashList
        data={allProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => {
          const checked = selected.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  opacity: pressed ? 0.6 : 1,
                  borderBottomColor:
                    index === allProducts.length - 1 ? 'transparent' : colors.separator,
                },
              ]}
            >
              <View style={[styles.checkbox, { borderColor: checked ? Primary : colors.secondaryText }]}>
                {checked && <View style={[styles.checkboxFill, { backgroundColor: Primary }]} />}
              </View>
              <Text
                style={[styles.rowName, { color: checked ? colors.text : colors.secondaryText }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <PriceLabel value={item.current_price} />
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.separator,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
          },
        ]}
      >
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>
            {count > 0 ? `Добавить (${count})` : 'Сохранить'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hint: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
    minHeight: 56,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxFill: {
    width: 12,
    height: 12,
  },
  rowName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    height: 52,
    borderRadius: Radius.button,
    backgroundColor: Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: '#FFFFFF',
  },
});
