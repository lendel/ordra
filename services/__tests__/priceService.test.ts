import { priceService } from '@/services/priceService';
import { db } from '@/db/database';

// ─── Мок БД ──────────────────────────────────────────────────────────────────

jest.mock('@/db/database', () => ({
  db: {
    getAllSync: jest.fn(),
    runSync: jest.fn(),
    // По умолчанию транзакция выполняет колбэк синхронно
    withTransactionSync: jest.fn((fn: () => void) => fn()),
    execSync: jest.fn(),
  },
}));

type MockDb = {
  getAllSync: jest.Mock;
  runSync: jest.Mock;
  withTransactionSync: jest.Mock;
};

const mockDb = db as unknown as MockDb;

// ─── Фикстуры ─────────────────────────────────────────────────────────────────

const historyDesc = [
  { id: 3, product_id: 1, price: 3000, date: '2024-01-03' },
  { id: 2, product_id: 1, price: 2500, date: '2024-01-02' },
  { id: 1, product_id: 1, price: 2000, date: '2024-01-01' },
];

// ─── Тесты ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Восстанавливаем стандартное поведение транзакции после каждого теста
  mockDb.withTransactionSync.mockImplementation((fn: () => void) => fn());
});

describe('priceService.getByProduct', () => {
  it('возвращает историю цен в порядке DESC', () => {
    mockDb.getAllSync.mockReturnValue(historyDesc);

    const result = priceService.getByProduct(1);

    expect(result).toEqual(historyDesc);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY date DESC'),
      [1]
    );
  });

  it('фильтрует по product_id', () => {
    mockDb.getAllSync.mockReturnValue([]);

    priceService.getByProduct(42);

    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('product_id = ?'),
      [42]
    );
  });

  it('возвращает пустой массив если истории нет', () => {
    mockDb.getAllSync.mockReturnValue([]);
    expect(priceService.getByProduct(1)).toEqual([]);
  });
});

describe('priceService.addPrice', () => {
  beforeEach(() => {
    mockDb.runSync.mockReturnValue({ lastInsertRowId: 1, changes: 1 });
  });

  it('вставляет запись в price_history', () => {
    priceService.addPrice(1, 5000);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO price_history'),
      [1, 5000]
    );
  });

  it('обновляет current_price в products', () => {
    priceService.addPrice(1, 5000);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE products SET current_price'),
      [5000, 1]
    );
  });

  it('выполняет INSERT и UPDATE внутри одной транзакции', () => {
    priceService.addPrice(1, 5000);

    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    // Оба runSync должны быть вызваны — значит оба вошли в транзакцию
    expect(mockDb.runSync).toHaveBeenCalledTimes(2);
  });

  it('INSERT вызывается раньше UPDATE', () => {
    priceService.addPrice(1, 5000);

    const calls = mockDb.runSync.mock.calls;
    expect(calls[0][0]).toContain('INSERT INTO price_history');
    expect(calls[1][0]).toContain('UPDATE products');
  });

  it('бросает исключение при нулевой цене (Zod)', () => {
    expect(() => priceService.addPrice(1, 0)).toThrow();
    expect(mockDb.withTransactionSync).not.toHaveBeenCalled();
  });

  it('бросает исключение при отрицательной цене (Zod)', () => {
    expect(() => priceService.addPrice(1, -500)).toThrow();
    expect(mockDb.withTransactionSync).not.toHaveBeenCalled();
  });

  it('пробрасывает исключение из транзакции', () => {
    mockDb.withTransactionSync.mockImplementation(() => {
      throw new Error('DB locked');
    });

    expect(() => priceService.addPrice(1, 5000)).toThrow('DB locked');
  });
});
