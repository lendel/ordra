import { useThemeColors } from '@/hooks/useThemeColors';
import { Radius, Spacing } from '@/constants/theme';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children: React.ReactNode;
  noPadding?: boolean;
};

export function Card({ children, style, noPadding, ...rest }: CardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: '#2D1B0E',
        },
        !noPadding && styles.padding,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  padding: {
    padding: Spacing.md,
  },
});
