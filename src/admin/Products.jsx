import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
const empty = { name: '', description: '', price: '', original_price: '', category_id: '', sizes: 'S,M,L,XL', colors: 'أسود', stock: 10 };
export default function Products() {
  const [list, setList] = useState([]); const [cats, setCats] = useState([]); const [f, setF] = useState(empty);
  const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const load = async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*, product_images(*), product_variants(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order')]);
    setList(p.data || []); setCats(c.data || []);
  };
  useEffect(() => { load(); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function addCat() {
    const name = prompt('اسم التصنيف'); if (!name) return;
    await supabase.from('categories').insert({ name, sort_order: cats.length }); load();
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      const { data: p, error } = await supabase.from('products').insert({
        name: f.name, description: f.description, price: +f.price,
        original_price: f.original_price ? +f.original_price : null, category_id: f.category_id || null }).select().single();
      if (error) throw error;
      const split = s => s.split(',').map(x => x.trim()).filter(Boolean);
      const variants = split(f.sizes).flatMap(size => split(f.colors).map(color => ({ product_id: p.id, size, color, stock: +f.stock })));
      const v = await supabase.from('product_variants').insert(variants); if (v.error) throw v.error;
      for (const [i, file] of [...files].entries()) {
        const path = `${p.id}/${Date.now()}-${i}-${file.name.replace(/[^\w.]/g, '_')}`;
        const up = await supabase.storage.from('product-images').upload(path, file); if (up.error) throw up.error;
        const url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        await supabase.from('product_images').insert({ product_id: p.id, url, sort_order: i });
      }
      setF(empty); setFiles([]); setMsg('تمت إضافة المنتج وهو ظاهر الآن في المتجر'); load();
    } catch (x) { setMsg('خطأ: ' + x.message); } finally { setBusy(false); }
  }
  const toggle = async (p, k) => { await supabase.from('products').update({ [k]: !p[k] }).eq('id', p.id); load(); };
  async function del(p) {
    if (!confirm(`حذف "${p.name}" نهائيا؟`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) alert(error.message); else load();
  }
  async function editPrice(p) {
    const v = prompt('السعر الجديد (دج)', p.price); if (!v || isNaN(+v)) return;
    await supabase.from('products').update({ price: +v }).eq('id', p.id); load();
  }
  async function editStock(vr) {
    const v = prompt(`المخزون: ${vr.size} / ${vr.color}`, vr.stock); if (v === null || isNaN(+v) || +v < 0) return;
    await supabase.from('product_variants').update({ stock: +v }).eq('id', vr.id); load();
  }
  return (<div>
    <h2>إضافة منتج</h2>
    <form className="form" onSubmit={save}>
      <input required placeholder="اسم المنتج" value={f.name} onChange={set('name')}/>
      <textarea placeholder="الوصف" value={f.description} onChange={set('description')}/>
      <input required type="number" min="0" placeholder="السعر (دج)" value={f.price} onChange={set('price')}/>
      <input type="number" min="0" placeholder="السعر قبل التخفيض (اختياري)" value={f.original_price} onChange={set('original_price')}/>
      <div className="bar"><select value={f.category_id} onChange={set('category_id')}><option value="">بدون تصنيف</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button type="button" onClick={addCat}>+ تصنيف</button></div>
      <input placeholder="المقاسات مفصولة بفاصلة" value={f.sizes} onChange={set('sizes')}/>
      <input placeholder="الألوان مفصولة بفاصلة" value={f.colors} onChange={set('colors')}/>
      <input type="number" min="0" placeholder="المخزون لكل خيار" value={f.stock} onChange={set('stock')}/>
      <input type="file" accept="image/*" multiple onChange={e => setFiles(e.target.files)}/>
      {msg && <p>{msg}</p>}<button className="btn" disabled={busy}>{busy ? '...' : 'حفظ المنتج'}</button></form>
    <h2>المنتجات ({list.length})</h2>
    <div className="tbl"><table><thead><tr><th>الصورة</th><th>الاسم</th><th>السعر</th><th>المخزون</th><th>ظاهر</th><th>مميز</th><th></th></tr></thead><tbody>
      {list.map(p => <tr key={p.id}>
        <td>{p.product_images[0] && <img src={p.product_images[0].url} width="48" alt=""/>}</td><td>{p.name}</td>
        <td><button onClick={() => editPrice(p)}>{p.price}</button></td>
        <td>{p.product_variants.map(v => <button key={v.id} onClick={() => editStock(v)}>{v.size}/{v.color}: {v.stock}</button>)}</td>
        <td><input type="checkbox" checked={p.is_active} onChange={() => toggle(p, 'is_active')}/></td>
        <td><input type="checkbox" checked={p.is_featured} onChange={() => toggle(p, 'is_featured')}/></td>
        <td><button onClick={() => del(p)}>حذف</button></td></tr>)}</tbody></table></div>
  </div>);
}
