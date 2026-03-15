import { runMigrations } from '@/db/migrate';

// ─── Мок миграций ─────────────────────────────────────────────────────────────
// Используем фиксированный набор из 2 миграций, независимый от реального списка

jest.mock('@/db/migrations', () => ({
  migrations: [
    { version: 1, description: 'Создать таблицу alpha', sql: 'CREATE TABLE alpha (id INTEGER);' },
    { version: 2, description: 'Создать таблицу beta', sql: 'CREATE TABLE beta (id INTEGER);' },
  ],
}));

// ─── Фабрика мок-БД ───────────────────────────────────────────────────────────

function makeMockDb(userVersion: number) {
  return {
    getFirstSync: jest.fn().mockReturnValue({ user_version: userVersion }),
    execSync: jest.fn(),
    withTransactionSync: jest.fn((fn: () => void) => fn()),
  };
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

describe('runMigrations', () => {
  describe('свежая БД (user_version = 0)', () => {
    it('запускает все миграции', () => {
      const db = makeMockDb(0);
      runMigrations(db as never);
      expect(db.withTransactionSync).toHaveBeenCalledTimes(2);
    });

    it('применяет SQL каждой миграции', () => {
      const db = makeMockDb(0);
      runMigrations(db as never);
      expect(db.execSync).toHaveBeenCalledWith('CREATE TABLE alpha (id INTEGER);');
      expect(db.execSync).toHaveBeenCalledWith('CREATE TABLE beta (id INTEGER);');
    });

    it('обновляет user_version после каждой миграции', () => {
      const db = makeMockDb(0);
      runMigrations(db as never);
      expect(db.execSync).toHaveBeenCalledWith('PRAGMA user_version = 1');
      expect(db.execSync).toHaveBeenCalledWith('PRAGMA user_version = 2');
    });

    it('SQL выполняется до обновления версии (порядок внутри транзакции)', () => {
      const db = makeMockDb(0);
      runMigrations(db as never);
      const calls = db.execSync.mock.calls.map((c: [string]) => c[0]);
      const idxSql = calls.indexOf('CREATE TABLE alpha (id INTEGER);');
      const idxVer = calls.indexOf('PRAGMA user_version = 1');
      expect(idxSql).toBeLessThan(idxVer);
    });
  });

  describe('актуальная БД (user_version = 2)', () => {
    it('не запускает ни одной миграции', () => {
      const db = makeMockDb(2);
      runMigrations(db as never);
      expect(db.withTransactionSync).not.toHaveBeenCalled();
      expect(db.execSync).not.toHaveBeenCalled();
    });
  });

  describe('частично применённая БД (user_version = 1)', () => {
    it('запускает только незапущенные миграции', () => {
      const db = makeMockDb(1);
      runMigrations(db as never);
      expect(db.withTransactionSync).toHaveBeenCalledTimes(1);
    });

    it('применяет только SQL второй миграции', () => {
      const db = makeMockDb(1);
      runMigrations(db as never);
      expect(db.execSync).not.toHaveBeenCalledWith('CREATE TABLE alpha (id INTEGER);');
      expect(db.execSync).toHaveBeenCalledWith('CREATE TABLE beta (id INTEGER);');
    });

    it('устанавливает user_version = 2', () => {
      const db = makeMockDb(1);
      runMigrations(db as never);
      expect(db.execSync).toHaveBeenCalledWith('PRAGMA user_version = 2');
      expect(db.execSync).not.toHaveBeenCalledWith('PRAGMA user_version = 1');
    });
  });

  describe('ошибка транзакции', () => {
    it('пробрасывает исключение', () => {
      const db = makeMockDb(0);
      db.withTransactionSync.mockImplementationOnce(() => {
        throw new Error('disk full');
      });
      expect(() => runMigrations(db as never)).toThrow('disk full');
    });

    it('не выполняет следующие миграции после ошибки', () => {
      const db = makeMockDb(0);
      // Первая транзакция падает
      db.withTransactionSync
        .mockImplementationOnce(() => {
          throw new Error('disk full');
        })
        .mockImplementation((fn: () => void) => fn());
      try {
        runMigrations(db as never);
      } catch {
        // ожидаемо
      }
      // Вторая транзакция не должна быть вызвана
      expect(db.withTransactionSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFirstSync возвращает null', () => {
    it('трактует отсутствие версии как 0 и запускает все миграции', () => {
      const db = makeMockDb(0);
      db.getFirstSync.mockReturnValue(null);
      runMigrations(db as never);
      expect(db.withTransactionSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('порядок миграций', () => {
    it('миграции выполняются строго по возрастанию версии', () => {
      const db = makeMockDb(0);
      const order: number[] = [];
      db.withTransactionSync.mockImplementation((fn: () => void) => {
        fn();
        // Считываем последний вызов execSync с PRAGMA user_version
        const calls: string[] = db.execSync.mock.calls.map((c: [string]) => c[0]);
        const last = calls.findLast((s: string) => s.startsWith('PRAGMA user_version'));
        if (last) order.push(Number(last.split('= ')[1]));
      });
      runMigrations(db as never);
      expect(order).toEqual([1, 2]);
    });
  });
});
