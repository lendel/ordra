import { db } from '@/db/database';
import { RequestSchema } from '@/db/types';
import type { Request, RequestItem, RequestStatus, RequestWithStats } from '@/db/types';

export const requestService = {
  getAll(): Request[] {
    return db.getAllSync<Request>('SELECT * FROM requests ORDER BY updated_at DESC');
  },

  getAllWithStats(): RequestWithStats[] {
    return db.getAllSync<RequestWithStats>(
      `SELECT r.*,
        COUNT(ri.id) AS item_count,
        COUNT(CASE WHEN ri.received = 1 THEN 1 END) AS received_count,
        COALESCE(SUM(ri.price), 0) AS total
       FROM requests r
       LEFT JOIN request_items ri ON ri.request_id = r.id
       GROUP BY r.id
       ORDER BY r.updated_at DESC`
    );
  },

  getById(id: number): Request | null {
    return db.getFirstSync<Request>('SELECT * FROM requests WHERE id = ?', [id]) ?? null;
  },

  create(title: string): number {
    RequestSchema.parse({ title });
    const result = db.runSync(
      `INSERT INTO requests (title, status, created_at, updated_at)
       VALUES (?, 'draft', datetime('now', 'localtime'), datetime('now', 'localtime'))`,
      [title.trim()]
    );
    return result.lastInsertRowId;
  },

  updateStatus(id: number, status: RequestStatus): void {
    db.runSync(
      `UPDATE requests SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
      [status, id]
    );
  },

  delete(id: number): void {
    db.runSync('DELETE FROM requests WHERE id = ?', [id]);
  },

  getItems(requestId: number): RequestItem[] {
    return db.getAllSync<RequestItem>(
      'SELECT * FROM request_items WHERE request_id = ? ORDER BY created_at ASC',
      [requestId]
    );
  },

  addItem(requestId: number, name: string, price: number, productId?: number): number {
    const result = db.runSync(
      `INSERT INTO request_items (request_id, product_id, name, price, created_at)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
      [requestId, productId ?? null, name.trim(), price]
    );
    db.runSync(
      `UPDATE requests SET updated_at = datetime('now', 'localtime') WHERE id = ?`,
      [requestId]
    );
    return result.lastInsertRowId;
  },

  markReceived(itemId: number): void {
    db.runSync('UPDATE request_items SET received = 1 WHERE id = ?', [itemId]);
  },

  deleteItem(itemId: number, requestId: number): void {
    db.runSync('DELETE FROM request_items WHERE id = ?', [itemId]);
    db.runSync(`UPDATE requests SET updated_at = datetime('now', 'localtime') WHERE id = ?`, [requestId]);
  },

  /** Сумма всех позиций заявки */
  getTotal(requestId: number): number {
    const row = db.getFirstSync<{ total: number }>(
      'SELECT COALESCE(SUM(price), 0) as total FROM request_items WHERE request_id = ?',
      [requestId]
    );
    return row?.total ?? 0;
  },
};
