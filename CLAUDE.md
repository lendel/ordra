# Ordra — CLAUDE.md

## Что это

**Ordra** — Android-приложение для отслеживания цен товаров и управления заявками на закупку.
**Только Android** — через EAS + Development Build. Expo Go не используется.

EAS project slug: `ordra`, package: `com.voanerges.ordra`. Папка может называться `Zayavka` или `Ordra` — только локальное имя.

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
| react-native-reanimated | 4.2.1 | Анимации (swipe и др.) |
| react-native-view-shot | ^4.0.3 | Экспорт экрана в изображение |
| Fuse.js | ^7 | Fuzzy-поиск по каталогу |
| Zod | ^4 | Валидация форм |
| react-native-safe-area-context | ~5.6 | Safe area / edge-to-edge |

---

## Структура проекта

```
app/
  _layout.tsx              # Корневой layout, SafeAreaProvider, ThemeProvider, Stack-маршруты
  (tabs)/
    _layout.tsx            # Tab bar (3 вкладки), полупрозрачный + elevation
    index.tsx              # Дашборд (KPI, прогресс заявок, последние цены)
    catalog.tsx            # Каталог товаров (fuzzy-поиск, категории, PDF-экспорт)
    requests.tsx           # Список заявок со статусами
  product/[id].tsx         # Карточка товара (история цен + обновление)
  request/[id].tsx         # Детали заявки (swipe-to-receive, share, delete)
  categories.tsx           # Список категорий
  category/[id].tsx        # Детали категории (товары, PDF-экспорт)
  modal/
    add-product.tsx        # Добавить товар
    add-request-item.tsx   # Добавить товар в заявку (2 вкладки: из каталога / вручную)
    add-category.tsx       # Создать категорию
    assign-products.tsx    # Назначить товары в категорию

components/ui/
  FlatInput.tsx            # Текстовый ввод с нижней границей
  PriceLabel.tsx           # Отображение цены (colors.priceText, Fonts.bold)
  FAB.tsx                  # Floating Action Button (bottomInset prop)
  EmptyState.tsx           # Заглушка для пустых списков
  Card.tsx                 # Базовый контейнер карточки (surface + CardShadow)
  CategoryPickerModal.tsx  # Модальный выбор категории
  ExportImageCard.tsx      # Карточка для экспорта заявки в изображение (9:16)
  SharePicker.tsx          # Нижний шит выбора формата экспорта (PDF / Text / Image)

constants/
  Colors.ts                # Токены цветов (dark/light)
  theme.ts                 # Fonts, FontSizes, Spacing, Radius, Primary, Accent, CardShadow, SECTION_HEADER_STYLE

db/
  database.ts              # Инициализация SQLite + вызов runMigrations при открытии
  migrations.ts            # Массив миграций (Migration[]), текущая версия: 4
  migrate.ts               # Движок миграций: runMigrations(db)
  schema.ts                # CREATE TABLE IF NOT EXISTS для v1 (legacy)
  types.ts                 # TypeScript-типы + STATUS_LABELS, STATUS_COLORS, STATUS_BG_COLORS, Zod-схемы
  __tests__/
    migrate.test.ts        # Юнит-тесты движка миграций

services/
  productService.ts        # CRUD для products
  priceService.ts          # Работа с price_history
  requestService.ts        # CRUD для requests + request_items
  categoryService.ts       # CRUD для categories
  __tests__/
    productService.test.ts
    priceService.test.ts

stores/
  useCatalogStore.ts       # Zustand: каталог товаров (ProductWithCategory[])
  usePriceStore.ts         # Zustand: история цен
  useRequestStore.ts       # Zustand: заявки и их позиции
  useCategoryStore.ts      # Zustand: категории

hooks/
  useThemeColors.ts        # Возвращает colors.dark | colors.light по colorScheme
  useCardExport.ts         # Логика экспорта заявки в изображение (react-native-view-shot)

utils/
  exportPdf.ts             # Экспорт каталога / категории / заявки в PDF (expo-print + expo-sharing)
  captureImage.ts          # Захват View в изображение (react-native-view-shot)
  formatPrice.ts           # Форматирование цены в строку
  shareText.ts             # Экспорт заявки текстом (expo-sharing)
```

---

## База данных

Движок миграций — `db/migrate.ts` (`runMigrations`), список — `db/migrations.ts`.
Версия хранится в `PRAGMA user_version`. Каждая миграция атомарна (withTransactionSync).

