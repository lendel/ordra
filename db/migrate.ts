import type { SQLiteDatabase } from 'expo-sqlite';
import { migrations } from './migrations';

/**
 * Запускает все незапущенные миграции в порядке возрастания версии.
 *
 * Версия схемы хранится в PRAGMA user_version (SQLite built-in, целое число).
 * Каждая миграция выполняется атомарно: либо SQL + обновление версии,
 * либо ничего (при ошибке транзакция откатывается).
 */
export function runMigrations(db: SQLiteDatabase): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) return;

  for (const migration of pending) {
    db.withTransactionSync(() => {
      db.execSync(migration.sql);
      // PRAGMA user_version поддерживает транзакции — значение
      // фиксируется при коммите и откатывается при ошибке
      db.execSync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
