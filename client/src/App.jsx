import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Truck, ShieldCheck, RefreshCw, PhoneCall, Search, X } from 'lucide-react';
import { useSearch } from './lib/search';
import { useCart } from './lib/cart';
import { useSettings } from './lib/useSettings';
import ButtonLink from './components/ButtonLink';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import Product from './pages/Product';
import AdminApp from './admin/AdminApp';
import AnnouncementBar from './components/AnnouncementBar';

export default function App() {
  const { items, openCart } = useCart();
  const settings = useSettings();
  const location = useLocation();
  const { q, setQ } = useSearch();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#09090b]">
      {!isAdmin && <AnnouncementBar />}

      {!isAdmin && (
        <header className="site-header">
          <div className="site-header-inner">
            <Link to="/" className="brand-logo" aria-label="الصفحة الرئيسية">
              STAYEL <b>DZ</b>
            </Link>

            {/* Desktop Search Bar - hidden on mobile */}
            <div className="header-search-wrapper">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
                <input
                  id="header-search-input"
                  type="text"
                  className="header-search-input"
                  placeholder="ابحث عن منتج..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  aria-label="بحث عن منتج"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer transition-colors"
                    aria-label="مسح البحث"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  <PhoneCall size={14} />
                  <span>تواصل معنا</span>
                </a>
              )}

              {/* Cart Drawer Trigger */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-sm cursor-pointer"
                aria-label={`السلة، ${items.length} منتج`}
              >
                <ShoppingBag size={18} />
                <span className="text-sm font-bold hidden sm:inline">السلة</span>
                {items.length > 0 && (
                  <span className="bg-amber-400 text-zinc-950 text-xs font-black px-2 py-0.5 rounded-full shadow-xs">
                    {items.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Global Slide-Over Cart Drawer */}
      {!isAdmin && <CartDrawer />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </main>

      {!isAdmin && (
        <footer className="site-footer">
          <div className="footer-features">
            <div className="footer-feature-item">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h4>توصيل عبر 58 ولاية</h4>
                <p>شحن سريع إلى باب منزلك أو المكتب</p>
              </div>
            </div>

            <div className="footer-feature-item">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4>الدفع عند الاستلام</h4>
                <p>عاين طلبك وتأكد من جودته ثم ادفع</p>
              </div>
            </div>

            <div className="footer-feature-item">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-sky-400 shrink-0">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4>ضمان المقاس والجودة</h4>
                <p>إمكانية الاستبدال السريع عند الحاجة</p>
              </div>
            </div>
          </div>

          <div className="footer-copyright">
            <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} STAYEL DZ — أناقة وأسلوب عصري</p>
          </div>
        </footer>
      )}
    </div>
  );
}
