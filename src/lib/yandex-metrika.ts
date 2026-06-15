/**
 * Yandex Metrika helper functions
 *
 * Automatically uses counter ID from NEXT_PUBLIC_YANDEX_METRIKA_ID env variable
 */

const COUNTER_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);

/**
 * Проверка доступности Метрики
 */
function isAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ym;
}

/**
 * Отправка цели (конверсии)
 *
 * @example
 * yandexMetrika.reachGoal('add_to_cart', { tab_id: '123', price: 299 });
 */
export function reachGoal(goal: string, params?: Record<string, string | number | boolean | null>) {
  if (!isAvailable()) return;
  window.ym?.(COUNTER_ID, 'reachGoal', goal, params);
}

/**
 * E-commerce: добавление товара в корзину
 */
export function addProductToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}) {
  if (!isAvailable()) return;
  window.ym?.(COUNTER_ID, 'addProductToCart', product);
}

/**
 * E-commerce: покупка
 */
export function purchase(order: {
  id: string;
  value: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) {
  if (!isAvailable()) return;
  window.ym?.(COUNTER_ID, 'purchase', order);
}
