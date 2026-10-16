import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';
function Card({ p }) {
  const { add } = useCart();
  const vs = p.product_variants.filter(v => v.stock > 0);
  const sizes = [...new Set(vs.map(v => v.size))];
  const [size, setSize] = useState(''); const [color, setColor] = useState('');
  const colors = [...new Set(vs.filter(v => v.size === size).map(v => v.color))];
  const v = vs.find(x => x.size === size && x.color === color);
  const img = p.product_images.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  return (<div className="card">
    {img ? <img src={img} alt={p.name}/> : <div className="noimg"/>}
    <h3>{p.name}</h3>
    <div className="price">{p.price} دج {p.original_price && <s>{p.original_price} دج</s>}</div>
    {!vs.length ? <p className="out">نفذت الكمية</p> : <>
      <div className="opts">{sizes.map(s => <button key={s} className={s === size ? 'on' : ''} onClick={() => { setSize(s); setColor(''); }}>{s}</button>)}</div>
      <div className="opts">{colors.map(c => <button key={c} className={c === color ? 'on' : ''} onClick={() => setColor(c)}>{c}</button>)}</div>
      <button className="btn" disabled={!v} onClick={() => add({ variant_id: v.id, name: p.name, size, color, price: p.price, stock: v.stock, quantity: 1 })}>أضف إلى السلة</button></>}
  </div>);
}
export default function Home() {
  const [list, setList] = useState([]); const [q, setQ] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { supabase.from('products').select('*, product_images(*), product_variants(*)').eq('is_active', true).order('created_at', { ascending: false })
    .then(({ data, error }) => error ? setErr('تعذر تحميل المنتجات') : setList(data)); }, []);
  const shown = list.filter(p => p.name.includes(q));
  return (<section className="wrap"><input className="search" placeholder="ابحث عن منتج" value={q} onChange={e => setQ(e.target.value)}/>
    {err && <p className="out">{err}</p>}
    <div className="grid">{shown.map(p => <Card key={p.id} p={p}/>)}</div>
    {!err && !shown.length && <p>لا توجد منتجات حاليا.</p>}</section>);
}
