import { useThemeColors } from '@/hooks/useThemeColors';
import { Primary, Fonts, FontSizes, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import type { Category } from '@/db/types';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onClose: () => void;
};

export function CategoryPickerModal({ visible, categories, selectedId, onSelect, onClose }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.separator,
            paddingBottom: Math.max(insets.bottom, Spacing.xl),
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.secondaryText }]}>КАТЕГОРИЯ</Text>

        <ScrollView bounces={false}>
          {/* Без категории */}
          <Pressable
            onPress={() => { onSelect(null); onClose(); }}
            style={({ pressed }) => [
              styles.option,
              { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.optionText, { color: selectedId === null ? Primary : colors.text }]}>
              Без категории
            </Text>
            {selectedId === null && (
              <Text style={[styles.check, { color: Primary }]}>✓</Text>
            )}
          </Pressable>

          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => { onSelect(cat.id); onClose(); }}
              style={({ pressed }) => [
                styles.option,
                { borderBottomColor: colors.separator, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: selectedId === cat.id ? Primary : colors.text },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              {selectedId === cat.id && (
                <Text style={[styles.check, { color: Primary }]}>✓</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  optionText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    flex: 1,
  },
  check: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginLeft: Spacing.sm,
  },
});
