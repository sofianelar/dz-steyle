import { useSettings } from '../lib/useSettings';
import { Button } from '@heroui/react';
import { ArrowDown, ShieldCheck, Truck, Users } from 'lucide-react';

export default function Hero() {
  const s = useSettings();
  const bg = s.hero_image
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.6) 0%, rgba(9,9,11,0.92) 100%), url(${s.hero_image})`,
      }
    : {
        backgroundImage:
          'radial-gradient(ellipse at top, #18181b 0%, #09090b 70%, #000000 100%)',
      };

  return (
    <div className="hero-banner relative" style={bg}>
      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-zinc-500/10 blur-3xl pointer-events-none" />


      <h1 className="max-w-3xl leading-[1.15] font-black tracking-tight text-white mt-2">
        {s.hero_title || 'أناقة رجالية متجددة تعكس حضورك'}
      </h1>

      <p className="max-w-xl text-zinc-300 text-sm sm:text-base leading-relaxed mt-1">
        {s.hero_subtitle ||
          'تشكيلات مميزة من الأزياء والملابس الرجالية الراقية، مختارة بعناية لأصحاب الذوق الرفيع مع خدمة التوصيل السريع لـ 58 ولاية.'}
      </p>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
        <Button
          className="px-8 py-3.5 rounded-full bg-white text-zinc-950 font-black text-sm hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 cursor-pointer"
          onPress={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span>{s.hero_button || 'تصفح التشكيلة الكاملة'}</span>
          <ArrowDown size={15} />
        </Button>

        <Button
          className="px-6 py-3.5 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          onPress={() => {
            const el = document.getElementById('products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          وصل حديثاً
        </Button>
      </div>

      {/* Trust Metrics Pill Row */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
        <div className="flex items-center gap-2">
          <Truck size={15} className="text-amber-400" />
          <span>توصيل سريع لـ <b>58 ولاية</b></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400" />
          <span>الدفع عند الاستلام <b>بعد المعاينة</b></span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={15} className="text-sky-400" />
          <span>أكثر من <b>5000+ زبون راضٍ</b></span>
        </div>
      </div>
    </div>
  );
}
