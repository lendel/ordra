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
  button: 100, // pill-форма
  pill: 100,   // поиск, чипы
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/** Dark Brown — кнопки, активные элементы, таб-бар */
export const Primary = '#2D1B0E';

/** Warm Caramel — FAB, акценты */
export const Accent = '#C8956C';

/** Тень для карточек */
export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#2D1B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
}) ?? { elevation: 2 };

export const SECTION_HEADER_STYLE = {
  fontSize: 11,
  letterSpacing: 0.8,
  textTransform: 'uppercase' as const,
};
