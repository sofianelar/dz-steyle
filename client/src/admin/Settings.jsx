import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WILAYAS } from '../lib/wilayas';
const DEFAULT_FEE = 600;
const SITE_KEYS = ['announcement', 'hero_title', 'hero_subtitle', 'hero_button', 'hero_image'];
export default function Settings() {
  const [fees, setFees] = useState({}); const [free, setFree] = useState(''); const [wa, setWa] = useState('');
  const [site, setSite] = useState({}); const [all, setAll] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { (async () => {
    const [f, s] = await Promise.all([supabase.from('delivery_fees').select('*'), supabase.from('store_settings').select('*')]);
    const m = {}; (f.data || []).forEach(r => { m[r.wilaya] = r.fee; }); setFees(m);
    (s.data || []).forEach(r => {
      if (r.key === 'free_delivery_threshold') setFree(String(r.value));
      if (r.key === 'whatsapp') setWa(String(r.value));
      if (SITE_KEYS.includes(r.key)) setSite(p => ({ ...p, [r.key]: r.value }));
    });
  })(); }, []);
  const get = w => fees[w] ?? DEFAULT_FEE;
  const applyAll = () => { if (all === '' || +all < 0) return; const m = {}; WILAYAS.forEach(w => { m[w] = +all; }); setFees(m); };
  async function save() {
    setMsg('...');
    const rows = WILAYAS.map(w => ({ wilaya: w, fee: +get(w) }));
    const a = await supabase.from('delivery_fees').upsert(rows);
    const b = await supabase.from('store_settings').upsert([
      { key: 'free_delivery_threshold', value: free === '' ? 1e9 : +free },
      { key: 'whatsapp', value: wa.replace(/\D/g, '') },
      ...SITE_KEYS.map(k => ({ key: k, value: site[k] ?? '' })),
    ]);
    setMsg(a.error || b.error ? 'خطأ: ' + (a.error || b.error).message : 'تم الحفظ');
  }
  const setS = k => e => setSite({ ...site, [k]: e.target.value });
  async function uploadHero(e) {
    const file = e.target.files[0]; if (!file) return;
    const path = `site/hero-${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
    const up = await supabase.storage.from('product-images').upload(path, file);
    if (up.error) return setMsg('خطأ رفع الصورة: ' + up.error.message);
    setSite({ ...site, hero_image: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl });
  }
  return (<div>
    <h2>الإعدادات</h2>
    <div className="form">
      <label>رقم واتساب (بصيغة دولية بدون +، مثال 213796006953)</label>
      <input value={wa} onChange={e => setWa(e.target.value)} inputMode="numeric"/>
      <label>التوصيل مجاني عند مجموع (دج) — اتركه فارغا لإلغائه</label>
      <input type="number" min="0" value={free} onChange={e => setFree(e.target.value)}/>
      <label>سعر موحد لكل الولايات (ثم عدّل ما تريد)</label>
      <div className="bar"><input type="number" min="0" value={all} onChange={e => setAll(e.target.value)}/><button type="button" onClick={applyAll}>تطبيق على الكل</button></div>
    </div>
    <h3>الصفحة الرئيسية</h3>
    <div className="form">
      <label>شريط الإعلان (اتركه فارغا لإخفائه)</label>
      <input value={site.announcement || ''} onChange={setS('announcement')} maxLength="150"/>
      <label>عنوان الهيرو</label><input value={site.hero_title || ''} onChange={setS('hero_title')} maxLength="80"/>
      <label>نص تحت العنوان</label><input value={site.hero_subtitle || ''} onChange={setS('hero_subtitle')} maxLength="150"/>
      <label>نص الزر</label><input value={site.hero_button || ''} onChange={setS('hero_button')} maxLength="30"/>
      <label>صورة الهيرو</label><input type="file" accept="image/*" onChange={uploadHero}/>
      {site.hero_image && <img src={site.hero_image} alt="" width="160"/>}
    </div>
    <h3>سعر التوصيل لكل ولاية (دج)</h3>
    <div className="grid">{WILAYAS.map(w => <label key={w} className="row"><span>{w}</span>
      <input type="number" min="0" value={get(w)} onChange={e => setFees({ ...fees, [w]: e.target.value })}/></label>)}</div>
    <button className="btn" onClick={save}>حفظ الإعدادات</button> {msg && <span>{msg}</span>}
  </div>);
}
