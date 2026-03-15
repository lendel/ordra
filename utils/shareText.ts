import { Share } from 'react-native';
import type { Product, Request, RequestItem } from '@/db/types';
import { STATUS_LABELS } from '@/db/types';
import { formatPrice } from './formatPrice';

function today(): string {
  return new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmt(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function buildCatalogText(title: string, products: Product[]): string {
  const header = `${title}\n${today()} · ${products.length} позиций`;
  const lines = products.map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.current_price)}`);
  return `${header}\n\n${lines.join('\n')}`;
}

export function buildRequestText(request: Request, items: RequestItem[]): string {
  const total = items.reduce((sum, it) => sum + it.price, 0);
  const header = [
    `📋 ${request.title}`,
    `Статус: ${STATUS_LABELS[request.status]}`,
    `Создана: ${fmt(request.created_at)}`,
    `Экспортировано: ${today()}`,
  ].join('\n');
  const lines = items.map((it, i) =>
    `${i + 1}. ${it.name} — ${formatPrice(it.price)}${it.received ? ' ✓' : ''}`
  );
  const footer = items.length > 0 ? `\nИтого: ${formatPrice(total)}` : '';
  return `${header}\n\n${lines.join('\n')}${footer}`;
}

export async function shareText(text: string): Promise<void> {
  await Share.share({ message: text });
}
