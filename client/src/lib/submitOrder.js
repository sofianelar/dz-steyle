import { buildWhatsAppUrl } from './whatsapp';
// Create ONE uuid per checkout attempt (crypto.randomUUID()) and reuse it on retries: no duplicate orders.
export async function submitOrder(form, items, key) {
  const r = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, items, idempotency_key: key }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'تعذر حفظ الطلب');
  return { order: data.order, whatsappUrl: buildWhatsAppUrl(data.order, data.whatsapp) };
}
