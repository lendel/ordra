import { db } from '@/db/database';
import { PriceHistorySchema } from '@/db/types';
import type { PriceHistory } from '@/db/types';

export const priceService = {
  getByProduct(productId: number): PriceHistory[] {
    return db.getAllSync<PriceHistory>(
      'SELECT * FROM price_history WHERE product_id = ? ORDER BY date DESC',
      [productId]
    );
  },

  /**
   * Adds a price record and updates products.current_price atomically.
   */
  addPrice(productId: number, price: number): void {
    PriceHistorySchema.parse({ product_id: productId, price });

    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO price_history (product_id, price, date) VALUES (?, ?, datetime('now', 'localtime'))`,
        [productId, price]
      );
      db.runSync(
        `UPDATE products SET current_price = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [price, productId]
      );
    });
  },
};
