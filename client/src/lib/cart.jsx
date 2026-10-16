import { createContext, useContext, useEffect, useState } from 'react';
const Ctx = createContext();
export const useCart = () => useContext(Ctx);
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } });
  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);
  const add = (it) => setItems(p => {
    const f = p.find(x => x.variant_id === it.variant_id);
    return f ? p.map(x => x === f ? { ...x, quantity: Math.min(x.quantity + it.quantity, x.stock) } : x) : [...p, it];
  });
  const setQty = (id, q) => setItems(p => p.map(x => x.variant_id === id ? { ...x, quantity: Math.max(1, Math.min(q, x.stock)) } : x));
  const remove = (id) => setItems(p => p.filter(x => x.variant_id !== id));
  const clear = () => setItems([]);
  const subtotal = items.reduce((s, x) => s + x.price * x.quantity, 0);
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, subtotal }}>{children}</Ctx.Provider>;
}
