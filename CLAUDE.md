# Zayavka — CLAUDE.md

## Что это

Android-приложение для отслеживания цен товаров и управления заявками (заказами).
**Только Android** — через EAS + Development Build. Expo Go не используется.

---

## Стек

| Технология | Версия | Назначение |
|---|---|---|
| Expo SDK | ~55 | Платформа |
| React Native | 0.83.2 | UI |
| expo-router | ~55.0.3 | Навигация (file-based) |
| expo-sqlite | ~55.0.10 | Локальная БД |
| Zustand | ^5 | Стейт-менеджмент |
| FlashList | 2.0.2 | Высокопроизводительные списки |
| react-native-mask-input | ^1.2.3 | Маска ввода цены (₸) |
| Fuse.js | ^7 | Fuzzy-поиск по каталогу |
| Zod | ^4 | Валидация форм |
| react-native-safe-area-context | ~5.6 | Safe area / edge-to-edge |

---

## Структура проекта

```
app/
  _layout.tsx              # Корневой layout, SafeAreaProvider, Stack-маршруты
  (tabs)/
    _layout.tsx            # Tab bar (3 вкладки)
    index.tsx              # Дашборд
    catalog.tsx            # Каталог товаров
    requests.tsx           # Список заявок
  product/[id].tsx         # Карточка товара (история цен + обновление)
  request/[id].tsx         # Детали заявки
  modal/
    add-product.tsx        # Добавить товар
    add-request.tsx        # Создать заявку
    add-request-item.tsx   # Добавить товар в заявку (2 вкладки)

components/ui/
  FlatInput.tsx            # Текстовый ввод с нижней границей (Flat & Bold)
  PriceLabel.tsx           # Отображение цены (зелёный, Fonts.bold)
  FAB.tsx                  # Floating Action Button (bottomInset prop)
  EmptyState.tsx           # Заглушка для пустых списков

constants/
  Colors.ts                # Токены цветов (dark/light)
  theme.ts                 # Fonts, FontSizes, Spacing, Radius, Accent, SECTION_HEADER_STYLE

db/
  database.ts              # Инициализация SQLite
  migrations.ts            # Миграции (user_version pragma)
  types.ts                 # TypeScript-типы + STATUS_LABELS, STATUS_COLORS

services/
  productService.ts        # CRUD для products + price_history
  requestService.ts        # CRUD для requests + request_items

stores/
  useCatalogStore.ts       # Zustand: каталог товаров
  usePriceStore.ts         # Zustand: история цен
  useRequestStore.ts       # Zustand: заявки и их позиции

hooks/
  useThemeColors.ts        # Возвращает colors.dark | colors.light по colorScheme

utils/
  exportPdf.ts             # Экспорт товара в PDF (expo-print + expo-sharing)
```

---

## База данных

Миграции через `PRAGMA user_version` в `db/migrations.ts`.

### v1
```sql
products (id, name, current_price, created_at, updated_at)
price_history (id, product_id, price, date, created_at)
```

### v2
```sql
requests (id, title, status, created_at, updated_at)
request_items (id, request_id, product_id?, name, price, created_at)
```

**Статусы заявок:** `draft` | `sent` | `completed` | `cancelled`
Метки: Черновик / Отправлена / Выполнена / Отменена — в `db/types.ts` (`STATUS_LABELS`, `STATUS_COLORS`).

---

## Дизайн-система — Flat & Bold

Стиль: Bloomberg / Robinhood. Никаких скруглённых карточек на фоне surface в списках.

### Цвета (из `constants/Colors.ts`)
| Токен | Dark | Light |
|---|---|---|
| `background` | `#000000` | `#FFFFFF` |
| `surface` | `#0D0D0D` | `#F5F5F5` |
| `text` | `#FFFFFF` | `#000000` |
| `secondaryText` | `#555555` | `#888888` |
| `priceText` | `#00C896` | `#00A878` |
| `separator` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.1)` |
| `tint` / Accent | `#007AFF` | `#007AFF` |

Получать цвета: `const colors = useThemeColors()`.

### Типографика (`constants/theme.ts`)
```ts
Fonts.regular / .medium / .semiBold / .bold  // Inter
FontSizes.xs=11 / sm=13 / md=15 / lg=17 / xl=20 / xxl=28 / xxxl=34
SECTION_HEADER_STYLE  // fontSize:11, letterSpacing:0.8, textTransform:'uppercase'
```

### Правила UI
- **Разделители:** `StyleSheet.hairlineWidth`, `colors.separator`
- **Заголовки секций:** `SECTION_HEADER_STYLE` + `colors.secondaryText`
- **Цены:** всегда через `<PriceLabel>` или `colors.priceText`
- **Инпуты:** `<FlatInput>` для текста; для `MaskInput` — вручную `borderBottomWidth:1` (без `borderRadius`)
- **Кнопки:** `height:52`, `backgroundColor: Accent`, без `borderRadius`, `Fonts.bold`
- **Строки списка:** прозрачный фон, `borderBottomWidth: StyleSheet.hairlineWidth`

---

## Safe Area (Android edge-to-edge)

- `<SafeAreaProvider>` — в `app/_layout.tsx`
- `useSafeAreaInsets()` — во всех Stack-экранах
- FAB: `bottomInset={insets.bottom}` на Stack-экранах, `bottomInset={0}` на Tab-экранах (tab bar сам обрабатывает insets)

---

## Навигация

```
Stack (app/_layout.tsx):
  (tabs)          — Tab-навигатор
  product/[id]    — Карточка товара
  request/[id]    — Детали заявки
  modal/add-product
  modal/add-request
  modal/add-request-item   — принимает ?requestId=<number>
```

Динамический заголовок на Stack-экранах:
```ts
useLayoutEffect(() => {
  navigation.setOptions({ title: item.name });
}, [navigation, item]);
```

---

## Ограничения и известные проблемы

### FlashList — нет estimatedItemSize в типах
`@shopify/flash-list@2.0.2` не включает `estimatedItemSize` в TypeScript-типы.
**Никогда не добавлять этот проп.**

### TypeScript — только --skipLibCheck
Полный `tsc --noEmit` падает с OOM на Node v24 + Windows.
Правильная команда проверки:
```bash
node "node_modules/typescript/bin/tsc" --noEmit --skipLibCheck
```

### Web-превью не работает
`expo-sqlite` требует `wa-sqlite.wasm`, которого нет на вебе. Приложение — Android-only.
Для проверки: TSC + тест на устройстве.

---

## Частые команды

```bash
# TypeScript-проверка
node "node_modules/typescript/bin/tsc" --noEmit --skipLibCheck

# Линтер
npm run lint
npm run lint:fix

# Форматирование
npm run format

# Dev-сервер (для подключения устройства через Expo Dev Client)
npm run android
```
