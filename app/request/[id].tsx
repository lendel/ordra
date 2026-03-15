import { PriceLabel } from '@/components/ui/PriceLabel';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { Accent, Fonts, FontSizes, SECTION_HEADER_STYLE, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_COLORS, STATUS_LABELS } from '@/db/types';
import type { Request, RequestItem } from '@/db/types';
import { requestService } from '@/services/requestService';
import { useRequestStore } from '@/stores/useRequestStore';
import { exportRequestPdf } from '@/utils/exportPdf';
import { buildRequestText, shareText } from '@/utils/shareText';
import { formatPrice } from '@/utils/formatPrice';
import { SharePicker } from '@/components/ui/SharePicker';
import { useCardExport, todayStr } from '@/hooks/useCardExport';
import type { ExportRow } from '@/hooks/useCardExport';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskInput, { createNumberMask } from 'react-native-mask-input';
import { z } from 'zod';

// ─── Маска тенге ─────────────────────────────────────────────────────────────

const tengeMask = createNumberMask({
  prefix: ['₸', ' '],
  delimiter: ' ',
  separator: '',
  precision: 0,
});

// ─── Строка позиции ───────────────────────────────────────────────────────────

function ItemRow({
  item,
  isLast,
  canDelete,
  isReceivable,
  onDelete,
  onReceive,
}: {
  item: RequestItem;
  isLast: boolean;
  canDelete: boolean;
  isReceivable: boolean;
  onDelete: () => void;
  onReceive: () => void;
}) {
  const colors = useThemeColors();
  const translateX = useRef(new Animated.Value(0)).current;

  // Refs для актуальных значений внутри PanResponder (избегаем stale closure)
  const isReceivableRef = useRef(isReceivable);
  const isReceivedRef = useRef(item.received === 1);
  const onReceiveRef = useRef(onReceive);
  isReceivableRef.current = isReceivable;
  isReceivedRef.current = item.received === 1;
  onReceiveRef.current = onReceive;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        isReceivableRef.current &&
        !isReceivedRef.current &&
        Math.abs(dx) > 8 &&
        Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderMove: (_, { dx }) => {
        if (dx > 0) translateX.setValue(Math.min(dx, 100));
      },
      onPanResponderRelease: (_, { dx }) => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        if (dx > 72) onReceiveRef.current();
      },
    })
  ).current;

  const isReceived = item.received === 1;

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Фон — зелёная подложка при свайпе */}
      {isReceivable && !isReceived && (
        <View
          style={[
            styles.swipeBg,
            { borderBottomColor: isLast ? 'transparent' : colors.separator },
          ]}
        >
          <Text style={styles.swipeBgText}>Получен ✓</Text>
        </View>
      )}

      {/* Строка (движется поверх фона) */}
      <Animated.View
        style={[
          styles.itemRow,
          {
            backgroundColor: colors.background,
            borderBottomColor: isLast ? 'transparent' : colors.separator,
            transform: [{ translateX }],
          },
        ]}
        {...(isReceivable && !isReceived ? panResponder.panHandlers : {})}
      >
        {isReceived && (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color="#34C759"
            style={{ marginRight: Spacing.sm }}
          />
        )}
        <Text
          style={[
            styles.itemName,
            { color: isReceived ? colors.secondaryText : colors.text },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.itemRight}>
          <PriceLabel value={item.price} />
          {canDelete && (
            <Pressable
              onPress={onDelete}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Удалить позицию"
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Модал подтверждения получения ───────────────────────────────────────────

function ReceiveModal({
  item,
  visible,
  onConfirm,
  onClose,
}: {
  item: RequestItem | null;
  visible: boolean;
  onConfirm: (price: number) => void;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [maskedPrice, setMaskedPrice] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    if (item && visible) {
      const rounded = Math.round(item.price);
      setPriceRaw(String(rounded));
      setMaskedPrice(`₸ ${rounded.toLocaleString('ru-KZ')}`);
      setPriceError('');
    }
  }, [item, visible]);

  function handleConfirm() {
    const price = Number(priceRaw.replace(/\D/g, ''));
    const result = z.number().positive('Цена должна быть больше 0').safeParse(price);
    if (!result.success) {
      setPriceError(result.error.issues[0].message);
      return;
    }
    onConfirm(price);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose} />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, Spacing.xl),
              borderTopColor: colors.separator,
            },
          ]}
        >
          <Text style={[styles.modalLabel, { color: colors.secondaryText }]}>
            ПОЛУЧЕН ТОВАР
          </Text>
          <Text style={[styles.modalName, { color: colors.text }]} numberOfLines={2}>
            {item?.name}
          </Text>

          <View style={styles.priceField}>
            <Text style={[styles.priceFieldLabel, { color: colors.secondaryText }]}>
              ФАКТИЧЕСКАЯ ЦЕНА
            </Text>
            <MaskInput
              style={[
                styles.priceInput,
                {
                  color: colors.text,
                  borderBottomColor: priceError
                    ? '#FF3B30'
                    : maskedPrice
                    ? Accent
                    : colors.separator,
                },
              ]}
              placeholder="₸ 0"
              placeholderTextColor={colors.secondaryText}
              value={maskedPrice}
              onChangeText={(masked, raw) => {
                setMaskedPrice(masked);
                setPriceRaw(raw ?? '');
                if (priceError) setPriceError('');
              }}
              mask={tengeMask}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoFocus
            />
            {priceError ? <Text style={styles.fieldError}>{priceError}</Text> : null}
          </View>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>Подтвердить получение</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Экран заявки ─────────────────────────────────────────────────────────────

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const colors = useThemeColors();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { items, loadItems, clearItems, deleteItem, updateStatus, deleteRequest, markItemReceived } =
    useRequestStore();
  const [request, setRequest] = useState<Request | null>(null);
  const [receiveItem, setReceiveItem] = useState<RequestItem | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const { cardElement, exportImages } = useCardExport();

  const refreshRequest = useCallback(() => {
    const r = requestService.getById(requestId);
    setRequest(r);
    loadItems(requestId);
  }, [requestId, loadItems]);

  useEffect(() => {
    refreshRequest();
    return () => clearItems();
  }, [refreshRequest, clearItems]);

  const total = useMemo(() => items.reduce((sum, it) => sum + it.price, 0), [items]);

  const handleSharePdf = useCallback(async () => {
    if (!request) return;
    setIsBusy(true);
    try {
      await exportRequestPdf(request, items);
    } catch (e: unknown) {
      Alert.alert('Ошибка экспорта', e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setIsBusy(false);
    }
  }, [request, items]);

  const handleShareText = useCallback(async () => {
    if (!request) return;
    try {
      await shareText(buildRequestText(request, items));
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, [request, items]);

  const handleShareImage = useCallback(async () => {
    if (!request) return;
    setIsBusy(true);
    try {
      const rows: ExportRow[] = items.map((it, i) => ({
        num: i + 1,
        name: it.name,
        value: formatPrice(it.price),
        dimmed: it.received === 1,
        checked: it.received === 1,
      }));
      const footer = items.length > 0 ? formatPrice(total) : undefined;
      await exportImages(
        request.title,
        `${STATUS_LABELS[request.status]} · ${todayStr()}`,
        rows,
        footer
      );
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setIsBusy(false);
    }
  }, [request, items, total, exportImages]);

  const handleDelete = useCallback(() => {
    Alert.alert('Удалить заявку?', 'Это действие нельзя отменить', [
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          deleteRequest(requestId);
          router.back();
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }, [requestId, deleteRequest, router]);

  const handleChangeStatus = useCallback(() => {
    if (!request || request.status !== 'draft') return;
    Alert.alert('Отправить заявку?', 'После отправки изменить статус вручную будет нельзя', [
      {
        text: 'Отправить',
        onPress: () => {
          updateStatus(requestId, 'sent');
          setRequest((prev) => (prev ? { ...prev, status: 'sent' } : prev));
        },
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }, [request, requestId, updateStatus]);

  // Название, иконка удаления (только черновик) и статус-бейдж в шапке
  useLayoutEffect(() => {
    if (!request) return;

    const isDraft = request.status === 'draft';

    navigation.setOptions({
      title: request.title,
      headerRight: () => (
        <View style={styles.headerRight}>
          {items.length > 0 && (
            <Pressable
              onPress={() => setShowPicker(true)}
              disabled={isBusy}
              style={{ opacity: isBusy ? 0.4 : 1 }}
              accessibilityRole="button"
              accessibilityLabel="Поделиться заявкой"
            >
              <Ionicons name="share-outline" size={22} color={Accent} />
            </Pressable>
          )}
          {isDraft && (
            <Pressable
              onPress={handleDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Удалить заявку"
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </Pressable>
          )}
          {isDraft ? (
            <Pressable
              onPress={handleChangeStatus}
              style={styles.headerBadge}
              accessibilityRole="button"
              accessibilityLabel="Отправить заявку"
            >
              <View style={[styles.badge, { borderColor: STATUS_COLORS[request.status] }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[request.status] }]}>
                  {STATUS_LABELS[request.status]}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={[styles.badge, { borderColor: STATUS_COLORS[request.status] }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[request.status] }]}>
                {STATUS_LABELS[request.status]}
              </Text>
            </View>
          )}
        </View>
      ),
    });
  }, [navigation, request, handleDelete, handleChangeStatus, isBusy, items.length]);

  function handleDeleteItem(itemId: number) {
    Alert.alert('Удалить позицию?', undefined, [
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteItem(itemId, requestId),
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }

  const handleConfirmReceive = useCallback(
    (price: number) => {
      if (!receiveItem) return;
      markItemReceived(receiveItem.id, requestId, receiveItem.product_id, price);
      setReceiveItem(null);
      // Перечитываем заявку — статус мог измениться на 'completed'
      const updated = requestService.getById(requestId);
      setRequest(updated);
    },
    [receiveItem, requestId, markItemReceived]
  );

  if (!request) return null;

  const isEditable = request.status === 'draft';
  const isSent = request.status === 'sent';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Список позиций */}
      {items.length === 0 ? (
        <EmptyState message="Добавьте первый товар" icon="🛒" />
      ) : (
        <>
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.secondaryText, borderBottomColor: colors.separator },
            ]}
          >
            Позиции
          </Text>
          <FlashList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <ItemRow
                item={item}
                isLast={index === items.length - 1}
                canDelete={isEditable}
                isReceivable={isSent}
                onDelete={() => handleDeleteItem(item.id)}
                onReceive={() => setReceiveItem(item)}
              />
            )}
            contentContainerStyle={{ paddingBottom: isEditable ? 120 : 96 }}
          />
        </>
      )}

      {/* Итог */}
      {items.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.separator,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          <Text style={[styles.footerLabel, { color: colors.secondaryText }]}>ИТОГО</Text>
          <PriceLabel value={total} size="lg" />
        </View>
      )}

      {isEditable && (
        <FAB
          bottomInset={insets.bottom}
          onPress={() =>
            router.push({
              pathname: '/modal/add-request-item',
              params: { requestId: String(requestId) },
            })
          }
        />
      )}

      <ReceiveModal
        item={receiveItem}
        visible={receiveItem !== null}
        onConfirm={handleConfirmReceive}
        onClose={() => setReceiveItem(null)}
      />

      {cardElement}

      <SharePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectPdf={handleSharePdf}
        onSelectText={handleShareText}
        onSelectImage={handleShareImage}
      />
    </View>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Шапка
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginRight: 4,
  },
  headerBadge: {},
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },

  // Секция
  sectionHeader: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Строка позиции
  swipeBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    paddingLeft: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swipeBgText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  itemName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deleteIcon: {
    fontSize: 13,
    color: '#FF3B30',
  },

  // Итог
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLabel: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
  },

  // Модал
  modalOuter: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalLabel: {
    ...SECTION_HEADER_STYLE,
    fontFamily: Fonts.semiBold,
  },
  modalName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
  },
  priceField: { gap: 6 },
  priceFieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0.8,
  },
  priceInput: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.lg,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  fieldError: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: '#FF3B30',
  },
  btn: {
    height: 52,
    backgroundColor: Accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.85 },
  btnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: '#FFFFFF',
  },
});
