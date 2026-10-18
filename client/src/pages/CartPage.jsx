import { Button, Card } from '@heroui/react';
import ButtonLink from '../components/ButtonLink';
import { useCart } from '../lib/cart';
import { ShoppingBag, Trash2, ArrowLeft, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();

  if (!items.length) {
    return (
      <section className="app-container py-16 text-center">
        <div className="max-w-md mx-auto bg-white p-10 rounded-2xl border border-zinc-200 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">سلة مشترياتك فارغة</h2>
          <p className="text-sm text-zinc-500 mb-6">
            لم تقم بإضافة أي منتجات بعد. استكشف تشكيلتنا واختر ما يناسبك!
          </p>
          <ButtonLink
            to="/"
            className="w-full py-3 rounded-xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight size={16} />
            <span>ابدأ التسوق الآن</span>
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section className="app-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-zinc-900 m-0 flex items-center gap-2">
          <ShoppingBag size={24} />
          <span>سلة المشتريات</span>
          <span className="text-sm font-semibold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
            {items.length} {items.length === 1 ? 'منتج' : 'منتجات'}
          </span>
        </h1>

        <ButtonLink
          to="/"
          className="text-xs font-bold text-zinc-600 hover:text-zinc-950 flex items-center gap-1"
        >
          <span>متابعة التسوق</span>
          <ArrowLeft size={14} />
        </ButtonLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {items.map(i => (
            <Card
              key={i.variant_id}
              className="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 text-base m-0 mb-1">{i.name}</h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span className="bg-zinc-100 px-2 py-0.5 rounded">المقاس: {i.size}</span>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded">اللون: {i.color}</span>
                  <span>· {Number(i.price).toLocaleString('ar-DZ')} دج للقطعة</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
                  <Button
                    className="px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-200 transition-colors"
                    isDisabled={i.quantity <= 1}
                    onPress={() => setQty(i.variant_id, i.quantity - 1)}
                  >
                    <Minus size={13} />
                  </Button>
                  <span className="w-8 text-center text-xs font-bold text-zinc-800">
                    {i.quantity}
                  </span>
                  <Button
                    className="px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-200 transition-colors"
                    isDisabled={i.quantity >= i.stock}
                    onPress={() => setQty(i.variant_id, i.quantity + 1)}
                  >
                    <Plus size={13} />
                  </Button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <span className="font-extrabold text-zinc-950 text-base">
                    {Number(i.price * i.quantity).toLocaleString('ar-DZ')} دج
                  </span>
                </div>

                {/* Remove */}
                <Button
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  aria-label="حذف المنتج من السلة"
                  onPress={() => remove(i.variant_id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-zinc-900 pb-3 mb-4 border-b border-zinc-100">
              ملخص الطلب
            </h2>

            <div className="flex justify-between items-center text-sm text-zinc-600 mb-3">
              <span>المجموع الفرعي</span>
              <span className="font-bold text-zinc-900">{Number(subtotal).toLocaleString('ar-DZ')} دج</span>
            </div>

            <div className="flex justify-between items-center text-sm text-zinc-600 mb-4 pb-4 border-b border-zinc-100">
              <span>تكلفة التوصيل</span>
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                تُحسب بالخطوة التالية (حسب الولاية)
              </span>
            </div>

            <div className="flex justify-between items-center text-base font-extrabold text-zinc-950 mb-6">
              <span>المجموع الإجمالي</span>
              <span className="text-xl text-zinc-950">{Number(subtotal).toLocaleString('ar-DZ')} دج</span>
            </div>

            <ButtonLink
              to="/checkout"
              className="w-full py-3.5 rounded-xl bg-zinc-950 text-white font-bold text-center block hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-md mb-3"
            >
              متابعة إتمام الطلب
            </ButtonLink>

            <ButtonLink
              to="/"
              className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-semibold text-center block text-sm hover:bg-zinc-50 transition-colors"
            >
              متابعة التسوق
            </ButtonLink>
          </Card>
        </div>
      </div>
    </section>
  );
}
