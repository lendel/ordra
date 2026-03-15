import type { Product, Request, RequestItem } from '@/db/types';
import { STATUS_LABELS } from '@/db/types';
import { formatPrice } from './formatPrice';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ─── Общий CSS ────────────────────────────────────────────────────────────────

const CSS = `
  body { font-family: Arial, sans-serif; padding: 32px; color: #0A0A0A; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #8E8E93; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px 12px; background: #F2F2F7; font-size: 12px;
       color: #8E8E93; text-transform: uppercase; letter-spacing: .5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #E5E5EA; font-size: 14px; }
  tr:last-child td { border-bottom: none; }
  .price { color: #007AFF; font-weight: bold; }
  .num { color: #8E8E93; }
  .total { font-size: 16px; font-weight: bold; text-align: right;
           margin-top: 16px; padding-top: 12px; border-top: 2px solid #E5E5EA; }
`;

function fmt(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function today(): string {
  return new Date().toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Каталог / Категория ──────────────────────────────────────────────────────

function catalogHtml(title: string, subtitle: string, products: Product[]): string {
  const rows = products
    .map(
      (p, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td>${p.name}</td>
      <td class="price">${formatPrice(p.current_price)}</td>
      <td class="num">${fmt(p.updated_at)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${CSS}</style></head><body>
    <h1>${title}</h1>
    <div class="sub">${subtitle} · ${products.length} позиций</div>
    <table>
      <thead><tr><th>#</th><th>Название</th><th>Текущая цена</th><th>Обновлено</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;
}

// ─── Заявка ───────────────────────────────────────────────────────────────────

function requestHtml(request: Request, items: RequestItem[]): string {
  const total = items.reduce((sum, it) => sum + it.price, 0);

  const rows = items
    .map(
      (it, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td>${it.name}</td>
      <td class="price">${formatPrice(it.price)}</td>
      <td style="color:${it.received ? '#22c55e' : '#8E8E93'}">${it.received ? '✓' : '—'}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${CSS}</style></head><body>
    <h1>${request.title}</h1>
    <div class="sub">
      ${STATUS_LABELS[request.status]} · Создана: ${fmt(request.created_at)} · Экспортировано: ${today()}
    </div>
    <table>
      <thead><tr><th>#</th><th>Товар</th><th>Цена</th><th>Получен</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="color:#8E8E93;text-align:center">Нет позиций</td></tr>'}</tbody>
    </table>
    ${items.length > 0 ? `<div class="total">ИТОГО: ${formatPrice(total)}</div>` : ''}
  </body></html>`;
}

// ─── Публичные функции ────────────────────────────────────────────────────────

export async function exportCatalogPdf(products: Product[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: catalogHtml('Каталог товаров', `Экспортировано: ${today()}`, products),
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Каталог товаров',
    UTI: 'com.adobe.pdf',
  });
}

export async function exportCategoryPdf(categoryName: string, products: Product[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: catalogHtml(categoryName, `Экспортировано: ${today()}`, products),
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: categoryName,
    UTI: 'com.adobe.pdf',
  });
}

export async function exportRequestPdf(request: Request, items: RequestItem[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: requestHtml(request, items),
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: request.title,
    UTI: 'com.adobe.pdf',
  });
}
