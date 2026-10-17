import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WILAYAS } from '../lib/wilayas';
const DEFAULT_FEE = 600;
export default function Settings() {
  const [fees, setFees] = useState({}); const [free, setFree] = useState(''); const [wa, setWa] = useState('');
  const [all, setAll] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { (async () => {
    const [f, s] = await Promise.all([supabase.from('delivery_fees').select('*'), supabase.from('store_settings').select('*')]);
    const m = {}; (f.data || []).forEach(r => { m[r.wilaya] = r.fee; }); setFees(m);
    (s.data || []).forEach(r => {
      if (r.key === 'free_delivery_threshold') setFree(String(r.value));
      if (r.key === 'whatsapp') setWa(String(r.value));
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
    ]);
    setMsg(a.error || b.error ? 'خطأ: ' + (a.error || b.error).message : 'تم الحفظ');
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
    <h3>سعر التوصيل لكل ولاية (دج)</h3>
    <div className="grid">{WILAYAS.map(w => <label key={w} className="row"><span>{w}</span>
      <input type="number" min="0" value={get(w)} onChange={e => setFees({ ...fees, [w]: e.target.value })}/></label>)}</div>
    <button className="btn" onClick={save}>حفظ الإعدادات</button> {msg && <span>{msg}</span>}
  </div>);
}
