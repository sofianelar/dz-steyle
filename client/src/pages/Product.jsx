import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';
import { useSettings } from '../lib/useSettings';
import { WILAYAS } from '../lib/wilayas';
import { submitOrder } from '../lib/submitOrder';
import ProductCard from '../components/ProductCard';
import SizeGuideModal from '../components/SizeGuideModal';
import StickyMobileBar from '../components/StickyMobileBar';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { Alert, Button, Spinner, Card } from '@heroui/react';
import ButtonLink from '../components/ButtonLink';
import {
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Truck,
  ShieldCheck,
  Minus,
  Plus,
  ImageOff,
  Ruler,
  Flame,
  Zap,
  MapPin,
  User,
  Phone,
  Clock,
} from 'lucide-react';

const SEL = '*, product_images(*), product_variants(*)';

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const settings = useSettings();
  const orderKey = useRef(crypto.randomUUID());
  const expressFormRef = useRef(null);

  const [p, setP] = useState(null);
  const [rel, setRel] = useState([]);
  const [state, setState] = useState('loading');
  const [img, setImg] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Express Checkout Form States
  const [form, setForm] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    notes: '',
  });
  const [fees, setFees] = useState({});
  const [freeThreshold, setFreeThreshold] = useState(Infinity);
  const [busyOrder, setBusyOrder] = useState(false);
  const [orderErr, setOrderErr] = useState('');
  const [orderDone, setOrderDone] = useState(null);

  useEffect(() => {
    setState('loading');
    setSize('');
    setColor('');
    setQty(1);
    setImg(0);
    setOrderDone(null);
    setOrderErr('');

    Promise.all([
      supabase.from('products').select(SEL).eq('id', id).eq('is_active', true).maybeSingle(),
      supabase.from('delivery_fees').select('*'),
      supabase.from('store_settings').select('*').eq('key', 'free_delivery_threshold'),
    ]).then(([productRes, feesRes, settingsRes]) => {
      const data = productRes.data;
      if (!data) return setState('missing');
      setP(data);
      setState('ok');

      // Auto-select first in-stock variant
      const available = (data.product_variants || []).filter(v => v.stock > 0);
      if (available.length > 0) {
        setSize(available[0].size);
        setColor(available[0].color);
      }

      // Delivery fees map
      const m = {};
      (feesRes.data || []).forEach(r => {
        m[r.wilaya] = +r.fee;
      });
      setFees(m);

      if (settingsRes.data?.[0]?.value) {
        setFreeThreshold(+settingsRes.data[0].value);
      }

      if (data.category_id) {
        supabase
          .from('products')
          .select(SEL)
          .eq('is_active', true)
          .eq('category_id', data.category_id)
          .neq('id', id)
          .limit(4)
          .then(r => setRel(r.data || []));
      }
    });
  }, [id]);

  if (state === 'loading') {
    return (
      <div className="app-container flex flex-col items-center justify-center py-28 gap-3">
        <Spinner aria-label="جار التحميل" />
        <p className="text-sm text-zinc-500 font-medium">جاري تجهيز تفاصيل المنتج...</p>
      </div>
    );
  }

  if (state === 'missing' || !p) {
    return (
      <section className="app-container py-16 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-zinc-200">
          <p className="text-lg font-bold text-zinc-800 mb-4">هذا المنتج غير متوفر حالياً.</p>
          <ButtonLink to="/" className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800">
            العودة لكتالوج المنتجات
          </ButtonLink>
        </div>
      </section>
    );
  }

  const imgs = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const vs = (p.product_variants || []).filter(v => v.stock > 0);
  const sizes = [...new Set(vs.map(v => v.size))];
  const colors = [...new Set(vs.filter(v => v.size === size).map(v => v.color))];
  const currentVariant = vs.find(x => x.size === size && x.color === color);

  const discountPercent =
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  const productTotal = p.price * qty;
  const isFreeDelivery = productTotal >= freeThreshold;
  const deliveryFee = !form.wilaya ? null : isFreeDelivery ? 0 : fees[form.wilaya] ?? 600;
  const orderGrandTotal = deliveryFee === null ? productTotal : productTotal + deliveryFee;

  // Add to cart drawer
  const handleAddToCart = () => {
    if (!currentVariant) return;
    add(
      {
        variant_id: currentVariant.id,
        name: p.name,
        size,
        color,
        price: p.price,
        stock: currentVariant.stock,
        quantity: qty,
      },
      true // opens cart drawer
    );
  };

  // 1-Click Express Checkout Submit
  const handleExpressOrder = async e => {
    e.preventDefault();
    if (!currentVariant) {
      alert('يرجى تحديد المقاس واللون أولاً');
      return;
    }
    if (!/^0[567]\d{8}$/.test(form.phone.trim())) {
      return setOrderErr('يرجى إدخال رقم هاتف جزائري صالح (10 أرقام تبدأ بـ 05 أو 06 أو 07)');
    }
    if (!form.wilaya) {
      return setOrderErr('يرجى اختيار ولاية التوصيل');
    }

    setBusyOrder(true);
    setOrderErr('');

    try {
      const orderPayload = [
        {
          variant_id: currentVariant.id,
          quantity: qty,
        },
      ];
      const res = await submitOrder(form, orderPayload, orderKey.current);
      setOrderDone(res);
      window.open(res.whatsappUrl, '_blank', 'noopener');
    } catch (err) {
      setOrderErr(err.message || 'حدث خطأ أثناء تسجيل طلبك');
    } finally {
      setBusyOrder(false);
    }
  };

  const scrollToExpressForm = () => {
    expressFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const directWhatsAppChat = () => {
    const waNumber = settings.whatsapp || '213796006953';
    const text = `السلام عليكم، أرغب في الاستفسار عن هذا المنتج:\n\n*المنتج:* ${p.name}\n*المقاس:* ${size || 'غير محدد'}\n*اللون:* ${color || 'غير محدد'}\n*السعر:* ${p.price} دج\n\nهل المنتج متوفر للشحن؟`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="app-container">
      {/* Back button */}
      <button
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 mb-6 cursor-pointer transition-colors"
      >
        <ArrowRight size={15} />
        <span>العودة للمنتجات</span>
      </button>

      <div className="pdp-grid">
        {/* Gallery Column */}
        <div>
          <div className="relative sticky top-24">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
              {imgs[img] ? (
                <img
                  src={imgs[img].url}
                  alt={p.name}
                  className="w-full aspect-[3/4] object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full aspect-[3/4] flex flex-col items-center justify-center text-zinc-400">
                  <ImageOff size={48} />
                  <span className="text-sm mt-2">لا توجد صورة</span>
                </div>
              )}

              {discountPercent && (
                <span className="absolute top-3.5 right-3.5 bg-red-600 text-white font-extrabold text-sm px-3 py-1 rounded-lg shadow-lg">
                  خصم {discountPercent}%
                </span>
              )}
            </div>

            {imgs.length > 1 && (
              <div className="pdp-thumbnails">
                {imgs.map((item, index) => (
                  <img
                    key={item.id}
                    src={item.url}
                    alt=""
                    className={`pdp-thumb ${index === img ? 'active' : ''}`}
                    onClick={() => setImg(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Details & Express Order Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700">
              أصلي 100%
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              الدفع عند الاستلام عبر 58 ولاية
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 leading-tight">
            {p.name}
          </h1>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 my-3">
            <span className="text-3xl sm:text-4xl font-black text-zinc-950">
              {Number(p.price).toLocaleString('ar-DZ')} دج
            </span>
            {p.original_price && p.original_price > p.price && (
              <span className="text-lg text-zinc-400 line-through">
                {Number(p.original_price).toLocaleString('ar-DZ')} دج
              </span>
            )}
          </div>

          {p.description && (
            <p className="text-sm text-zinc-600 leading-relaxed my-2 whitespace-pre-line border-y border-zinc-100 py-3">
              {p.description}
            </p>
          )}

          {!vs.length ? (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 font-bold text-sm my-4 border border-red-200">
              نأسف، لقد نفذت جميع كميات هذا المنتج حالياً.
            </div>
          ) : (
            <>
              {/* Size Selector + Size Guide Link */}
              {sizes.length > 0 && (
                <div className="pdp-options-group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-zinc-800">
                      المقاس: <b className="text-zinc-950 text-sm">{size || 'اختر مقاسك'}</b>
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(true)}
                      className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 font-bold cursor-pointer transition-colors"
                    >
                      <Ruler size={13} />
                      <span>دليل المقاسات</span>
                    </button>
                  </div>

                  <div className="pdp-options-buttons">
                    {sizes.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`min-w-[50px] px-4 py-2.5 rounded-xl text-sm font-extrabold border transition-all cursor-pointer ${
                          s === size
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-105'
                            : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
                        }`}
                        onClick={() => {
                          setSize(s);
                          setQty(1);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {size && colors.length > 0 && (
                <div className="pdp-options-group">
                  <span className="text-xs font-extrabold text-zinc-800 block mb-2">
                    اللون: <b className="text-zinc-950 text-sm">{color || 'اختر اللون'}</b>
                  </span>
                  <div className="pdp-options-buttons">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                          c === color
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-105'
                            : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
                        }`}
                        onClick={() => {
                          setColor(c);
                          setQty(1);
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency Stock Warning */}
              {currentVariant && currentVariant.stock <= 5 && (
                <div className="my-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                  <Flame size={15} className="text-amber-600 animate-pulse" />
                  <span>سارع بالطلب! لم يتبق سوى {currentVariant.stock} قطع فقط من هذا الخيار</span>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="pdp-options-group">
                <span className="text-xs font-extrabold text-zinc-800 block mb-2">الكمية</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-zinc-300 rounded-xl bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      className="px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-30 cursor-pointer"
                      disabled={qty <= 1}
                      onClick={() => setQty(Math.max(1, qty - 1))}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-10 text-center font-bold text-zinc-900 text-sm">
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-30 cursor-pointer"
                      disabled={!currentVariant || qty >= currentVariant.stock}
                      onClick={() => setQty(Math.min(currentVariant?.stock || 1, qty + 1))}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <span className="text-sm font-extrabold text-zinc-950">
                    الإجمالي: {Number(productTotal).toLocaleString('ar-DZ')} دج
                  </span>
                </div>
              </div>

              {/* Standard Dual Actions: Add to Cart Drawer + Quick WhatsApp */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-950 text-zinc-950 font-bold text-sm hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  isDisabled={!currentVariant}
                  onPress={handleAddToCart}
                >
                  <ShoppingBag size={17} />
                  <span>أضف إلى السلة</span>
                </Button>

                <Button
                  className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  onPress={directWhatsAppChat}
                  title="استفسر عبر واتساب"
                >
                  <PhoneCall size={16} />
                  <span className="hidden sm:inline">واتساب</span>
                </Button>
              </div>

              {/* 🌟 1-CLICK EXPRESS CHECKOUT FORM (On-Page COD) 🌟 */}
              <div ref={expressFormRef} className="mt-8 scroll-mt-20">
                <Card className="p-5 sm:p-6 rounded-2xl border-2 border-zinc-950 bg-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-zinc-100">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0">
                      <Zap size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-zinc-950 m-0 leading-tight">
                        الشراء المباشر السريع (الدفع عند الاستلام)
                      </h3>
                      <p className="text-xs text-zinc-500 m-0 mt-0.5">
                        املأ بياناتك أدناه واضغط لتأكيد طلبك مباشرة دون الحاجة للتسجيل
                      </p>
                    </div>
                  </div>

                  {orderDone ? (
                    <div className="p-6 text-center animate-scale-up">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-lg font-black text-zinc-900 mb-1">
                        تم تسجيل طلبك بنجاح!
                      </h4>
                      <p className="text-xs text-zinc-500 mb-4">
                        رقم الطلب: <b className="font-mono text-zinc-900">{orderDone.order.reference}</b>
                        <br />
                        سنتصل بك على الرقم <b>{orderDone.order.phone}</b> لتأكيد الشحن.
                      </p>
                      <Button
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                        onPress={() => window.open(orderDone.whatsappUrl, '_blank', 'noopener')}
                      >
                        <PhoneCall size={15} />
                        <span>فتح تفاصيل الطلب في واتساب</span>
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleExpressOrder} className="flex flex-col gap-3 mt-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                          <User size={13} className="text-zinc-500" />
                          <span>الاسم الكامل *</span>
                        </label>
                        <InputField
                          required
                          placeholder="الاسم واللقب"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                          <Phone size={13} className="text-zinc-500" />
                          <span>رقم الهاتف (لتأكيد الطلب) *</span>
                        </label>
                        <InputField
                          required
                          inputMode="tel"
                          maxLength="10"
                          placeholder="مثال: 0555123456"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <SelectField
                            label="الولاية *"
                            isRequired
                            value={form.wilaya}
                            onChange={val => setForm({ ...form, wilaya: val })}
                            placeholder="اختر ولايتك"
                            options={WILAYAS.map(w => ({ value: w, label: w }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            البلدية *
                          </label>
                          <InputField
                            required
                            placeholder="اسم البلدية"
                            value={form.commune}
                            onChange={e => setForm({ ...form, commune: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                          <MapPin size={13} className="text-zinc-500" />
                          <span>العنوان بالتفصيل *</span>
                        </label>
                        <InputField
                          required
                          placeholder="الحي، رقم الباب، أو معلم قريب"
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                      </div>

                      {/* Live Price Calculator */}
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs flex flex-col gap-1.5 my-1">
                        <div className="flex justify-between text-zinc-600">
                          <span>سعر المنتج ({qty} قطع):</span>
                          <span className="font-bold text-zinc-900">
                            {Number(productTotal).toLocaleString('ar-DZ')} دج
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-600">
                          <span>سعر التوصيل:</span>
                          <span>
                            {deliveryFee === null ? (
                              <span className="text-amber-700 font-bold">اختر الولاية لتحديد السعر</span>
                            ) : deliveryFee === 0 ? (
                              <span className="text-emerald-700 font-bold">مجاني!</span>
                            ) : (
                              <span className="font-bold text-zinc-900">{deliveryFee} دج</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-zinc-950 pt-2 border-t border-zinc-200">
                          <span>المجموع النهائي:</span>
                          <span className="text-base font-black text-emerald-800">
                            {Number(orderGrandTotal).toLocaleString('ar-DZ')} دج
                          </span>
                        </div>
                      </div>

                      {orderErr && (
                        <Alert className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
                          {orderErr}
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                        isDisabled={busyOrder || !currentVariant}
                      >
                        {busyOrder ? (
                          <>
                            <Spinner size="sm" />
                            <span>جاري تسجيل طلبك...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={16} className="text-amber-400 fill-amber-400" />
                            <span>اضغط هنا لتأكيد طلبك والدفع عند الاستلام</span>
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>معاينة قبل الدفع</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck size={13} className="text-zinc-600" />
                          <span>توصيل سريع</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-zinc-600" />
                          <span>تأكيد هاتفي فوري</span>
                        </span>
                      </div>
                    </form>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Related Products */}
      {rel.length > 0 && (
        <div className="mt-16 pt-8 border-t border-zinc-200">
          <h2 className="text-xl font-black text-zinc-900 mb-6">منتجات مشابهة قد تعجبك</h2>
          <div className="products-grid">
            {rel.map(r => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />

      {/* Sticky Mobile Buy Bar */}
      <StickyMobileBar product={p} onBuyClick={scrollToExpressForm} />
    </section>
  );
}
