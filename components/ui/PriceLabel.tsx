import { Fonts, FontSizes } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatPrice } from '@/utils/formatPrice';
import { StyleSheet, Text } from 'react-native';

type PriceLabelProps = {
  value: number;
  size?: 'sm' | 'md' | 'lg';
};

export function PriceLabel({ value, size = 'md' }: PriceLabelProps) {
  const colors = useThemeColors();
  const fontSize =
    size === 'sm' ? FontSizes.sm : size === 'lg' ? FontSizes.xl : FontSizes.md;

  return (
    <Text style={[styles.price, { fontSize, color: colors.priceText }]}>
      {formatPrice(value)}
    </Text>
  );
}

const styles = StyleSheet.create({
  price: {
    fontFamily: Fonts.bold,
  },
});
