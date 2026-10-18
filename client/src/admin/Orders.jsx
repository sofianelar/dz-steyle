import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Alert, Button, Card, Spinner, Checkbox } from '@heroui/react';
import SelectField from '../components/SelectField';
import InputField from '../components/InputField';
import {
  Printer,
  Phone,
  Search,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  TrendingUp,
  MapPin,
  FileText,
  AlertCircle,
  Download,
  CheckSquare,
  Layers,
} from 'lucide-react';

const ST = {
  pending: { label: 'قيد الانتظار', class: 'pending', icon: Clock },
  confirmed: { label: 'مؤكد', class: 'confirmed', icon: CheckCircle },
  preparing: { label: 'قيد التحضير', class: 'preparing', icon: Package },
  shipped: { label: 'تم الشحن', class: 'shipped', icon: Truck },
  delivered: { label: 'تم التسليم', class: 'delivered', icon: CheckCircle },
  cancelled: { label: 'ملغى', class: 'cancelled', icon: XCircle },
};

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) setErr(error.message);
      else setRows(data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe();
    const poll = setInterval(load, 15000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
    };
  }, [load]);

  async function setStatus(id, s) {
    const { error } = await supabase.rpc('set_order_status', { oid: id, s });
    if (error) alert('خطأ: ' + error.message);
    else load();
  }

  async function saveNote(id, admin_notes) {
    await supabase.from('orders').update({ admin_notes }).eq('id', id);
  }

  const shown = rows.filter(
    o =>
      (!st || o.status === st) &&
      `${o.reference} ${o.customer_name} ${o.phone} ${o.wilaya}`.toLowerCase().includes(q.toLowerCase())
  );

  const pendingCount = rows.filter(o => o.status === 'pending').length;
  const deliveredCount = rows.filter(o => o.status === 'delivered').length;
  const totalRevenue = rows
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Selection handlers
  const toggleSelect = id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllShown = () => {
    if (selectedIds.size === shown.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shown.map(o => o.id)));
    }
  };

  // Bulk Status Update
  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await supabase.rpc('set_order_status', { oid: id, s: bulkStatus });
      }
      setSelectedIds(new Set());
      setBulkStatus('');
      await load();
    } catch (e) {
      alert('خطأ أثناء التحديث الجماعي: ' + e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  // Export to CSV for Yalidine / ZR Express / Procolis
  const exportDeliveryCSV = () => {
    const listToExport = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r.id))
      : shown;

    if (!listToExport.length) {
      alert('لا توجد طلبات للتصدير');
      return;
    }

    const headers = [
      'رقم الطلب (Reference)',
      'اسم الزبون (Customer)',
      'رقم الهاتف (Phone)',
      'الولاية (Wilaya)',
      'البلدية (Commune)',
      'العنوان بالتفصيل (Address)',
      'المبلغ للتحصيل دج (COD Amount)',
      'عناصر الطرد (Items)',
      'ملاحظات الزبون (Notes)',
      'الحالة (Status)',
      'التاريخ (Date)',
    ];

    const csvRows = listToExport.map(o => {
      const itemsStr = o.order_items
        .map(i => `${i.product_name} (${i.size}/${i.color}) x${i.quantity}`)
        .join(' + ');
      return [
        `"${o.reference}"`,
        `"${o.customer_name}"`,
        `"${o.phone}"`,
        `"${o.wilaya}"`,
        `"${o.commune}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${o.total}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`,
        `"${ST[o.status]?.label || o.status}"`,
        `"${new Date(o.created_at).toLocaleDateString('ar-DZ')}"`,
      ].join(',');
    });

    // Add BOM for UTF-8 Excel support
    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `STAYEL_DZ_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 m-0 flex items-center gap-2">
            <span>إدارة الطلبات وشحن الولايات</span>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full">
              {rows.length} طلب إجمالي
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            متابعة فورية، تصدير ملفات الشحن، وتحديث الحالات جماعياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
            onPress={exportDeliveryCSV}
          >
            <Download size={14} />
            <span>تصدير كشف التوصيل (Excel/CSV)</span>
          </Button>

          <Button
            className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            onPress={() => window.print()}
          >
            <Printer size={14} />
            <span>طباعة</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card border-r-4 border-r-amber-500">
          <div className="flex items-center justify-between">
            <span className="admin-stat-label">طلبات قيد الانتظار</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <span className="admin-stat-value text-amber-600">{pendingCount}</span>
        </div>

        <div className="admin-stat-card border-r-4 border-r-emerald-500">
          <div className="flex items-center justify-between">
            <span className="admin-stat-label">طلبات تم تسليمها</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <span className="admin-stat-value text-emerald-600">{deliveredCount}</span>
        </div>

        <div className="admin-stat-card border-r-4 border-r-blue-500">
          <div className="flex items-center justify-between">
            <span className="admin-stat-label">إيرادات الطلبات المسلمة</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <span className="admin-stat-value text-zinc-900">
            {totalRevenue.toLocaleString('ar-DZ')} <small className="text-xs font-normal">دج</small>
          </span>
        </div>
      </div>

      {err && <Alert className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">{err}</Alert>}

      {/* Filters Bar & Bulk Action Header */}
      <div className="filter-toolbar mb-6">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-zinc-600 mb-1.5 select-none">
              بحث في الطلبات
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <InputField
                className="pr-10"
                placeholder="ابحث بالرقم المرجعي، اسم الزبون، الهاتف، أو الولاية..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full sm:w-64">
            <SelectField
              label="تصفية حسب الحالة"
              value={st}
              onChange={setSt}
              placeholder="كل الحالات"
              options={[
                { value: '', label: 'جميع الحالات' },
                ...Object.entries(ST).map(([value, conf]) => ({ value, label: conf.label })),
              ]}
            />
          </div>
        </div>

        {/* Bulk Action Bar (shows when items are checked) */}
        {selectedIds.size > 0 && (
          <div className="mt-3 p-3 bg-zinc-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckSquare size={16} className="text-amber-400" />
              <span>تم تحديد {selectedIds.size} من أصل {shown.length} طلب</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="bg-zinc-800 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none"
              >
                <option value="">تغيير الحالة إلى...</option>
                {Object.entries(ST).map(([val, conf]) => (
                  <option key={val} value={val}>
                    {conf.label}
                  </option>
                ))}
              </select>

              <Button
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black cursor-pointer disabled:opacity-50"
                isDisabled={!bulkStatus || bulkBusy}
                onPress={applyBulkStatus}
              >
                {bulkBusy ? 'جاري التطبيق...' : 'تطبيق على المحدد'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Select All Row */}
      {shown.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1 text-xs text-zinc-500 font-semibold">
          <button
            onClick={selectAllShown}
            className="hover:text-zinc-900 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare size={14} />
            <span>{selectedIds.size === shown.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الطلبات المعروضة'}</span>
          </button>

          <span>عرض {shown.length} طلب</span>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner aria-label="جاري التحميل" />
          <p className="text-sm text-zinc-500">جاري تحميل سجل الطلبات...</p>
        </div>
      ) : shown.length > 0 ? (
        <div className="flex flex-col gap-4">
          {shown.map(o => {
            const conf = ST[o.status] || { label: o.status, class: 'pending', icon: Clock };
            const StatusIcon = conf.icon;
            const isChecked = selectedIds.has(o.id);

            return (
              <Card
                key={o.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
                  isChecked
                    ? 'border-zinc-950 bg-amber-50/20 shadow-md ring-1 ring-zinc-950'
                    : 'border-zinc-200 bg-white shadow-sm hover:border-zinc-300'
                }`}
              >
                {/* Header row with checkbox */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(o.id)}
                      className="w-4 h-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900 cursor-pointer"
                      title="تحديد الطلب"
                    />

                    <span className="font-mono font-bold text-base bg-zinc-100 text-zinc-900 px-3 py-1 rounded-lg">
                      #{o.reference}
                    </span>

                    <span className={`badge-status ${conf.class}`}>
                      <StatusIcon size={13} />
                      <span>{conf.label}</span>
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(o.created_at).toLocaleString('ar-DZ', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {/* Customer Details & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-100">
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block mb-0.5">الزبون والهاتف:</span>
                    <span className="font-bold text-zinc-900 text-base">{o.customer_name}</span>
                    <a
                      href={`tel:${o.phone}`}
                      className="inline-flex items-center gap-1.5 text-emerald-700 font-bold mr-3 hover:underline"
                    >
                      <Phone size={14} />
                      <span dir="ltr">{o.phone}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block mb-0.5">عنوان الشحن:</span>
                    <span className="font-semibold text-zinc-800 flex items-center gap-1">
                      <MapPin size={14} className="text-zinc-500 shrink-0" />
                      <span>{o.wilaya} — {o.commune}</span>
                    </span>
                    <p className="text-xs text-zinc-600 m-0 mt-0.5">{o.address}</p>
                  </div>
                </div>

                {o.notes && (
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 text-xs border border-amber-200 flex items-start gap-1.5">
                    <FileText size={14} className="shrink-0 mt-0.5 text-amber-700" />
                    <span><b>ملاحظة الزبون:</b> {o.notes}</span>
                  </div>
                )}

                {/* Products in this order */}
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block mb-2">عناصر الطلب:</span>
                  <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                    {o.order_items.map(item => (
                      <div key={item.id} className="p-3 bg-white flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">{item.product_name}</span>
                          <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                            {item.size} / {item.color}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">الكمية: {item.quantity}</span>
                          <span className="font-bold text-zinc-900">
                            {Number(item.unit_price * item.quantity).toLocaleString('ar-DZ')} دج
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price summary */}
                <div className="flex flex-wrap items-center justify-between text-sm pt-2 border-t border-zinc-100">
                  <div className="text-xs text-zinc-500 flex items-center gap-3">
                    <span>المجموع الفرعي: {Number(o.subtotal).toLocaleString('ar-DZ')} دج</span>
                    <span>+ التوصيل: {Number(o.delivery_fee).toLocaleString('ar-DZ')} دج</span>
                  </div>
                  <div className="text-base font-black text-zinc-950">
                    المجموع النهائي: <span className="text-lg text-emerald-800">{Number(o.total).toLocaleString('ar-DZ')} دج</span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-zinc-100 bg-zinc-50/50 p-3 rounded-xl">
                  <div className="w-full sm:w-52">
                    <SelectField
                      label="تغيير حالة الطلب"
                      value={o.status}
                      onChange={value => setStatus(o.id, value)}
                      options={Object.entries(ST).map(([value, conf]) => ({
                        value,
                        label: conf.label,
                      }))}
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <InputField
                      placeholder="ملاحظات الإدارة الداخلية (تُحفظ تلقائياً)..."
                      defaultValue={o.admin_notes || ''}
                      onBlur={e => saveNote(o.id, e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    onPress={() => window.print()}
                  >
                    <Printer size={14} />
                    <span>طباعة</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl">
          <AlertCircle size={40} className="text-zinc-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-zinc-800 m-0">لا توجد طلبات مطابقة</h3>
          <p className="text-xs text-zinc-500 mt-1">جرب تغيير حالة التصفية أو مسح عبارة البحث</p>
        </div>
      )}
    </div>
  );
}
