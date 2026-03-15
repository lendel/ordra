import { z } from 'zod';

// ─── Requests ─────────────────────────────────────────────────────────────────

export type RequestStatus = 'draft' | 'sent' | 'completed' | 'cancelled';

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлена',
  completed: 'Выполнена',
  cancelled: 'Отменена',
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  draft: '#8E8E93',
  sent: '#007AFF',
  completed: '#34C759',
  cancelled: '#FF3B30',
};

export const REQUEST_STATUSES: RequestStatus[] = ['draft', 'sent', 'completed', 'cancelled'];

export const RequestSchema = z.object({
  title: z.string().min(1, 'Название не может быть пустым'),
});

export const RequestItemSchema = z.object({
  request_id: z.number().int().positive(),
  name: z.string().min(1, 'Название не может быть пустым'),
  price: z.number().positive('Цена должна быть больше нуля'),
});

export type Request = {
  id: number;
  title: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

export type RequestWithStats = Request & {
  item_count: number;
  received_count: number;
  total: number;
};

export type RequestItem = {
  id: number;
  request_id: number;
  product_id: number | null;
  name: string;
  price: number;
  received: number; // 0 | 1
  created_at: string;
};

// ─── Categories ───────────────────────────────────────────────────────────────

export type Category = {
  id: number;
  name: string;
  created_at: string;
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const ProductSchema = z.object({
  name: z.string().min(1, 'Название не может быть пустым'),
  current_price: z.number().positive('Цена должна быть больше нуля'),
});

export const PriceHistorySchema = z.object({
  product_id: z.number().int().positive(),
  price: z.number().positive('Цена должна быть больше нуля'),
});

export type CreateProductInput = z.infer<typeof ProductSchema>;
export type CreatePriceInput = z.infer<typeof PriceHistorySchema>;

export type Product = {
  id: number;
  name: string;
  current_price: number;
  category_id: number | null;
  updated_at: string;
};

export type ProductWithCategory = Product & {
  category_name: string | null;
};

export type PriceHistory = {
  id: number;
  product_id: number;
  price: number;
  date: string;
};
