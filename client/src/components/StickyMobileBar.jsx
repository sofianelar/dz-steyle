import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowDown } from 'lucide-react';

export default function StickyMobileBar({ product, onBuyClick }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past 350px
      if (window.scrollY > 350) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show || !product) return null;

  const img = product.product_images?.[0]?.url;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 shadow-2xl animate-slide-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {img && (
            <img
              src={img}
              alt=""
              className="w-11 h-11 rounded-lg object-cover border border-zinc-200 shrink-0"
            />
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-zinc-900 truncate m-0">{product.name}</h4>
            <span className="text-sm font-extrabold text-zinc-950 block">
              {Number(product.price).toLocaleString('ar-DZ')} دج
            </span>
          </div>
        </div>

        <button
          onClick={onBuyClick}
          className="px-4 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-extrabold hover:bg-zinc-800 shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <span>اشتري الآن</span>
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  );
}
