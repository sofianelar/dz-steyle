import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import { Alert, Button, Spinner } from '@heroui/react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { Search, SlidersHorizontal, RotateCcw, Sparkles, PackageSearch, X } from 'lucide-react';
import { useSearch } from '../lib/search';

export default function Home() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const { q, setQ } = useSearch();
  const [cat, setCat] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('new');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
      .then(([productsRes, catsRes]) => {
        if (productsRes.error) {
          setErr('تعذر تحميل المنتجات');
        } else {
          setList(productsRes.data || []);
        }
        if (catsRes.data) {
          setCats(catsRes.data);
        }
      })
      .catch(() => setErr('حدث خطأ في الاتصال'))
      .finally(() => setLoading(false));
  }, []);

  const sizes = useMemo(
    () => [...new Set(list.flatMap(p => (p.product_variants || []).map(v => v.size)))].filter(Boolean),
    [list]
  );
  const colors = useMemo(
    () => [...new Set(list.flatMap(p => (p.product_variants || []).map(v => v.color)))].filter(Boolean),
    [list]
  );

  const shown = useMemo(() => {
    let r = list.filter(p => {
      const matchQuery = !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase());
      const matchCat = !cat || p.category_id === cat;
      const matchMin = !min || p.price >= +min;
      const matchMax = !max || p.price <= +max;
      const matchVariant =
        (!size && !color) ||
        (p.product_variants || []).some(
          v => v.stock > 0 && (!size || v.size === size) && (!color || v.color === color)
        );
      return matchQuery && matchCat && matchMin && matchMax && matchVariant;
    });

    if (sort === 'low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'high') r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [list, q, cat, size, color, min, max, sort]);

  const reset = () => {
    setQ('');
    setCat('');
    setSize('');
    setColor('');
    setMin('');
    setMax('');
    setSort('new');
  };

  const newArrivals = useMemo(() => list.slice(0, 4), [list]);

  return (
    <>
      <Hero />

      <section className="app-container">
        {/* Mobile Search Bar - shown only on mobile, above categories */}
        <div className="mobile-search-bar">
          <div className="relative">
            <Search
              size={17}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              id="mobile-search-input"
              type="text"
              className="mobile-search-input"
              placeholder="ابحث عن منتج..."
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="بحث عن منتج"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer transition-colors"
                aria-label="مسح البحث"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Categories Section */}
        {cats.length > 0 && (
          <div className="cats-section">
            <div className="cats-header">
              <h2 className="cats-title">تسوق حسب التصنيف</h2>
              <span className="cats-subtitle">{cats.length} تصنيف متاح</span>
            </div>
            <div className="cats-row">
              {/* All chip */}
              <button
                className={`cat-chip ${!cat ? 'cat-chip--active' : ''}`}
                onClick={() => {
                  setCat('');
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="cat-chip-label">الكل</span>
                <span className="cat-chip-count">{list.length}</span>
              </button>

              {cats.map((c, idx) => {
                const count = list.filter(p => p.category_id === c.id).length;
                return (
                  <button
                    key={c.id}
                    className={`cat-chip ${cat === c.id ? 'cat-chip--active' : ''}`}
                    onClick={() => {
                      setCat(c.id);
                      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span className="cat-chip-label">{c.name}</span>
                    <span className="cat-chip-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured / New Arrivals */}
        {!cat && !q && newArrivals.length > 0 && (
          <div className="mb-12">
            <h2 className="section-title">
              <Sparkles size={20} className="text-amber-500" />
              <span>وصل حديثاً</span>
            </h2>
            <div className="products-grid">
              {newArrivals.map(p => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}

        {/* All Products Catalog with Filters */}
        <div id="products" className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-zinc-900 m-0 flex items-center gap-2">
              <SlidersHorizontal size={20} />
              <span>كتالوج المنتجات</span>
              <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                {shown.length} منتج
              </span>
            </h2>
          </div>

          {/* Search & Filter Bar */}
          <div className="filter-toolbar">
            {/* Search Input - hidden on desktop (search is in header), shown on mobile */}
            <div className="filter-search-mobile relative">
              <Search
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <InputField
                className="pr-11 pl-10 h-12 text-sm bg-zinc-50/50 hover:bg-white focus:bg-white"
                placeholder="ابحث بالاسم، الموديل، أو الكلمة المفتاحية..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer transition-colors"
                  aria-label="مسح البحث"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 items-end">
              <div>
                <SelectField
                  label="المقاس"
                  value={size}
                  onChange={setSize}
                  placeholder="كل المقاسات"
                  options={sizes.map(s => ({ value: s, label: s }))}
                />
              </div>

              <div>
                <SelectField
                  label="اللون"
                  value={color}
                  onChange={setColor}
                  placeholder="كل الألوان"
                  options={colors.map(s => ({ value: s, label: s }))}
                />
              </div>

              <div>
                <InputField
                  label="السعر الأدنى"
                  type="number"
                  min="0"
                  placeholder="من (دج)"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                />
              </div>

              <div>
                <InputField
                  label="السعر الأقصى"
                  type="number"
                  min="0"
                  placeholder="إلى (دج)"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                />
              </div>

              <div>
                <SelectField
                  label="الترتيب"
                  value={sort}
                  onChange={setSort}
                  placeholder="الأحدث"
                  options={[
                    { value: 'new', label: 'الأحدث أولاً' },
                    { value: 'low', label: 'السعر: من الأقل للأعلى' },
                    { value: 'high', label: 'السعر: من الأعلى للأقل' },
                  ]}
                />
              </div>

              <div className="flex flex-col justify-end w-full col-span-2 sm:col-span-1">
                <span className="block text-xs font-bold text-transparent mb-1.5 select-none hidden lg:block">
                  إجراء
                </span>
                <Button
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 active:scale-95 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  onPress={reset}
                >
                  <RotateCcw size={14} />
                  <span>إعادة ضبط الفلاتر</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {err && (
            <Alert className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
              {err}
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Spinner aria-label="جار التحميل" />
              <p className="text-sm text-zinc-500">جاري تحميل المنتجات...</p>
            </div>
          ) : shown.length > 0 ? (
            <div className="products-grid">
              {shown.map(p => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-zinc-200 rounded-2xl">
              <PackageSearch size={48} className="text-zinc-300 mb-3" />
              <h3 className="text-lg font-bold text-zinc-800 m-0">لا توجد منتجات مطابقة للبحث</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                جرب تغيير خيارات التصفية أو مسح معايير البحث للعثور على ما تبحث عنه.
              </p>
              <Button
                className="mt-4 px-5 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800"
                onPress={reset}
              >
                عرض كل المنتجات
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
