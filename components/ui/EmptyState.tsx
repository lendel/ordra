import { useThemeColors } from '@/hooks/useThemeColors';
import { Fonts, FontSizes, Spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  message: string;
  icon?: string;
};

export function EmptyState({ message, icon = '📦' }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.message, { color: colors.secondaryText }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  icon: {
    fontSize: 48,
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
});
