import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './lib/cart';
import Home from './pages/Home';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import AdminApp from './admin/AdminApp';
export default function App() {
  const { items } = useCart();
  const isAdmin = useLocation().pathname.startsWith('/admin');
  return (<>
    {!isAdmin && <header className="hdr"><Link to="/" className="logo">STAYEL <b>DZ</b></Link>
      <Link to="/cart" className="cartlink"><ShoppingBag size={22}/><span>{items.length}</span></Link></header>}
    <main><Routes>
      <Route path="/" element={<Home/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<Checkout/>}/>
      <Route path="/admin/*" element={<AdminApp/>}/>
    </Routes></main>
    {!isAdmin && <footer className="ftr">STAYEL DZ — الدفع عند الاستلام عبر 58 ولاية</footer>}
  </>);
}
