import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Orders from './Orders';
import Products from './Products';
import Settings from './Settings';
import { Alert, Button, Spinner, Card } from '@heroui/react';
import InputField from '../components/InputField';
import { ShieldCheck, LogOut, ExternalLink, Package, ShoppingCart, Sliders } from 'lucide-react';

export default function AdminApp() {
  const [state, setState] = useState('loading'); // loading | out | denied | ok
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  async function check() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return setState('out');
    const { data } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    setState(data ? 'ok' : 'denied');
  }

  useEffect(() => {
    check();
  }, []);

  async function login(e) {
    e.preventDefault();
    setErr('');
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(f);
      if (error) {
        setErr('بيانات الدخول غير صحيحة، يرجى التحقق من البريد وكلمة المرور');
      } else {
        await check();
      }
    } catch {
      setErr('حدث خطأ في الاتصال');
    } finally {
      setLoggingIn(false);
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-3">
        <Spinner aria-label="جار التحقق من الصلاحيات" />
        <p className="text-sm text-zinc-400">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (state !== 'ok') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400 mb-3">
              <ShieldCheck size={26} />
            </div>
            <h1 className="text-xl font-bold text-white m-0">لوحة تحكم STAYEL DZ</h1>
            <p className="text-xs text-zinc-400 mt-1">سجل الدخول بحساب المسؤول للمتابعة</p>
          </div>

          {state === 'denied' && (
            <Alert className="mb-4 p-3 rounded-xl bg-red-900/50 text-red-200 border border-red-800 text-xs text-right">
              هذا الحساب ليس لديه صلاحيات الدخول للوحة التحكم.
            </Alert>
          )}

          <form onSubmit={login} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1 text-right">
                البريد الإلكتروني
              </label>
              <InputField
                type="email"
                required
                placeholder="admin@stayel.dz"
                value={f.email}
                onChange={e => setF({ ...f, email: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1 text-right">
                كلمة المرور
              </label>
              <InputField
                type="password"
                required
                placeholder="••••••••"
                value={f.password}
                onChange={e => setF({ ...f, password: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white"
              />
            </div>

            {err && (
              <Alert className="p-3 rounded-xl bg-red-900/40 text-red-300 border border-red-800 text-xs text-right">
                {err}
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-all cursor-pointer mt-2"
              isDisabled={loggingIn}
            >
              {loggingIn ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1">
              <span>العودة لمتجر STAYEL DZ</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Admin Navbar */}
      <nav className="admin-navbar">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-lg tracking-wider">STAYEL</span>
            <span className="bg-amber-500 text-zinc-950 text-xs font-black px-2 py-0.5 rounded">
              لوحة الإدارة
            </span>
          </div>

          <div className="admin-nav-links">
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => `admin-nav-item flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
            >
              <ShoppingCart size={15} />
              <span>الطلبات</span>
            </NavLink>

            <NavLink
              to="/admin/products"
              className={({ isActive }) => `admin-nav-item flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
            >
              <Package size={15} />
              <span>المنتجات</span>
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-nav-item flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
            >
              <Sliders size={15} />
              <span>الإعدادات</span>
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
          >
            <span>زيارة المتجر</span>
            <ExternalLink size={13} />
          </Link>

          <Button
            className="text-xs text-red-400 hover:text-white hover:bg-red-900/50 px-3 py-1.5 rounded-lg border border-red-900/40 flex items-center gap-1 cursor-pointer transition-colors"
            onPress={async () => {
              await supabase.auth.signOut();
              setState('out');
            }}
          >
            <LogOut size={13} />
            <span>خروج</span>
          </Button>
        </div>
      </nav>

      {/* Admin Content Area */}
      <div className="app-container">
        <Routes>
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="orders" replace />} />
        </Routes>
      </div>
    </div>
  );
}
