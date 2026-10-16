export function buildWhatsAppUrl(order, number = '213796006953') {
  const items = order.order_items.map(i =>
    `${i.product_name}\nالمقاس: ${i.size}\nاللون: ${i.color}\nالكمية: ${i.quantity}\nالسعر: ${i.unit_price} دج`).join('\n\n');
  const text = `طلب جديد من متجر STAYEL DZ\n\nرقم الطلب: ${order.reference}\n\nمعلومات الزبون:\nالاسم: ${order.customer_name}\nالهاتف: ${order.phone}\nالولاية: ${order.wilaya}\nالبلدية: ${order.commune}\nالعنوان: ${order.address}\n\nتفاصيل المنتجات:\n${items}\n\nالمجموع الفرعي: ${order.subtotal} دج\nالتوصيل: ${order.delivery_fee} دج\nالمجموع النهائي: ${order.total} دج\n\nطريقة الدفع: الدفع عند الاستلام` + (order.notes ? `\n\nملاحظات الزبون: ${order.notes}` : '');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
