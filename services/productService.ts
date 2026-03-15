import { db } from '@/db/database';
import { ProductSchema } from '@/db/types';
import type { ProductWithCategory } from '@/db/types';

/** Экранирование SQL LIKE спецсимволов */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

const WITH_CATEGORY = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export const productService = {
  getAll(): ProductWithCategory[] {
    return db.getAllSync<ProductWithCategory>(`${WITH_CATEGORY} ORDER BY p.name ASC`);
  },

  getById(id: number): ProductWithCategory | null {
    return (
      db.getFirstSync<ProductWithCategory>(`${WITH_CATEGORY} WHERE p.id = ?`, [id]) ?? null
    );
  },

  create(name: string, price: number, categoryId: number | null = null): number {
    ProductSchema.parse({ name, current_price: price });

    let productId: number = 0;

    db.withTransactionSync(() => {
      const result = db.runSync(
        `INSERT INTO products (name, current_price, category_id, updated_at)
         VALUES (?, ?, ?, datetime('now', 'localtime'))`,
        [name, price, categoryId]
      );
      productId = result.lastInsertRowId;

      db.runSync(
        `INSERT INTO price_history (product_id, price, date)
         VALUES (?, ?, datetime('now', 'localtime'))`,
        [productId, price]
      );
    });

    return productId;
  },

  search(query: string): ProductWithCategory[] {
    const safe = escapeLike(query);
    return db.getAllSync<ProductWithCategory>(
      `${WITH_CATEGORY} WHERE p.name LIKE ? ESCAPE '\\' ORDER BY p.name ASC`,
      [`%${safe}%`]
    );
  },

  updateCategory(productId: number, categoryId: number | null): void {
    db.runSync('UPDATE products SET category_id = ? WHERE id = ?', [categoryId, productId]);
  },
};
