import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Orders from './Orders';
import Products from './Products';
export default function AdminApp() {
  const [state, setState] = useState('loading'); // loading | out | denied | ok
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState('');
  async function check() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setState('out');
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
    setState(data ? 'ok' : 'denied');
  }
  useEffect(() => { check(); }, []);
  async function login(e) {
    e.preventDefault(); setErr('');
    const { error } = await supabase.auth.signInWithPassword(f);
    if (error) return setErr('بيانات الدخول غير صحيحة'); check();
  }
  if (state === 'loading') return <p className="wrap">...</p>;
  if (state !== 'ok') return (<section className="wrap" style={{ maxWidth: 380 }}>
    <h2>لوحة التحكم</h2>
    {state === 'denied' && <p className="out">هذا الحساب غير مخول بالدخول.</p>}
    <form onSubmit={login} className="form">
      <input type="email" required placeholder="البريد الإلكتروني" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/>
      <input type="password" required placeholder="كلمة المرور" value={f.password} onChange={e => setF({ ...f, password: e.target.value })}/>
      {err && <p className="out">{err}</p>}<button className="btn">دخول</button></form></section>);
  return (<div className="admin"><nav className="anav">
    <NavLink to="/admin/orders">الطلبات</NavLink><NavLink to="/admin/products">المنتجات</NavLink>
    <button onClick={async () => { await supabase.auth.signOut(); setState('out'); }}>خروج</button></nav>
    <div className="wrap"><Routes><Route path="orders" element={<Orders/>}/><Route path="products" element={<Products/>}/>
      <Route path="*" element={<Navigate to="orders" replace/>}/></Routes></div></div>);
}
