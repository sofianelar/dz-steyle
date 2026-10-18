import { useSettings } from '../lib/useSettings';
import { Sparkles, Truck, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AnnouncementBar() {
  const { announcement } = useSettings();

  const messages = [
    announcement || 'توصيل سريع ومتوفر لـ 58 ولاية حتى باب المنزل',
    'الدفع نقداً عند الاستلام بعد معاينة طلبك وفحصه',
    'ضمان استبدال المقاس خلال 48 ساعة في حال عدم الملاءمة',
    'تشكيلة الموسم الجديدة متوفرة الآن بكميات محدودة',
  ];

  return (
    <aside aria-label="إعلانات المتجر" className="announcement-bar overflow-hidden py-2 bg-zinc-950 text-white border-b border-zinc-800">
      <div className="marquee-track flex items-center gap-8 whitespace-nowrap text-xs font-semibold">
        {messages.concat(messages).map((msg, index) => (
          <div key={index} className="flex items-center gap-2">
            <Sparkles size={12} className="text-amber-400 shrink-0" />
            <span>{msg}</span>
            <span className="text-zinc-600 mr-4">✦</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
