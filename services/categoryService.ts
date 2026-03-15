import { db } from '@/db/database';
import type { Category, Product } from '@/db/types';

export const categoryService = {
  getAll(): Category[] {
    return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name ASC');
  },

  getById(id: number): Category | null {
    return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?', [id]) ?? null;
  },

  create(name: string): number {
    const result = db.runSync(
      `INSERT INTO categories (name, created_at) VALUES (?, datetime('now', 'localtime'))`,
      [name.trim()]
    );
    return result.lastInsertRowId;
  },

  delete(id: number): void {
    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  },

  getProducts(categoryId: number): Product[] {
    return db.getAllSync<Product>(
      'SELECT * FROM products WHERE category_id = ? ORDER BY name ASC',
      [categoryId]
    );
  },

  /**
   * Replaces the full product membership list for a category.
   * Products in the given list → category_id = categoryId.
   * Products previously in this category but not in the list → category_id = NULL.
   */
  setMembers(categoryId: number, productIds: number[]): void {
    db.withTransactionSync(() => {
      db.runSync('UPDATE products SET category_id = NULL WHERE category_id = ?', [categoryId]);
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(', ');
        db.runSync(
          `UPDATE products SET category_id = ? WHERE id IN (${placeholders})`,
          [categoryId, ...productIds]
        );
      }
    });
  },

  setProductCategory(productId: number, categoryId: number | null): void {
    db.runSync('UPDATE products SET category_id = ? WHERE id = ?', [categoryId, productId]);
  },
};
