import { Fonts } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

// ─── Типы ─────────────────────────────────────────────────────────────────────

export type ExportRow = {
  num: number;
  name: string;
  value: string;
  dimmed?: boolean;
  checked?: boolean;
};

export type ExportImageCardProps = {
  title: string;
  subtitle: string;
  rows: ExportRow[];
  footer?: string;
  pageLabel?: string;
};

// ─── Константы ────────────────────────────────────────────────────────────────

export const CARD_WIDTH = 405;
export const CARD_HEIGHT = 720;
export const ITEMS_PER_PAGE = 9;

const C = {
  bg: '#0A0A0A',
  text: '#FFFFFF',
  secondary: '#5A5A5F',
  price: '#00C896',
  separator: 'rgba(255,255,255,0.07)',
  accent: '#007AFF',
  check: '#34C759',
};

// ─── Компонент ────────────────────────────────────────────────────────────────

export function ExportImageCard({ title, subtitle, rows, footer, pageLabel }: ExportImageCardProps) {
  return (
    <View style={styles.card}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>

      <View style={styles.divider} />

      {/* Строки */}
      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.num} style={styles.row}>
            <Text style={styles.rowNum}>{row.num}.</Text>
            <Text
              style={[styles.rowName, row.dimmed && styles.rowNameDimmed]}
              numberOfLines={1}
            >
              {row.checked ? (
                <Text style={styles.checkMark}>{'✓ '}</Text>
              ) : null}
              {row.name}
            </Text>
            <Text style={[styles.rowValue, row.dimmed && styles.rowValueDimmed]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Итого */}
      {footer != null ? (
        <>
          <View style={styles.divider} />
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>ИТОГО</Text>
            <Text style={styles.footerValue}>{footer}</Text>
          </View>
        </>
      ) : null}

      {/* Подвал */}
      <View style={styles.bottomBar}>
        <Text style={styles.brand}>ZAYAVKA</Text>
        {pageLabel ? <Text style={styles.pageLabel}>{pageLabel}</Text> : null}
      </View>
    </View>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: C.bg,
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    gap: 6,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: C.text,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: C.secondary,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.separator,
    marginHorizontal: 24,
  },
  rows: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 8,
  },
  rowNum: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: C.secondary,
    width: 22,
    textAlign: 'right',
  },
  rowName: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  rowNameDimmed: {
    color: C.secondary,
  },
  checkMark: {
    color: C.check,
  },
  rowValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: C.price,
  },
  rowValueDimmed: {
    color: C.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  footerLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.secondary,
  },
  footerValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: C.price,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 10,
  },
  brand: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: C.accent,
    letterSpacing: 1.5,
  },
  pageLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: C.secondary,
  },
});
