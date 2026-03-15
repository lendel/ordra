import { PriceLabel } from '@/components/ui/PriceLabel';
import { CategoryPickerModal } from '@/components/ui/CategoryPickerModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Accent, Fonts, FontSizes, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import type { PriceHistory, ProductWithCategory } from '@/db/types';
import { productService } from '@/services/productService';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { usePriceStore } from '@/stores/usePriceStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskInput, { createNumberMask } from 'react-native-mask-input';
import { z } from 'zod';

// ─── Маска тенге ─────────────────────────────────────────────────────────────

const tengeMask = createNumberMask({
  prefix: ['₸', ' '],
  delimiter: ' ',
  separator: '',
  precision: 0,
});

// ─── Строка истории цен ───────────────────────────────────────────────────────

function PriceHistoryRow({ item, prev }: { item: PriceHistory; prev: PriceHistory | undefined }) {
  const colors = useThemeColors();

  const date = new Date(item.date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const delta = prev !== undefined ? item.price - prev.price : null;
  const deltaColor = delta === null ? undefined : delta > 0 ? '#ef4444' : '#22c55e';
  const deltaText =
    delta === null ? null : `${delta > 0 ? '+' : ''}${delta.toLocaleString('ru-RU')} ₸`;

  return (
    <View style={[styles.histRow, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.histDate, { color: colors.secondaryText }]}>{date}</Text>
      <View style={styles.histRight}>
        {deltaText ? <Text style={[styles.delta, { color: deltaColor }]}>{deltaText}</Text> : null}
        <PriceLabel value={item.price} size="sm" />
      </View>
    </View>
  );
}

// ─── Экран товара ─────────────────────────────────────────────────────────────

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const navigation = useNavigation();

  const { bottom: bottomInset } = useSafeAreaInsets();
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const { history, load, addPrice, clear } = usePriceStore();
  const { categories, load: loadCategories } = useCategoryStore();

  const [maskedPrice, setMaskedPrice] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [priceError, setPriceError] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ── Загрузка ──────────────────────────────────────────────────────────────

  const refreshProduct = useCallback(() => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      const p = productService.getById(numId);
      setProduct(p);
      load(numId);
    }
  }, [id, load]);

  useLayoutEffect(() => {
    clear();
  }, [id, clear]);

  useEffect(() => {
    refreshProduct();
    loadCategories();
  }, [refreshProduct, loadCategories]);

  useFocusEffect(refreshProduct);

  useLayoutEffect(() => {
    if (product) {
      navigation.setOptions({ title: product.name });
    }
  }, [navigation, product]);

  // ── Смена категории ───────────────────────────────────────────────────────

  function handleSelectCategory(categoryId: number | null) {
    if (!product) return;
    productService.updateCategory(product.id, categoryId);
    refreshProduct();
  }

  // ── Форма обновления цены ─────────────────────────────────────────────────

  function handleUpdatePrice() {
    setPriceError('');
    const price = Number(priceRaw.replace(/\D/g, ''));
    const result = z.number().positive('Цена должна быть больше 0').safeParse(price);
    if (!result.success) {
      setPriceError(result.error.issues[0].message);
      return;
    }
    try {
      addPrice(Number(id), price);
      setProduct(productService.getById(Number(id)));
      setMaskedPrice('');
      setPriceRaw('');
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.secondaryText }]}>Товар не найден</Text>
      </View>
    );
  }

  const updatedAt = new Date(product.updated_at).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Текущая цена */}
      <View style={[styles.infoSection, { borderBottomColor: colors.separator }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>ТЕКУЩАЯ ЦЕНА</Text>
          <View style={styles.priceSectionRow}>
            <PriceLabel value={product.current_price} size="lg" />
            <Text style={[styles.updatedAt, { color: colors.secondaryText }]}>
              Обновлено {updatedAt}
            </Text>
          </View>
        </View>

        {/* Категория */}
        <Pressable
          onPress={() => setShowCategoryPicker(true)}
          style={({ pressed }) => [
            styles.categoryRow,
            { borderTopColor: colors.separator, opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Изменить категорию"
        >
          <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>КАТЕГОРИЯ</Text>
          <View style={styles.categoryRight}>
            <Text style={[styles.categoryValue, { color: product.category_name ? colors.text : colors.secondaryText }]}>
              {product.category_name ?? 'Не указана'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.secondaryText} />
          </View>
        </Pressable>
      </View>

      {/* История цен */}
      <Text style={[styles.sectionTitle, { color: colors.secondaryText, borderBottomColor: colors.separator }]}>
        История цен
      </Text>
      <FlashList
        data={history}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <PriceHistoryRow item={item} prev={history[index + 1]} />
        )}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.listEmpty}>
            <Text style={[styles.emptyHist, { color: colors.secondaryText }]}>
              История цен пуста
            </Text>
          </View>
        }
      />

      {/* Форма обновления цены */}
      <View
        style={[styles.form, { borderTopColor: colors.separator, paddingBottom: Spacing.md + bottomInset }]}
      >
        <View style={styles.priceField}>
          <Text style={[styles.priceFieldLabel, { color: colors.secondaryText }]}>НОВАЯ ЦЕНА</Text>
          <MaskInput
            style={[
              styles.priceInput,
              {
                color: colors.text,
                borderBottomColor: priceError ? '#FF3B30' : maskedPrice ? Accent : colors.separator,
              },
            ]}
            placeholder="₸ 0"
            placeholderTextColor={colors.secondaryText}
            value={maskedPrice}
            onChangeText={(masked, raw) => {
              setMaskedPrice(masked);
              setPriceRaw(raw ?? '');
              if (priceError) setPriceError('');
            }}
            mask={tengeMask}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleUpdatePrice}
          />
          {priceError ? <Text style={styles.error}>{priceError}</Text> : null}
        </View>
        <Pressable
          onPress={handleUpdatePrice}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Обновить цену товара"
        >
          <Text style={styles.btnText}>Обновить цену</Text>
        </Pressable>
      </View>

      <CategoryPickerModal
        visible={showCategoryPicker}
        categories={categories}
        selectedId={product.category_id}
        onSelect={handleSelectCategory}
        onClose={() => setShowCategoryPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: Fonts.regular, fontSize: FontSizes.md },

  // Инфо-секция (цена + категория)
  infoSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  infoLabel: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
  },
  priceSectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.md,
  },
  updatedAt: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryValue: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },

  // История
  sectionTitle: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { flex: 1 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  histDate: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  histRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  delta: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
  emptyHist: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    padding: Spacing.xl,
  },

  // Форма
  form: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
  },
  priceField: { gap: 6 },
  priceFieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0.8,
  },
  priceInput: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.lg,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  error: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: '#FF3B30',
  },
  btn: {
    height: 52,
    backgroundColor: Accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: '#FFFFFF',
  },
});
