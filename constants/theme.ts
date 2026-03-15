import { Platform } from 'react-native';

export const Fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 34,
};

export const Radius = {
  sm: 8,
  md: 12,
  card: 16,
  xl: 20,
  button: 24,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/** Deep Pine Green — кнопки, активные элементы, заголовки */
export const Primary = '#004D40';

/** Vivid Orange — FAB, прогресс-бары, статус "в работе" */
export const Accent = '#FF9800';

/** Тень для карточек */
export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
}) ?? { elevation: 2 };

export const SECTION_HEADER_STYLE = {
  fontSize: 11,
  letterSpacing: 0.8,
  textTransform: 'uppercase' as const,
};
