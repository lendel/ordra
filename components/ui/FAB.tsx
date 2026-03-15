import { Accent, Fonts, FontSizes } from '@/constants/theme';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

type FABProps = {
  onPress: () => void;
  label?: string;
  /** Дополнительный отступ снизу (передавать insets.bottom в Stack-экранах) */
  bottomInset?: number;
};

export function FAB({ onPress, label = '+', bottomInset = 0 }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom: 24 + bottomInset }, pressed && styles.pressed]}
      accessibilityLabel="Добавить"
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    color: '#FFFFFF',
    lineHeight: 24,
  },
});
