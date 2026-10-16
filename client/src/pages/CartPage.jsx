import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart';
export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  if (!items.length) return <section className="wrap"><p>السلة فارغة.</p><Link to="/" className="btn">العودة للمتجر</Link></section>;
  return (<section className="wrap">{items.map(i => <div className="row" key={i.variant_id}>
    <div><b>{i.name}</b><br/>{i.size} / {i.color}</div>
    <input type="number" min="1" max={i.stock} value={i.quantity} onChange={e => setQty(i.variant_id, +e.target.value)}/>
    <span>{i.price * i.quantity} دج</span><button onClick={() => remove(i.variant_id)}>حذف</button></div>)}
    <p>المجموع الفرعي: <b>{subtotal} دج</b> (التوصيل يُحسب عند الطلب)</p>
    <Link to="/checkout" className="btn">إتمام الطلب</Link> <Link to="/">متابعة التسوق</Link></section>);
}
