import { FlatInput } from '@/components/ui/FlatInput';
import { CategoryPickerModal } from '@/components/ui/CategoryPickerModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Primary, Fonts, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

const tengeMask = createNumberMask({
  prefix: ['₸', ' '],
  delimiter: ' ',
  separator: '',
  precision: 0,
});

export default function AddProductModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const addProduct = useCatalogStore((s) => s.addProduct);
  const { categories, load: loadCategories } = useCategoryStore();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [maskedPrice, setMaskedPrice] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

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
      addProduct(name.trim(), price, selectedCategoryId);
      router.back();
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: Math.max(Spacing.xl, bottomInset) }]}>
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

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>ЦЕНА</Text>
          <MaskInput
            style={[
              styles.priceInput,
              {
                color: colors.text,
                borderBottomColor: priceError ? '#FF3B30' : maskedPrice ? Primary : colors.separator,
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

        {/* Категория (опционально) */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>
            КАТЕГОРИЯ (НЕОБЯЗАТЕЛЬНО)
          </Text>
          <Pressable
            onPress={() => setShowCategoryPicker(true)}
            style={({ pressed }) => [
              styles.categoryBtn,
              {
                borderBottomColor: selectedCategory ? Primary : colors.separator,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryBtnText,
                { color: selectedCategory ? colors.text : colors.secondaryText },
              ]}
            >
              {selectedCategory ? selectedCategory.name : 'Не выбрана'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.secondaryText} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>Добавить</Text>
        </Pressable>
      </View>

      <CategoryPickerModal
        visible={showCategoryPicker}
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={(id) => setSelectedCategoryId(id)}
        onClose={() => setShowCategoryPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    flex: 1,
  },
  field: { gap: 6 },
  fieldLabel: {
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
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  categoryBtnText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.lg,
  },
  btn: {
    height: 52,
    backgroundColor: Primary,
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
