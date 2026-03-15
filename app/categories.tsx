import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CardShadow, Fonts, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useCategoryStore } from '@/stores/useCategoryStore';
import type { Category } from '@/db/types';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function CategoryRow({ item, isLast: _isLast }: { item: Category; isLast: boolean }) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/category/[id]', params: { id: String(item.id) } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 },
        CardShadow,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.chevron, { color: colors.secondaryText }]}>›</Text>
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { categories, load } = useCategoryStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {categories.length === 0 ? (
        <EmptyState message="Добавьте первую категорию" icon="🏷️" />
      ) : (
        <FlashList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <CategoryRow item={item} isLast={index === categories.length - 1} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
      <FAB onPress={() => router.push('/modal/add-category')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingBottom: 96, paddingTop: Spacing.sm },
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
  chevron: { fontSize: 20 },
});
