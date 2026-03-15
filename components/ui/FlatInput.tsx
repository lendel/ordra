import { Primary, Fonts, FontSizes, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

type FlatInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FlatInput({ label, error, style, ...props }: FlatInputProps) {
  const colors = useThemeColors();
  const hasError = Boolean(error);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.secondaryText }]}>{label.toUpperCase()}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderBottomColor: hasError ? '#FF3B30' : props.value ? Primary : colors.separator,
          },
          style,
        ]}
        placeholderTextColor={colors.secondaryText}
        {...props}
      />
      {hasError && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0.8,
  },
  input: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.lg,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  error: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: '#FF3B30',
  },
});
