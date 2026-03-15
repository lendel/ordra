# Ordra

Мобильное приложение для закупщиков: каталог цен, история изменений, управление заявками.

> Android-only · Expo SDK 55 · Local-first (SQLite, без облака)

---

## Что умеет

### Каталог товаров
- Хранит текущие цены на все позиции
- История цены по каждому товару — видно когда и насколько менялась
- Опциональные категории для группировки
- Fuzzy-поиск (Fuse.js) — находит даже при опечатках
- Экспорт всего каталога или отдельной категории в PDF

### Заявки
- Создание заявок с автоматическим названием (Заявка #N)
- Добавление позиций из каталога или новых товаров
- Статусы: Черновик → Отправлена → Выполнена
- Свайп для отметки полученных товаров с фиксацией фактической цены
- Автоматическое закрытие заявки когда все позиции получены
- Экспорт заявки в PDF, текст или картинку (9:16, несколько страниц при необходимости)

### Дашборд
- Метрики: количество товаров, заявки (выполненные / в работе)
- Прогресс активных заявок с визуальными индикаторами
- Последние изменения цен

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
| react-native-view-shot | — | Экспорт в картинку |
| react-native-mask-input | ^1.2.3 | Маска ввода цены (₸) |
| Fuse.js | ^7 | Fuzzy-поиск |
| Zod | ^4 | Валидация форм |
| expo-print + expo-sharing | — | PDF и шаринг |

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
  categories.tsx           # Список категорий
  category/[id].tsx        # Детальная категория
  modal/
    add-product.tsx        # Добавить товар
    add-request-item.tsx   # Добавить позицию в заявку
    add-category.tsx       # Добавить категорию
    assign-products.tsx    # Назначить товары в категорию

components/ui/
  FlatInput.tsx            # Текстовый ввод с нижней границей
  PriceLabel.tsx           # Отображение цены (зелёный)
  FAB.tsx                  # Floating Action Button
  EmptyState.tsx           # Заглушка для пустых списков
  CategoryPickerModal.tsx  # Bottom-sheet выбор категории
  ExportImageCard.tsx      # Карточка для экспорта в картинку
  SharePicker.tsx          # Выбор формата экспорта (PDF / текст / картинка)

constants/
  Colors.ts                # Токены цветов (dark/light)
  theme.ts                 # Fonts, FontSizes, Spacing, Radius, Accent

db/
  database.ts              # Инициализация SQLite
  migrations.ts            # Миграции (user_version pragma)
  types.ts                 # TypeScript-типы, STATUS_LABELS, STATUS_COLORS

services/
  productService.ts        # CRUD для products + price_history
  requestService.ts        # CRUD для requests + request_items
  categoryService.ts       # CRUD для categories + setMembers
  priceService.ts          # История цен

stores/
  useCatalogStore.ts       # Zustand: каталог товаров
  usePriceStore.ts         # Zustand: история цен
  useRequestStore.ts       # Zustand: заявки и позиции
  useCategoryStore.ts      # Zustand: категории

hooks/
  useThemeColors.ts        # Возвращает colors.dark | colors.light
  useCardExport.ts         # Хук экспорта заявки в картинку

utils/
  exportPdf.ts             # PDF: каталог, категория, заявка
  captureImage.ts          # Скриншот View через react-native-view-shot
  shareText.ts             # Шаринг текстового содержимого заявки
  formatPrice.ts           # Форматирование цены в ₸
```

---

## База данных

Миграции через `PRAGMA user_version` в `db/migrations.ts`. База хранится локально на устройстве.

### Схема

```sql
-- v1
products (id, name, current_price, category_id, created_at, updated_at)
price_history (id, product_id, price, date, created_at)

-- v2
requests (id, title, status, created_at, updated_at)
request_items (id, request_id, product_id, name, price, received, created_at)

-- v4
categories (id, name, created_at)
-- + products.category_id → FK на categories
```

**Статусы заявок:** `draft` | `sent` | `completed` | `cancelled`

---

## Дизайн-система

Стиль: Bloomberg / Robinhood. Flat & Bold — никаких скруглённых карточек, минимализм.

### Цвета

| Токен | Dark | Light |
|---|---|---|
| `background` | `#000000` | `#FFFFFF` |
| `text` | `#FFFFFF` | `#000000` |
| `secondaryText` | `#555555` | `#888888` |
| `priceText` | `#00C896` | `#00A878` |
| `tint` / Accent | `#007AFF` | `#007AFF` |

### Типографика

Inter (Regular / Medium / SemiBold / Bold), размеры 11–34px.

---

## Разработка

### Требования

- Node.js 18+
- EAS CLI (`npm install -g eas-cli`)
- Android-устройство или эмулятор
- Аккаунт на [expo.dev](https://expo.dev)

### Установка

```bash
git clone https://github.com/<username>/ordra.git
cd ordra
npm install
```

### Development-сборка

```bash
eas build --profile development --platform android
```

После установки APK:

```bash
npm run android
```

### Preview-сборка (тест без dev-меню)

```bash
eas build --profile preview --platform android
```

### TypeScript-проверка

```bash
node "node_modules/typescript/bin/tsc" --noEmit --skipLibCheck
```

> Полный `tsc --noEmit` без флага падает с OOM на Node v24 + Windows — это известное ограничение.

### Линтер и форматирование

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## Флоу пользователя

### Создать и отправить заявку

1. Вкладка **Заявки** → FAB `+`
2. Заявка создана (статус: Черновик)
3. FAB внутри → добавить позиции из каталога или новые
4. Нажать на бейдж **Черновик** → подтвердить отправку
5. Статус становится **Отправлена**, заявка появляется на дашборде

### Получить товары по заявке

1. Открыть отправленную заявку
2. Свайп строки → ввести фактическую цену → подтвердить
3. Когда все позиции отмечены — статус автоматически меняется на **Выполнена**

### Поделиться заявкой

1. Детали заявки → кнопка поделиться
2. Выбрать формат: **PDF** / **Текст** / **Картинка**
3. Картинка генерируется в формате 9:16, при большом количестве позиций — несколько страниц

---

## Ограничения

- **Android-only** — `expo-sqlite` требует нативного модуля, web не поддерживается
- **Нет облачной синхронизации** — все данные хранятся локально на устройстве
- **react-native-view-shot** требует нативной сборки (Expo Go не поддерживается)

---

## Лицензия

MIT
