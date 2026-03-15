/** Форматирует число в строку цены: ₸ 1 234 */
export function formatPrice(value: number): string {
  return `₸ ${Math.round(value).toLocaleString('ru-KZ')}`;
}
