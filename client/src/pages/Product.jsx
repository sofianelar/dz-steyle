import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';
import ProductCard from '../components/ProductCard';
const SEL = '*, product_images(*), product_variants(*)';
export default function Product() {
  const { id } = useParams(); const nav = useNavigate(); const { add } = useCart();
  const [p, setP] = useState(null); const [rel, setRel] = useState([]); const [state, setState] = useState('loading');
  const [img, setImg] = useState(0); const [size, setSize] = useState(''); const [color, setColor] = useState(''); const [qty, setQty] = useState(1); const [added, setAdded] = useState(false);
  useEffect(() => {
    setState('loading'); setSize(''); setColor(''); setQty(1); setImg(0); setAdded(false);
    supabase.from('products').select(SEL).eq('id', id).eq('is_active', true).maybeSingle().then(async ({ data }) => {
      if (!data) return setState('missing');
      setP(data); setState('ok');
      if (data.category_id) {
        const r = await supabase.from('products').select(SEL).eq('is_active', true).eq('category_id', data.category_id).neq('id', id).limit(4);
        setRel(r.data || []);
      } else setRel([]);
    });
  }, [id]);
  if (state === 'loading') return <p className="wrap">...</p>;
  if (state === 'missing') return <section className="wrap"><p>هذا المنتج غير متوفر.</p><Link to="/" className="btn">العودة للمتجر</Link></section>;
  const imgs = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const vs = p.product_variants.filter(v => v.stock > 0);
  const sizes = [...new Set(vs.map(v => v.size))];
  const colors = [...new Set(vs.filter(v => v.size === size).map(v => v.color))];
  const v = vs.find(x => x.size === size && x.color === color);
  const addToCart = () => {
    add({ variant_id: v.id, name: p.name, size, color, price: p.price, stock: v.stock, quantity: qty });
    setAdded(true);
  };
  return (<section className="wrap">
    <div className="pd">
      <div>
        {imgs[img] ? <img className="big" src={imgs[img].url} alt={p.name}/> : <div className="noimg"/>}
        <div className="thumbs">{imgs.map((i, k) => <img key={i.id} src={i.url} alt="" className={k === img ? 'on' : ''} onClick={() => setImg(k)}/>)}</div>
      </div>
      <div>
        <h1>{p.name}</h1>
        <div className="price">{p.price} دج {p.original_price && <s>{p.original_price} دج</s>}</div>
        {p.description && <p>{p.description}</p>}
        {!vs.length ? <p className="out">نفذت الكمية</p> : <>
          <b>المقاس</b>
          <div className="opts">{sizes.map(s => <button key={s} className={s === size ? 'on' : ''} onClick={() => { setSize(s); setColor(''); setQty(1); }}>{s}</button>)}</div>
          <b>اللون</b>
          <div className="opts">{size ? colors.map(c => <button key={c} className={c === color ? 'on' : ''} onClick={() => { setColor(c); setQty(1); }}>{c}</button>) : <small>اختر المقاس أولا</small>}</div>
          <b>الكمية</b>
          <div className="opts"><input type="number" min="1" max={v?.stock || 1} value={qty} onChange={e => setQty(Math.max(1, Math.min(+e.target.value || 1, v?.stock || 1)))} style={{ width: 80, padding: 8 }}/>{v && <small>المتوفر: {v.stock}</small>}</div>
          <button className="btn" disabled={!v} onClick={addToCart}>أضف إلى السلة</button>
          {added && <p>تمت الإضافة. <Link to="/cart">عرض السلة</Link> · <Link to="/checkout">إتمام الطلب</Link></p>}
        </>}
        <p><button onClick={() => nav(-1)}>رجوع</button></p>
      </div>
    </div>
    {rel.length > 0 && <><h2>منتجات مشابهة</h2><div className="grid">{rel.map(r => <ProductCard key={r.id} p={r}/>)}</div></>}
  </section>);
}
