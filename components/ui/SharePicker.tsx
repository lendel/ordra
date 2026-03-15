import { useThemeColors } from '@/hooks/useThemeColors';
import { Fonts, FontSizes, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectPdf: () => void;
  onSelectText: () => void;
  onSelectImage: () => void;
};

const OPTIONS = [
  {
    key: 'pdf' as const,
    icon: 'document-outline' as const,
    label: 'PDF',
    desc: 'PDF файл',
  },
  {
    key: 'text' as const,
    icon: 'text-outline' as const,
    label: 'Текст',
    desc: 'Текстовый формат',
  },
  {
    key: 'image' as const,
    icon: 'image-outline' as const,
    label: 'Картинка',
    desc: 'Изображение 9:16 для мессенджеров',
  },
];

export function SharePicker({ visible, onClose, onSelectPdf, onSelectText, onSelectImage }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handlers = { pdf: onSelectPdf, text: onSelectText, image: onSelectImage };

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
        <Text style={[styles.header, { color: colors.secondaryText }]}>ПОДЕЛИТЬСЯ КАК</Text>
        {OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.key}
            onPress={() => {
              handlers[opt.key]();
              onClose();
            }}
            style={({ pressed }) => [
              styles.row,
              {
                borderBottomColor: i < OPTIONS.length - 1 ? colors.separator : 'transparent',
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name={opt.icon} size={20} color={colors.text} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.desc, { color: colors.secondaryText }]}>{opt.desc}</Text>
            </View>
          </Pressable>
        ))}
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
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  header: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 3 },
  label: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
  desc: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
});
