import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Alert, Button, Card, Checkbox, Spinner, TextArea } from '@heroui/react';
import SelectField from '../components/SelectField';
import InputField from '../components/InputField';
import {
  PackagePlus,
  Package,
  Search,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Check,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';

const empty = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  category_id: '',
  sizes: 'S, M, L, XL',
  colors: 'أسود',
  stock: 10,
};

export default function Products() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [f, setF] = useState(empty);
  const [newCat, setNewCat] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const load = async () => {
    const [p, c] = await Promise.all([
      supabase
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setList(p.data || []);
    setCats(c.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function addCat() {
    const name = newCat.trim();
    if (!name) return setMsg('يرجى كتابة اسم التصنيف أولاً');
    const { error } = await supabase
      .from('categories')
      .insert({ name, sort_order: cats.length });
    if (error) return setMsg('خطأ: ' + error.message);
    setNewCat('');
    setMsg('تمت إضافة التصنيف بنجاح: ' + name);
    load();
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const { data: p, error } = await supabase
        .from('products')
        .insert({
          name: f.name,
          description: f.description,
          price: +f.price,
          original_price: f.original_price ? +f.original_price : null,
          category_id: f.category_id || null,
        })
        .select()
        .single();
      if (error) throw error;

      const split = s =>
        s
          .split(',')
          .map(x => x.trim())
          .filter(Boolean);
      const variants = split(f.sizes).flatMap(size =>
        split(f.colors).map(color => ({
          product_id: p.id,
          size,
          color,
          stock: +f.stock,
        }))
      );
      const v = await supabase.from('product_variants').insert(variants);
      if (v.error) throw v.error;

      for (const [i, file] of [...files].entries()) {
        const path = `${p.id}/${Date.now()}-${i}-${file.name.replace(/[^\w.]/g, '_')}`;
        const up = await supabase.storage.from('product-images').upload(path, file);
        if (up.error) throw up.error;
        const url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        await supabase.from('product_images').insert({
          product_id: p.id,
          url,
          sort_order: i,
        });
      }

      setF(empty);
      setFiles([]);
      setMsg('تم حفظ المنتج بنجاح وأصبح متاحاً الآن في المتجر');
      setShowAddForm(false);
      load();
    } catch (x) {
      setMsg('خطأ أثناء الحفظ: ' + x.message);
    } finally {
      setBusy(false);
    }
  }

  const toggle = async (p, k) => {
    await supabase.from('products').update({ [k]: !p[k] }).eq('id', p.id);
    load();
  };

  async function del(p) {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${p.name}" نهائياً؟`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) alert(error.message);
    else load();
  }

  async function editPrice(p) {
    const v = prompt('أدخل السعر الجديد بالدينار الجزائري (دج):', p.price);
    if (!v || isNaN(+v)) return;
    await supabase.from('products').update({ price: +v }).eq('id', p.id);
    load();
  }

  async function editStock(vr) {
    const v = prompt(`تحديث كمية المخزون لـ (${vr.size} / ${vr.color}):`, vr.stock);
    if (v === null || isNaN(+v) || +v < 0) return;
    await supabase.from('product_variants').update({ stock: +v }).eq('id', vr.id);
    load();
  }

  const filteredList = useMemo(() => {
    return list.filter(p => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = !selectedCat || p.category_id === selectedCat;
      return matchSearch && matchCat;
    });
  }, [list, searchQuery, selectedCat]);

  return (
    <div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 m-0 flex items-center gap-2">
            <Package size={24} />
            <span>إدارة المنتجات</span>
            <span className="text-xs bg-zinc-100 text-zinc-700 font-bold px-2.5 py-1 rounded-full">
              {list.length} منتج
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            إضافة وتعديل المنتجات، الأسعار، صور العرض، وإدارة مخزون المقاسات والألوان
          </p>
        </div>

        <Button
          className="px-4 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <PackagePlus size={16} />
          <span>{showAddForm ? 'إخفاء نموذج الإضافة' : '+ إضافة منتج جديد'}</span>
        </Button>
      </div>

      {msg && (
        <Alert className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
          {msg}
        </Alert>
      )}

      {/* Add Product Form Card */}
      {showAddForm && (
        <Card className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-md mb-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
            <PackagePlus size={20} className="text-zinc-700" />
            <span>إضافة منتج جديد للكتالوج</span>
          </h2>

          <form className="flex flex-col gap-4" onSubmit={save}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  اسم المنتج *
                </label>
                <InputField
                  required
                  placeholder="مثال: قميص أكسفورد كلاسيكي"
                  value={f.name}
                  onChange={set('name')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  التصنيف
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SelectField
                      label=""
                      value={f.category_id}
                      onChange={value => setF({ ...f, category_id: value })}
                      placeholder="اختر التصنيف..."
                      options={cats.map(c => ({ value: c.id, label: c.name }))}
                    />
                  </div>
                  <InputField
                    placeholder="تصنيف جديد"
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 shrink-0"
                    onPress={addCat}
                  >
                    + إضافة
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                وصف وتفاصيل المنتج
              </label>
              <TextArea
                aria-label="وصف المنتج"
                placeholder="تفاصيل الخامة، إرشادات الغسيل، ومميزات القطعة..."
                value={f.description}
                onChange={set('description')}
                rows={3}
                className="w-full p-3 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  سعر البيع (دج) *
                </label>
                <InputField
                  required
                  type="number"
                  min="0"
                  placeholder="مثال: 3900"
                  value={f.price}
                  onChange={set('price')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  السعر القديم قبل الخصم (اختياري)
                </label>
                <InputField
                  type="number"
                  min="0"
                  placeholder="مثال: 4500"
                  value={f.original_price}
                  onChange={set('original_price')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  المقاسات (مفصولة بفاصلة)
                </label>
                <InputField
                  placeholder="S, M, L, XL, XXL"
                  value={f.sizes}
                  onChange={set('sizes')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  الألوان (مفصولة بفاصلة)
                </label>
                <InputField
                  placeholder="أسود, أبيض, كحلي, بيج"
                  value={f.colors}
                  onChange={set('colors')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  المخزون الأولي لكل متغير
                </label>
                <InputField
                  type="number"
                  min="0"
                  placeholder="10"
                  value={f.stock}
                  onChange={set('stock')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                صور المنتج (يمكنك تحديد عدة صور)
              </label>
              <InputField
                type="file"
                accept="image/*"
                multiple
                aria-label="صور المنتج"
                onChange={e => setFiles(e.target.files)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
              <Button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm hover:bg-zinc-50"
                onPress={() => setShowAddForm(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                isDisabled={busy}
              >
                {busy ? (
                  <>
                    <Spinner size="sm" />
                    <span>جاري الرفع والحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>حفظ ونشر المنتج</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-toolbar mb-6">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-zinc-600 mb-1.5 select-none">
              بحث في المنتجات
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <InputField
                className="pr-10"
                placeholder="ابحث عن منتج بالاسم..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full sm:w-64">
            <SelectField
              label="تصفية بالتصنيف"
              value={selectedCat}
              onChange={setSelectedCat}
              placeholder="جميع التصنيفات"
              options={[
                { value: '', label: 'جميع التصنيفات' },
                ...cats.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>الصورة</th>
              <th>المنتج والتصنيف</th>
              <th>السعر الحالي</th>
              <th>المخزون والمتغيرات</th>
              <th className="text-center" style={{ width: 80 }}>ظاهر</th>
              <th className="text-center" style={{ width: 80 }}>مميز</th>
              <th className="text-center" style={{ width: 90 }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(p => {
              const mainImg = p.product_images?.[0]?.url;
              const catObj = cats.find(c => c.id === p.category_id);
              const totalStock = (p.product_variants || []).reduce(
                (sum, v) => sum + (v.stock || 0),
                0
              );

              return (
                <tr key={p.id}>
                  <td>
                    {mainImg ? (
                      <img
                        src={mainImg}
                        width="48"
                        height="60"
                        alt=""
                        className="rounded-lg object-cover border border-zinc-200"
                      />
                    ) : (
                      <div className="w-12 h-15 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </td>

                  <td>
                    <div className="font-bold text-zinc-900">{p.name}</div>
                    {catObj && (
                      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded font-medium mt-1 inline-block">
                        {catObj.name}
                      </span>
                    )}
                  </td>

                  <td>
                    <Button
                      className="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-900 flex items-center gap-1.5"
                      onPress={() => editPrice(p)}
                      title="انقر لتعديل السعر"
                    >
                      <span>{Number(p.price).toLocaleString('ar-DZ')} دج</span>
                      <Edit3 size={11} className="text-zinc-400" />
                    </Button>
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {(p.product_variants || []).map(v => (
                        <Button
                          key={v.id}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors ${v.stock > 0
                              ? 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                              : 'bg-red-50 text-red-600 border-red-200'
                            }`}
                          onPress={() => editStock(v)}
                          title={`تعديل مخزون ${v.size} / ${v.color}`}
                        >
                          {v.size}/{v.color}: {v.stock}
                        </Button>
                      ))}
                    </div>
                  </td>

                  <td className="text-center">
                    <Checkbox
                      isSelected={p.is_active}
                      onChange={() => toggle(p, 'is_active')}
                    >
                      <Checkbox.Content aria-label={`إظهار ${p.name}`}>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </td>

                  <td className="text-center">
                    <Checkbox
                      isSelected={p.is_featured}
                      onChange={() => toggle(p, 'is_featured')}
                    >
                      <Checkbox.Content aria-label={`تمييز ${p.name}`}>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </td>

                  <td className="text-center">
                    <Button
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف المنتج"
                      onPress={() => del(p)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!filteredList.length && (
          <div className="p-8 text-center text-zinc-500 text-sm">
            لا توجد منتجات مطابقة لخيارات البحث الحالية.
          </div>
        )}
      </div>
    </div>
  );
}
