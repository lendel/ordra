import { useThemeColors } from '@/hooks/useThemeColors';
import { Fonts, FontSizes, Spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + Spacing.xl }}>
        <Text style={[styles.heading, { color: colors.text }]}>Настройки</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
