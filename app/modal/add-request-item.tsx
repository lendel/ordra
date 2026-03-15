import { EmptyState } from '@/components/ui/EmptyState';
import { FlatInput } from '@/components/ui/FlatInput';
import { PriceLabel } from '@/components/ui/PriceLabel';
import { Accent, Fonts, FontSizes, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Product } from '@/db/types';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useRequestStore } from '@/stores/useRequestStore';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Fuse from 'fuse.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaskInput, { createNumberMask } from 'react-native-mask-input';
import { z } from 'zod';

const tengeMask = createNumberMask({
  prefix: ['₸', ' '],
  delimiter: ' ',
  separator: '',
  precision: 0,
});

// ─── Вкладки ─────────────────────────────────────────────────────────────────

type Tab = 'catalog' | 'new';

// ─── Из каталога ─────────────────────────────────────────────────────────────

function CatalogTab({
  requestId,
  onDone,
}: {
  requestId: number;
  onDone: () => void;
}) {
  const colors = useThemeColors();
  const { products, load } = useCatalogStore();
  const addItem = useRequestStore((s) => s.addItem);

  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [selected, setSelected] = useState<Product | null>(null);
  const [maskedPrice, setMaskedPrice] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    load();
  }, [load]);

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
      debouncedQuery.trim()
        ? fuse.search(debouncedQuery.trim()).map((r) => r.item)
        : products,
    [debouncedQuery, fuse, products]
  );

  function handleSelect(product: Product) {
    setSelected(product);
    const raw = String(Math.round(product.current_price));
    setPriceRaw(raw);
    setMaskedPrice(`₸ ${product.current_price.toLocaleString('ru-KZ')}`);
    setPriceError('');
  }

  function handleAdd() {
    if (!selected) return;
    setPriceError('');
    const price = Number(priceRaw.replace(/\D/g, ''));
    const result = z.number().positive('Цена должна быть больше 0').safeParse(price);
    if (!result.success) {
      setPriceError(result.error.issues[0].message);
      return;
    }
    try {
      addItem(requestId, selected.name, price, selected.id);
      onDone();
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }

  if (selected) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.confirmBox, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => setSelected(null)} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: Accent }]}>← Назад</Text>
          </Pressable>

          <Text style={[styles.confirmName, { color: colors.text }]}>{selected.name}</Text>

          <View style={styles.priceField}>
            <Text style={[styles.priceFieldLabel, { color: colors.secondaryText }]}>ЦЕНА</Text>
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
              onSubmitEditing={handleAdd}
              autoFocus
            />
            {priceError ? <Text style={styles.fieldError}>{priceError}</Text> : null}
          </View>

          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>Добавить в заявку</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Поиск */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.separator }]}>
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
      </View>

      {/* Количество */}
      {displayed.length > 0 && (
        <Text style={[styles.countLabel, { color: colors.secondaryText, borderBottomColor: colors.separator }]}>
          {displayed.length} {displayed.length === 1 ? 'товар' : 'товаров'}
        </Text>
      )}

      {/* Список */}
      {displayed.length === 0 ? (
        <EmptyState
          message={debouncedQuery ? 'Ничего не найдено' : 'Каталог пуст'}
          icon={debouncedQuery ? '🔍' : '📦'}
        />
      ) : (
        <FlashList
          data={displayed}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.catalogRow,
                { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.catalogName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <PriceLabel value={item.current_price} />
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

// ─── Новый товар ─────────────────────────────────────────────────────────────

function NewProductTab({
  requestId,
  onDone,
}: {
  requestId: number;
  onDone: () => void;
}) {
  const colors = useThemeColors();
  const addProduct = useCatalogStore((s) => s.addProduct);
  const addItem = useRequestStore((s) => s.addItem);

  const [name, setName] = useState('');
  const [maskedPrice, setMaskedPrice] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  function handleSubmit() {
    setNameError('');
    setPriceError('');

    const price = Number(priceRaw.replace(/\D/g, ''));
    const nameResult = z.string().min(1, 'Введите название').safeParse(name.trim());
    const priceResult = z.number().positive('Цена должна быть больше 0').safeParse(price);

    if (!nameResult.success) {
      setNameError(nameResult.error.issues[0].message);
      return;
    }
    if (!priceResult.success) {
      setPriceError(priceResult.error.issues[0].message);
      return;
    }

    try {
      const productId = addProduct(name.trim(), price);
      addItem(requestId, name.trim(), price, productId);
      onDone();
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.newProductContainer}>
        <FlatInput
          label="Название"
          placeholder="Введите название…"
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (nameError) setNameError('');
          }}
          error={nameError}
          returnKeyType="next"
          autoFocus
        />

        <View style={styles.priceField}>
          <Text style={[styles.priceFieldLabel, { color: colors.secondaryText }]}>ЦЕНА</Text>
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
            onSubmitEditing={handleSubmit}
          />
          {priceError ? <Text style={styles.fieldError}>{priceError}</Text> : null}
        </View>

        <Text style={[styles.hint, { color: colors.secondaryText }]}>
          Товар будет добавлен в каталог автоматически
        </Text>

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>Добавить в заявку</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Главный экран ───────────────────────────────────────────────────────────

export default function AddRequestItemModal() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [activeTab, setActiveTab] = useState<Tab>('catalog');

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Переключатель вкладок */}
      <View style={[styles.tabs, { borderBottomColor: colors.separator }]}>
        {(['catalog', 'new'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: Accent },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? Accent : colors.secondaryText },
              ]}
            >
              {tab === 'catalog' ? 'Из каталога' : 'Новый товар'}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'catalog' ? (
        <CatalogTab requestId={Number(requestId)} onDone={handleDone} />
      ) : (
        <NewProductTab requestId={Number(requestId)} onDone={handleDone} />
      )}
    </View>
  );
}

// ─── Стили ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Вкладки
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },

  // Поиск
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  search: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },

  // Счётчик
  countLabel: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Строка каталога
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  catalogName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    flex: 1,
    marginRight: Spacing.sm,
  },

  // Подтверждение выбора
  confirmBox: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },
  confirmName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
  },

  // Новый товар
  newProductContainer: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    marginTop: -Spacing.sm,
  },

  // Поле цены (MaskInput в flat-стиле)
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
  fieldError: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: '#FF3B30',
  },

  // Кнопка
  btn: {
    height: 52,
    backgroundColor: Accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  btnPressed: { opacity: 0.85 },
  btnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: '#FFFFFF',
  },
});
