import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
const ST = { pending: 'قيد الانتظار', confirmed: 'مؤكد', preparing: 'قيد التحضير', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغى' };
export default function Orders() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState(''); const [st, setSt] = useState(''); const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(300);
    if (error) setErr(error.message); else setRows(data);
  }, []);
  useEffect(() => {
    load();
    const ch = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load).subscribe();
    const poll = setInterval(load, 15000); // fallback if realtime is unavailable
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [load]);
  async function setStatus(id, s) {
    const { error } = await supabase.rpc('set_order_status', { oid: id, s });
    if (error) alert(error.message); else load();
  }
  async function saveNote(id, admin_notes) { await supabase.from('orders').update({ admin_notes }).eq('id', id); }
  const shown = rows.filter(o => (!st || o.status === st) && (`${o.reference} ${o.customer_name} ${o.phone}`).includes(q));
  const pending = rows.filter(o => o.status === 'pending').length;
  return (<div>
    <h2>الطلبات <span className="badge">{pending} جديد</span></h2>
    {err && <p className="out">{err}</p>}
    <div className="bar"><input className="search" placeholder="بحث: رقم الطلب / الاسم / الهاتف" value={q} onChange={e => setQ(e.target.value)}/>
      <select value={st} onChange={e => setSt(e.target.value)}><option value="">كل الحالات</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
    {shown.map(o => (<div className="order" key={o.id}>
      <div className="oh"><b>{o.reference}</b><span className={`st ${o.status}`}>{ST[o.status]}</span><small>{new Date(o.created_at).toLocaleString('ar-DZ')}</small></div>
      <p>{o.customer_name} — <a href={`tel:${o.phone}`}>{o.phone}</a><br/>{o.wilaya} / {o.commune} — {o.address}</p>
      {o.notes && <p>ملاحظة الزبون: {o.notes}</p>}
      <ul>{o.order_items.map(i => <li key={i.id}>{i.product_name} — {i.size} / {i.color} × {i.quantity} — {i.unit_price} دج</li>)}</ul>
      <p>المجموع الفرعي {o.subtotal} + التوصيل {o.delivery_fee} = <b>{o.total} دج</b></p>
      <div className="bar"><select value={o.status} onChange={e => setStatus(o.id, e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input placeholder="ملاحظة داخلية" defaultValue={o.admin_notes || ''} onBlur={e => saveNote(o.id, e.target.value)}/>
        <button onClick={() => window.print()}>طباعة</button></div>
    </div>))}
    {!shown.length && <p>لا توجد طلبات.</p>}
  </div>);
}
