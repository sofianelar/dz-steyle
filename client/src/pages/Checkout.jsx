import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';
import { WILAYAS } from '../lib/wilayas';
import { submitOrder } from '../lib/submitOrder';
import { Alert, Button, Card, TextArea, Spinner } from '@heroui/react';
import ButtonLink from '../components/ButtonLink';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  PhoneCall,
  ShoppingBag,
  ArrowRight,
  MapPin,
  User,
  Phone,
  FileText,
} from 'lucide-react';

export default function Checkout() {
  const { items, clear, subtotal } = useCart();
  const key = useRef(crypto.randomUUID());
  const [f, setF] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [fees, setFees] = useState({});
  const [freeThreshold, setFreeThreshold] = useState(Infinity);

  useEffect(() => {
    (async () => {
      const [feesRes, settingsRes] = await Promise.all([
        supabase.from('delivery_fees').select('*'),
        supabase.from('store_settings').select('*').eq('key', 'free_delivery_threshold'),
      ]);
      const m = {};
      (feesRes.data || []).forEach(r => {
        m[r.wilaya] = +r.fee;
      });
      setFees(m);
      if (settingsRes.data?.[0]?.value) {
        setFreeThreshold(+settingsRes.data[0].value);
      }
    })();
  }, []);

  const isFreeDelivery = subtotal >= freeThreshold;
  const delivery = !f.wilaya ? null : isFreeDelivery ? 0 : fees[f.wilaya] ?? 600;
  const grandTotal = delivery === null ? subtotal : subtotal + delivery;

  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;

    if (!/^0[567]\d{8}$/.test(f.phone.trim())) {
      return setErr('يرجى إدخال رقم هاتف جزائري صالح يتكون من 10 أرقام (مثال: 0555123456)');
    }

    if (!f.wilaya) {
      return setErr('يرجى اختيار ولاية التوصيل');
    }

    setBusy(true);
    setErr('');

    try {
      const r = await submitOrder(
        f,
        items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })),
        key.current
      );
      clear();
      setDone(r);
      // Attempt opening WhatsApp in background
      window.open(r.whatsappUrl, '_blank', 'noopener');
    } catch (x) {
      setErr(x.message || 'حدث خطأ أثناء حفظ الطلب، يرجى المحاولة ثانية');
    } finally {
      setBusy(false);
    }
  }

  // Success view
  if (done) {
    return (
      <section className="app-container py-12 flex justify-center">
        <Card className="max-w-lg w-full p-8 rounded-2xl border border-zinc-200 bg-white text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl font-black text-zinc-900 mb-1">تم تأكيد طلبك بنجاح!</h2>
          <p className="text-sm text-zinc-500 mb-6">
            شكراً لثقتك بنا. سنقوم بالاتصال بك قريباً لتأكيد تفاصيل الشحن.
          </p>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-right mb-6 flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">رقم الطلب:</span>
              <span className="font-mono font-bold text-zinc-900">{done.order.reference}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">العميل:</span>
              <span className="font-bold text-zinc-900">{done.order.customer_name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">العنوان:</span>
              <span className="font-medium text-zinc-900">
                {done.order.wilaya} / {done.order.commune}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 text-base font-extrabold text-zinc-950">
              <span>المجموع النهائي:</span>
              <span>{Number(done.order.total).toLocaleString('ar-DZ')} دج</span>
            </div>
            <p className="text-xs text-emerald-700 font-semibold m-0 pt-1">
              * طريقة الدفع: الدفع عند الاستلام بعد فحص الطلب
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              onPress={() => window.open(done.whatsappUrl, '_blank', 'noopener,noreferrer')}
            >
              <PhoneCall size={18} />
              <span>إرسال تفاصيل الطلب عبر واتساب</span>
            </Button>

            <ButtonLink
              to="/"
              className="w-full py-3 rounded-xl border border-zinc-300 text-zinc-700 font-semibold text-sm hover:bg-zinc-50"
            >
              العودة إلى المتجر
            </ButtonLink>
          </div>
        </Card>
      </section>
    );
  }

  // Empty cart view
  if (!items.length) {
    return (
      <section className="app-container py-16 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-zinc-200">
          <p className="text-base font-bold text-zinc-800 mb-4">سلة المشتريات فارغة.</p>
          <ButtonLink
            to="/"
            className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800"
          >
            تصفح المنتجات
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section className="app-container">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-black text-zinc-900 m-0">إتمام الطلب</h1>
        <span className="text-xs text-zinc-500 font-medium bg-zinc-100 px-3 py-1 rounded-full">
          الدفع عند الاستلام
        </span>
      </div>

      <div className="checkout-grid">
        {/* Form Column */}
        <div>
          <Card className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2 pb-3 border-b border-zinc-100">
              <MapPin size={18} className="text-zinc-700" />
              <span>معلومات التوصيل والشحن</span>
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-zinc-500" />
                  <span>الاسم الكامل *</span>
                </label>
                <InputField
                  required
                  maxLength="80"
                  placeholder="مثال: محمد بن علي"
                  value={f.name}
                  onChange={set('name')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-zinc-500" />
                  <span>رقم الهاتف (لتأكيد الطلب والتوصيل) *</span>
                </label>
                <InputField
                  required
                  inputMode="tel"
                  maxLength="10"
                  placeholder="مثال: 0555123456"
                  value={f.phone}
                  onChange={set('phone')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SelectField
                    label="الولاية *"
                    isRequired
                    value={f.wilaya}
                    onChange={value => setF({ ...f, wilaya: value })}
                    placeholder="اختر ولايتك"
                    options={WILAYAS.map(w => ({ value: w, label: w }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    البلدية *
                  </label>
                  <InputField
                    required
                    maxLength="60"
                    placeholder="اسم البلدية"
                    value={f.commune}
                    onChange={set('commune')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  العنوان بالتفصيل (الحي، الشارع، رقم الباب أو معلم قريب) *
                </label>
                <InputField
                  required
                  maxLength="250"
                  placeholder="حي النور، عمارة 4، قرب المسجد الكبير"
                  value={f.address}
                  onChange={set('address')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-zinc-500" />
                  <span>ملاحظات إضافية للموصّل (اختياري)</span>
                </label>
                <TextArea
                  aria-label="ملاحظات (اختياري)"
                  maxLength="500"
                  placeholder="أي تعليمات إضافية تخص التوصيل أو أوقات الاستلام المناسبة..."
                  value={f.notes}
                  onChange={set('notes')}
                  className="w-full p-3 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:border-zinc-900"
                  rows={2}
                />
              </div>

              {err && (
                <Alert className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm">
                  {err}
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full py-4 rounded-xl bg-zinc-950 text-white font-bold text-base hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                isDisabled={busy}
              >
                {busy ? (
                  <>
                    <Spinner size="sm" />
                    <span>جاري تسجيل طلبك...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد وإرسال الطلب ({Number(grandTotal).toLocaleString('ar-DZ')} دج)</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div>
          <Card className="order-summary-box shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>ملخص السلة ({items.length})</span>
            </h2>

            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4 pr-1">
              {items.map(i => (
                <div key={i.variant_id} className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-50">
                  <div>
                    <h4 className="font-semibold text-zinc-900 m-0">{i.name}</h4>
                    <p className="text-xs text-zinc-500 m-0">
                      {i.size} / {i.color} × {i.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-zinc-800">
                    {Number(i.price * i.quantity).toLocaleString('ar-DZ')} دج
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 text-sm pt-2 border-t border-zinc-100">
              <div className="flex justify-between text-zinc-600">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold text-zinc-900">
                  {Number(subtotal).toLocaleString('ar-DZ')} دج
                </span>
              </div>

              <div className="flex justify-between text-zinc-600 items-center">
                <span>سعر التوصيل:</span>
                <span>
                  {delivery === null ? (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                      اختر الولاية أولاً
                    </span>
                  ) : delivery === 0 ? (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      مجاني!
                    </span>
                  ) : (
                    <span className="font-semibold text-zinc-900">{delivery} دج</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-zinc-950 pt-3 border-t border-zinc-200">
                <span>المجموع الكلي:</span>
                <span className="text-xl text-zinc-950">
                  {Number(grandTotal).toLocaleString('ar-DZ')} دج
                </span>
              </div>
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col gap-2 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-zinc-800 shrink-0" />
                <span>شحن مضمون عبر 58 ولاية</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
                <span>الدفع نقداً عند استلام الطرد وتفقده</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
