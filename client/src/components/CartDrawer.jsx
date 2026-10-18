import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';
import { Button } from '@heroui/react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function CartDrawer() {
  const { items, isOpen, closeCart, setQty, remove, subtotal } = useCart();
  const navigate = useNavigate();
  const [freeThreshold, setFreeThreshold] = useState(10000);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'free_delivery_threshold')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && !isNaN(+data.value)) {
          setFreeThreshold(+data.value);
        }
      });
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape' && isOpen) closeCart();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const isFree = subtotal >= freeThreshold;
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-zinc-900" />
              <h2 className="text-lg font-black text-zinc-900 m-0">سلة التسوق</h2>
              <span className="text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              aria-label="إغلاق السلة"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 text-xs text-zinc-800">
            <div className="flex items-center gap-2 mb-2 font-bold">
              <Truck size={16} className="text-amber-600 shrink-0" />
              {isFree ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>تهانينا! لقد حصلت على <b>توصيل مجاني</b> لطلبك!</span>
                </span>
              ) : (
                <span>
                  أضف <b className="text-amber-800">{remainingForFree.toLocaleString('ar-DZ')} دج</b> إضافية واستفد من <b>التوصيل المجاني</b>!
                </span>
              )}
            </div>

            <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFree ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-zinc-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-300 mb-3">
                  <ShoppingBag size={32} />
                </div>
                <h3 className="text-base font-bold text-zinc-700 m-0">السلة فارغة حالياً</h3>
                <p className="text-xs text-zinc-400 mt-1 mb-5">
                  تصفح تشكيلتنا المميزة واختر قطعك المفضلة!
                </p>
                <Button
                  className="px-6 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  onPress={closeCart}
                >
                  استكشف التشكيلة
                </Button>
              </div>
            ) : (
              items.map(i => (
                <div key={i.variant_id} className="py-3.5 first:pt-0 last:pb-0 flex gap-3">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm m-0 leading-snug">{i.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-zinc-500">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">
                          {i.size}
                        </span>
                        <span>/</span>
                        <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">
                          {i.color}
                        </span>
                        <span className="text-zinc-400 mr-2">
                          ({Number(i.price).toLocaleString('ar-DZ')} دج)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
                        <button
                          className="px-2 py-1 text-zinc-500 hover:bg-zinc-200 transition-colors disabled:opacity-30 cursor-pointer"
                          disabled={i.quantity <= 1}
                          onClick={() => setQty(i.variant_id, i.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-zinc-800">
                          {i.quantity}
                        </span>
                        <button
                          className="px-2 py-1 text-zinc-500 hover:bg-zinc-200 transition-colors disabled:opacity-30 cursor-pointer"
                          disabled={i.quantity >= i.stock}
                          onClick={() => setQty(i.variant_id, i.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-zinc-950">
                          {Number(i.price * i.quantity).toLocaleString('ar-DZ')} دج
                        </span>

                        <button
                          onClick={() => remove(i.variant_id)}
                          className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50/60 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-medium">المجموع الفرعي:</span>
                <span className="font-black text-xl text-zinc-950">
                  {Number(subtotal).toLocaleString('ar-DZ')} دج
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-white p-2 rounded-lg border border-zinc-200">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>الدفع نقداً عند استلام الطرد ومعاينته عبر 58 ولاية</span>
              </div>

              <Button
                className="w-full py-3.5 rounded-xl bg-zinc-950 text-white font-extrabold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                onPress={handleCheckout}
              >
                <span>متابعة إتمام الطلب</span>
                <ArrowRight size={16} />
              </Button>

              <button
                onClick={closeCart}
                className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 py-1 cursor-pointer transition-colors"
              >
                متابعة التسوق وإضافة المزيد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
