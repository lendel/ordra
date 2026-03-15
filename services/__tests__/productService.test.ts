import { productService } from '@/services/productService';
import { db } from '@/db/database';

// ─── Мок БД ──────────────────────────────────────────────────────────────────

jest.mock('@/db/database', () => ({
  db: {
    getAllSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
    execSync: jest.fn(),
  },
}));

type MockDb = {
  getAllSync: jest.Mock;
  getFirstSync: jest.Mock;
  runSync: jest.Mock;
};

const mockDb = db as unknown as MockDb;

// ─── Фикстуры ─────────────────────────────────────────────────────────────────

const productA = { id: 1, name: 'Футболка', current_price: 3000, updated_at: '2024-01-01' };
const productB = { id: 2, name: 'Куртка', current_price: 15000, updated_at: '2024-01-02' };

// ─── Тесты ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('productService.getAll', () => {
  it('возвращает все товары из БД', () => {
    mockDb.getAllSync.mockReturnValue([productA, productB]);

    const result = productService.getAll();

    expect(result).toEqual([productA, productB]);
    expect(mockDb.getAllSync).toHaveBeenCalledTimes(1);
    expect(mockDb.getAllSync).toHaveBeenCalledWith('SELECT * FROM products ORDER BY name ASC');
  });

  it('возвращает пустой массив если товаров нет', () => {
    mockDb.getAllSync.mockReturnValue([]);
    expect(productService.getAll()).toEqual([]);
  });
});

describe('productService.getById', () => {
  it('возвращает товар по id', () => {
    mockDb.getFirstSync.mockReturnValue(productA);

    const result = productService.getById(1);

    expect(result).toEqual(productA);
    expect(mockDb.getFirstSync).toHaveBeenCalledWith('SELECT * FROM products WHERE id = ?', [1]);
  });

  it('возвращает null если товар не найден', () => {
    mockDb.getFirstSync.mockReturnValue(null);
    expect(productService.getById(999)).toBeNull();
  });

  it('возвращает null если getFirstSync вернул undefined', () => {
    mockDb.getFirstSync.mockReturnValue(undefined);
    expect(productService.getById(999)).toBeNull();
  });
});

describe('productService.create', () => {
  beforeEach(() => {
    mockDb.runSync.mockReturnValue({ lastInsertRowId: 42, changes: 1 });
  });

  it('вставляет товар и возвращает новый id', () => {
    const id = productService.create('Новый товар', 5000);

    expect(id).toBe(42);
    expect(mockDb.runSync).toHaveBeenCalledTimes(1);
    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO products'),
      ['Новый товар', 5000]
    );
  });

  it('бросает исключение при пустом названии', () => {
    expect(() => productService.create('', 5000)).toThrow();
    expect(mockDb.runSync).not.toHaveBeenCalled();
  });

  it('бросает исключение при нулевой цене', () => {
    expect(() => productService.create('Товар', 0)).toThrow();
    expect(mockDb.runSync).not.toHaveBeenCalled();
  });

  it('бросает исключение при отрицательной цене', () => {
    expect(() => productService.create('Товар', -100)).toThrow();
    expect(mockDb.runSync).not.toHaveBeenCalled();
  });
});

describe('productService.search', () => {
  it('возвращает товары по частичному совпадению названия', () => {
    mockDb.getAllSync.mockReturnValue([productA]);

    const result = productService.search('Футбол');

    expect(result).toEqual([productA]);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIKE'),
      ['%Футбол%']
    );
  });

  it('экранирует символ % в поисковом запросе', () => {
    mockDb.getAllSync.mockReturnValue([]);

    productService.search('100%');

    expect(mockDb.getAllSync).toHaveBeenCalledWith(expect.anything(), ['%100\\%%']);
  });

  it('экранирует символ _ в поисковом запросе', () => {
    mockDb.getAllSync.mockReturnValue([]);

    productService.search('товар_А');

    expect(mockDb.getAllSync).toHaveBeenCalledWith(expect.anything(), ['%товар\\_А%']);
  });

  it('экранирует обратный слэш в поисковом запросе', () => {
    mockDb.getAllSync.mockReturnValue([]);

    productService.search('C:\\dir');

    expect(mockDb.getAllSync).toHaveBeenCalledWith(expect.anything(), ['%C:\\\\dir%']);
  });

  it('возвращает пустой массив если ничего не найдено', () => {
    mockDb.getAllSync.mockReturnValue([]);
    expect(productService.search('несуществующий')).toEqual([]);
  });
});
