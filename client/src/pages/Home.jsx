import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
export default function Home() {
  const [list, setList] = useState([]); const [cats, setCats] = useState([]); const [err, setErr] = useState('');
  const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [size, setSize] = useState('');
  const [color, setColor] = useState(''); const [min, setMin] = useState(''); const [max, setMax] = useState(''); const [sort, setSort] = useState('new');
  useEffect(() => {
    supabase.from('products').select('*, product_images(*), product_variants(*)').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data, error }) => error ? setErr('تعذر تحميل المنتجات') : setList(data));
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setCats(data || []));
  }, []);
  const sizes = useMemo(() => [...new Set(list.flatMap(p => p.product_variants.map(v => v.size)))], [list]);
  const colors = useMemo(() => [...new Set(list.flatMap(p => p.product_variants.map(v => v.color)))], [list]);
  const shown = useMemo(() => {
    let r = list.filter(p =>
      p.name.toLowerCase().includes(q.trim().toLowerCase()) &&
      (!cat || p.category_id === cat) &&
      (!min || p.price >= +min) && (!max || p.price <= +max) &&
      (!size && !color || p.product_variants.some(v => v.stock > 0 && (!size || v.size === size) && (!color || v.color === color))));
    if (sort === 'low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'high') r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [list, q, cat, size, color, min, max, sort]);
  const reset = () => { setQ(''); setCat(''); setSize(''); setColor(''); setMin(''); setMax(''); setSort('new'); };
  return (<section className="wrap">
    <input className="search" placeholder="ابحث عن منتج" value={q} onChange={e => setQ(e.target.value)}/>
    <div className="opts">
      <button className={!cat ? 'on' : ''} onClick={() => setCat('')}>الكل</button>
      {cats.map(c => <button key={c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>{c.name}</button>)}
    </div>
    <div className="filters">
      <select value={size} onChange={e => setSize(e.target.value)}><option value="">كل المقاسات</option>{sizes.map(s => <option key={s}>{s}</option>)}</select>
      <select value={color} onChange={e => setColor(e.target.value)}><option value="">كل الألوان</option>{colors.map(s => <option key={s}>{s}</option>)}</select>
      <input type="number" min="0" placeholder="أدنى سعر" value={min} onChange={e => setMin(e.target.value)}/>
      <input type="number" min="0" placeholder="أعلى سعر" value={max} onChange={e => setMax(e.target.value)}/>
      <select value={sort} onChange={e => setSort(e.target.value)}><option value="new">الأحدث</option><option value="low">السعر: الأقل</option><option value="high">السعر: الأعلى</option></select>
      <button onClick={reset}>إعادة ضبط</button>
    </div>
    {err && <p className="out">{err}</p>}
    <div className="grid">{shown.map(p => <ProductCard key={p.id} p={p}/>)}</div>
    {!err && !shown.length && <p>لا توجد منتجات مطابقة.</p>}
  </section>);
}
