import { Link } from 'react-router-dom';
export default function ProductCard({ p }) {
  const img = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const inStock = p.product_variants.some(v => v.stock > 0);
  const sizes = [...new Set(p.product_variants.filter(v => v.stock > 0).map(v => v.size))];
  return (<Link to={`/product/${p.id}`} className="card pc">
    {img ? <img src={img} alt={p.name} loading="lazy"/> : <div className="noimg"/>}
    <h3>{p.name}</h3>
    <div className="price">{p.price} دج {p.original_price && <s>{p.original_price} دج</s>}</div>
    {inStock ? <small>{sizes.join(' · ')}</small> : <small className="out">نفذت الكمية</small>}
  </Link>);
}