### v1 — Начальная схема
```sql
products (id, name, current_price, updated_at)
price_history (id, product_id, price, date)
```

### v2 — Система заявок
```sql
requests (id, title, status, created_at, updated_at)
request_items (id, request_id, product_id?, name, price, created_at)
```

### v3 — Отметка полученных позиций
```sql
ALTER TABLE request_items ADD COLUMN received INTEGER NOT NULL DEFAULT 0
```

### v4 — Категории товаров
```sql
categories (id, name UNIQUE, created_at)
ALTER TABLE products ADD COLUMN category_id REFERENCES categories(id) ON DELETE SET NULL
```

**Статусы заявок:** `draft` | `sent` | `completed` | `cancelled`
Метки: Черновик / Отправлена / Выполнена / Отменена — в `db/types.ts` (`STATUS_LABELS`, `STATUS_COLORS`, `STATUS_BG_COLORS`).

---

## Дизайн-система — Functional Minimal

Стиль: чистый, светлый, высококонтрастный. Белые карточки на сером фоне.

### Цвета (`constants/Colors.ts`)
| Токен | Light | Dark |
|---|---|---|
| `background` | `#F5F5F7` | `#121212` |
| `surface` | `#FFFFFF` | `#1C1C1E` |
| `text` | `#1C1C1E` | `#FFFFFF` |
| `secondaryText` | `#8E8E93` | `#8E8E93` |
| `priceText` | `#2E7D32` | `#4CAF50` |
| `separator` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.1)` |
| `tint` | `#004D40` | `#00897B` |
| `accent` | `#FF9800` | `#FF9800` |

Получать цвета: `const colors = useThemeColors()`.

### Токены (`constants/theme.ts`)
```ts
Fonts.regular / .medium / .semiBold / .bold   // Inter
FontSizes.xs=11 / sm=13 / md=15 / lg=17 / xl=20 / xxl=28 / xxxl=34
Radius.sm=8 / .md=12 / .card=16 / .xl=20 / .button=24
Spacing.xs=4 / sm=8 / md=12 / lg=16 / xl=24 / xxl=32
Primary = '#004D40'   // кнопки, активные элементы, иконки
Accent  = '#FF9800'   // FAB, прогресс-бары
CardShadow            // Platform.select: iOS shadow / Android elevation:2
SECTION_HEADER_STYLE  // fontSize:11, letterSpacing:0.8, textTransform:'uppercase'
```

### Правила UI
- **Строки списков:** белая карточка `backgroundColor: colors.surface`, `borderRadius: Radius.card (16)`, `marginHorizontal: Spacing.lg`, `marginVertical: 4`, `{...CardShadow}`
- **Кнопки:** `height:52`, `backgroundColor: Primary`, `borderRadius: Radius.button (24)`, `Fonts.bold`
- **FAB:** `backgroundColor: Accent` (оранжевый `#FF9800`)
- **Инпуты:** `<FlatInput>` для текста; для `MaskInput` — вручную `borderBottomWidth:1`, активный бордер `Primary`
- **Цены:** всегда через `<PriceLabel>` или `colors.priceText`
- **Статус-бейджи:** заливка `STATUS_BG_COLORS[status]`, текст `STATUS_COLORS[status]`, `borderRadius: Radius.sm`, без бордера
- **Заголовки секций:** `SECTION_HEADER_STYLE` + `colors.secondaryText`
- **Иконки действий:** `Primary` (зелёный), кроме деструктивных (`#FF3B30`)
- **Разделители:** `StyleSheet.hairlineWidth`, `colors.separator`

## Safe Area (Android edge-to-edge)

- `<SafeAreaProvider>` — в `app/_layout.tsx`
- `useSafeAreaInsets()` — во всех Stack-экранах
- FAB: `bottomInset={insets.bottom}` на Stack-экранах, `bottomInset={0}` на Tab-экранах (tab bar сам обрабатывает insets)

---

## Навигация

```
Stack (app/_layout.tsx):
  (tabs)                    — Tab-навигатор
  product/[id]              — Карточка товара
  request/[id]              — Детали заявки
  categories                — Список категорий
  category/[id]             — Детали категории
  modal/add-product
  modal/add-request-item    — принимает ?requestId=<number>
  modal/add-category
  modal/assign-products     — принимает ?categoryId=<number>
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

# Тесты
npm test

# Dev-сервер (для подключения устройства через Expo Dev Client)
npm run android
```
