import { FlatInput } from '@/components/ui/FlatInput';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Accent, Fonts, FontSizes, Spacing } from '@/constants/theme';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

export default function AddCategoryModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const addCategory = useCategoryStore((s) => s.addCategory);
  const { bottom: bottomInset } = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  function handleSubmit() {
    const result = z.string().min(1, 'Введите название').safeParse(name.trim());
    if (!result.success) {
      setNameError(result.error.issues[0].message);
      return;
    }
    try {
      addCategory(name.trim());
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
      <KeyboardAvoidingView
        style={[styles.container, { paddingBottom: Math.max(Spacing.xl, bottomInset) }]}
      >
        <FlatInput
          label="Название"
          placeholder="Введите название категории…"
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (nameError) setNameError('');
          }}
          error={nameError}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          autoFocus
        />

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>Создать</Text>
        </Pressable>
      </KeyboardAvoidingView>
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
