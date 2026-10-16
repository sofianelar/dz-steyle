import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { WILAYAS } from '../lib/wilayas';
import { submitOrder } from '../lib/submitOrder';
export default function Checkout() {
  const { items, clear, subtotal } = useCart();
  const key = useRef(crypto.randomUUID());
  const [f, setF] = useState({ name: '', phone: '', wilaya: '', commune: '', address: '', notes: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState(null);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function go(e) {
    e.preventDefault(); if (busy) return;
    if (!/^0[567]\d{8}$/.test(f.phone)) return setErr('رقم الهاتف غير صالح (مثال: 0555123456)');
    setBusy(true); setErr('');
    try {
      const r = await submitOrder(f, items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), key.current);
      clear(); setDone(r);
      window.open(r.whatsappUrl, '_blank', 'noopener'); // may be blocked: fallback button below
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  if (done) return (<section className="wrap ok"><h2>تم حفظ طلبك بنجاح</h2>
    <p>رقم الطلب: <b>{done.order.reference}</b></p>
    <p>المجموع النهائي: {done.order.total} دج (الدفع عند الاستلام)</p>
    <a className="btn" href={done.whatsappUrl} target="_blank" rel="noopener noreferrer">إرسال تفاصيل الطلب عبر واتساب</a>{' '}
    <Link to="/" className="btn alt">العودة للمتجر</Link></section>);
  if (!items.length) return <section className="wrap"><p>السلة فارغة.</p><Link to="/">العودة للمتجر</Link></section>;
  return (<section className="wrap"><form onSubmit={go} className="form">
    <input required maxLength="80" placeholder="الاسم الكامل" value={f.name} onChange={set('name')}/>
    <input required inputMode="tel" maxLength="10" placeholder="رقم الهاتف" value={f.phone} onChange={set('phone')}/>
    <select required value={f.wilaya} onChange={set('wilaya')}><option value="">الولاية</option>{WILAYAS.map(w => <option key={w}>{w}</option>)}</select>
    <input required maxLength="60" placeholder="البلدية" value={f.commune} onChange={set('commune')}/>
    <input required maxLength="250" placeholder="العنوان بالتفصيل" value={f.address} onChange={set('address')}/>
    <textarea maxLength="500" placeholder="ملاحظات (اختياري)" value={f.notes} onChange={set('notes')}/>
    <p>المجموع الفرعي: {subtotal} دج — التوصيل يحدده السيرفر</p>
    {err && <p className="out">{err}</p>}
    <button className="btn" disabled={busy}>{busy ? 'جاري الحفظ...' : 'إرسال الطلب'}</button></form></section>);
}
