export type Migration = {
  version: number;
  description: string;
  sql: string;
};

/**
 * Список миграций в порядке возрастания версий.
 * Добавляй новые миграции ТОЛЬКО в конец — никогда не изменяй существующие.
 *
 * Текущая версия схемы: 3
 */
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Начальная схема: products + price_history',
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        current_price REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        price REAL NOT NULL,
        date TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `,
  },

  {
    version: 2,
    description: 'Система заявок: requests + request_items',
    sql: `
      CREATE TABLE IF NOT EXISTS requests (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT    NOT NULL,
        status     TEXT    NOT NULL DEFAULT 'draft',
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS request_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        product_id INTEGER,
        name       TEXT    NOT NULL,
        price      REAL    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );
    `,
  },
  {
    version: 3,
    description: 'Отметка полученных позиций заявки',
    sql: `ALTER TABLE request_items ADD COLUMN received INTEGER NOT NULL DEFAULT 0;`,
  },
  {
    version: 4,
    description: 'Категории товаров',
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL UNIQUE,
        created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      );

      ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
    `,
  },
];

/**
 * Текущая версия схемы: 4
 */
