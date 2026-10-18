import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { WILAYAS } from '../lib/wilayas';
import { Alert, Button, Card, Spinner } from '@heroui/react';
import InputField from '../components/InputField';
import {
  Save,
  Sliders,
  PhoneCall,
  Truck,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Search,
} from 'lucide-react';

const DEFAULT_FEE = 600;
const SITE_KEYS = ['announcement', 'hero_title', 'hero_subtitle', 'hero_button', 'hero_image'];

export default function Settings() {
  const [fees, setFees] = useState({});
  const [free, setFree] = useState('');
  const [wa, setWa] = useState('');
  const [site, setSite] = useState({});
  const [all, setAll] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [f, s] = await Promise.all([
        supabase.from('delivery_fees').select('*'),
        supabase.from('store_settings').select('*'),
      ]);
      const m = {};
      (f.data || []).forEach(r => {
        m[r.wilaya] = r.fee;
      });
      setFees(m);
      (s.data || []).forEach(r => {
        if (r.key === 'free_delivery_threshold') setFree(String(r.value));
        if (r.key === 'whatsapp') setWa(String(r.value));
        if (SITE_KEYS.includes(r.key)) setSite(p => ({ ...p, [r.key]: r.value }));
      });
    })();
  }, []);

  const get = w => fees[w] ?? DEFAULT_FEE;

  const applyAll = () => {
    if (all === '' || +all < 0) return;
    const m = {};
    WILAYAS.forEach(w => {
      m[w] = +all;
    });
    setFees(m);
  };

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const rows = WILAYAS.map(w => ({ wilaya: w, fee: +get(w) }));
      const a = await supabase.from('delivery_fees').upsert(rows);
      const b = await supabase.from('store_settings').upsert([
        { key: 'free_delivery_threshold', value: free === '' ? 1e9 : +free },
        { key: 'whatsapp', value: wa.replace(/\D/g, '') },
        ...SITE_KEYS.map(k => ({ key: k, value: site[k] ?? '' })),
      ]);

      if (a.error || b.error) {
        setMsg('خطأ أثناء الحفظ: ' + (a.error || b.error).message);
      } else {
        setMsg('تم حفظ جميع الإعدادات بنجاح');
      }
    } catch (e) {
      setMsg('خطأ: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  const setS = k => e => setSite({ ...site, [k]: e.target.value });

  async function uploadHero(e) {
    const file = e.target.files[0];
    if (!file) return;
    const path = `site/hero-${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
    const up = await supabase.storage.from('product-images').upload(path, file);
    if (up.error) return setMsg('خطأ رفع الصورة: ' + up.error.message);
    setSite({
      ...site,
      hero_image: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl,
    });
  }

  const filteredWilayas = useMemo(() => {
    return WILAYAS.filter(w => !wilayaSearch.trim() || w.includes(wilayaSearch.trim()));
  }, [wilayaSearch]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 m-0 flex items-center gap-2">
            <Sliders size={24} />
            <span>إعدادات المتجر</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            التحكم في أرقام التواصل، عتبة التوصيل المجاني، واجهة الهيرو، وأسعار التوصيل لـ 58 ولاية
          </p>
        </div>

        <Button
          className="px-6 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
          isDisabled={saving}
          onPress={save}
        >
          {saving ? (
            <>
              <Spinner size="sm" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>حفظ الإعدادات</span>
            </>
          )}
        </Button>
      </div>

      {msg && (
        <Alert
          className={`p-4 rounded-xl border ${
            msg.includes('خطأ')
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span className="font-semibold text-sm">{msg}</span>
          </div>
        </Alert>
      )}

      {/* General Settings */}
      <Card className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
          <PhoneCall size={20} className="text-zinc-700" />
          <span>إعدادات التواصل والتوصيل المجاني</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              رقم الواتساب الرسمي (بصيغة دولية بدون +)
            </label>
            <InputField
              aria-label="رقم واتساب"
              placeholder="مثال: 213796006953"
              value={wa}
              onChange={e => setWa(e.target.value)}
              inputMode="numeric"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              يُستخدم لاستقبال إشعارات وتفاصيل الطلبات عبر رسائل واتساب المباشرة
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              حد التوصيل المجاني (دج) — اتركه فارغاً لإلغائه
            </label>
            <InputField
              aria-label="حد التوصيل المجاني بالدينار"
              type="number"
              min="0"
              placeholder="مثال: 10000"
              value={free}
              onChange={e => setFree(e.target.value)}
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              إذا بلغت قيمة مشتريات الزبون هذا الحد، يصبح سعر التوصيل 0 دج تلقائياً
            </span>
          </div>
        </div>
      </Card>

      {/* Hero & Announcement Settings */}
      <Card className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" />
          <span>تخصيص الواجهة الرئيسية (الهيرو والإعلانات)</span>
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              نص شريط الإعلان العلوي (اتركه فارغاً لإخفائه)
            </label>
            <InputField
              aria-label="نص شريط الإعلان"
              placeholder="توصيل مجاني للطلبات أكثر من 10,000 دج | الدفع عند الاستلام عبر 58 ولاية"
              value={site.announcement || ''}
              onChange={setS('announcement')}
              maxLength="150"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                عنوان الهيرو الرئيسي
              </label>
              <InputField
                aria-label="عنوان الهيرو"
                placeholder="STAYEL DZ"
                value={site.hero_title || ''}
                onChange={setS('hero_title')}
                maxLength="80"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                النص التوضيحي تحت العنوان
              </label>
              <InputField
                aria-label="نص تحت عنوان الهيرو"
                placeholder="ملابس رجالية بأسلوب عصري وأناقة تدوم"
                value={site.hero_subtitle || ''}
                onChange={setS('hero_subtitle')}
                maxLength="150"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                نص زر الدعوة للإجراء (CTA Button)
              </label>
              <InputField
                aria-label="نص زر الهيرو"
                placeholder="تسوق الآن"
                value={site.hero_button || ''}
                onChange={setS('hero_button')}
                maxLength="30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                صورة خلفية الهيرو
              </label>
              <InputField
                aria-label="صورة الهيرو"
                type="file"
                accept="image/*"
                onChange={uploadHero}
              />
            </div>
          </div>

          {site.hero_image && (
            <div className="pt-2">
              <span className="block text-xs font-bold text-zinc-500 mb-1.5">
                معاينة الصورة الحالية للهيرو:
              </span>
              <img
                src={site.hero_image}
                alt="معاينة الهيرو"
                className="w-full max-w-sm h-36 object-cover rounded-xl border border-zinc-200"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Delivery Fees per Wilaya */}
      <Card className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 mb-4">
          <h2 className="text-lg font-bold text-zinc-900 m-0 flex items-center gap-2">
            <Truck size={20} className="text-zinc-700" />
            <span>تسعيرة التوصيل لكل ولاية (دج)</span>
          </h2>

          <div className="flex items-center gap-2">
            <InputField
              aria-label="سعر موحد للتوصيل"
              type="number"
              min="0"
              placeholder="سعر موحد (دج)"
              value={all}
              onChange={e => setAll(e.target.value)}
              className="w-36"
            />
            <Button
              type="button"
              className="h-11 px-4 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 shrink-0 cursor-pointer shadow-xs"
              onPress={applyAll}
            >
              تطبيق على الكل
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative max-w-xs">
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <InputField
              className="pr-9"
              placeholder="ابحث عن ولاية معينة..."
              value={wilayaSearch}
              onChange={e => setWilayaSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1 border border-zinc-100 rounded-xl bg-zinc-50/50">
          {filteredWilayas.map(w => (
            <div
              key={w}
              className="p-2.5 rounded-xl bg-white border border-zinc-200 flex flex-col gap-1.5 shadow-xs"
            >
              <span className="text-xs font-bold text-zinc-800 truncate" title={w}>
                {w}
              </span>
              <InputField
                aria-label={`سعر توصيل ${w}`}
                type="number"
                min="0"
                value={get(w)}
                onChange={e => setFees({ ...fees, [w]: e.target.value })}
                className="text-xs py-1.5 px-2 text-center font-bold"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
