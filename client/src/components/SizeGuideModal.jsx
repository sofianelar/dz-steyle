import { useState } from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';

export default function SizeGuideModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('tops'); // 'tops' | 'bottoms'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-right align-middle shadow-2xl transition-all border border-zinc-200 animate-scale-up">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <Ruler size={17} />
              </div>
              <h3 className="text-base font-black text-zinc-900 m-0">
                دليل المقاسات المعتمد (القياسات الجزائرية / الأوروبية)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl mb-4">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'tops' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                onClick={() => setTab('tops')}
              >
                القمصان والتيشرتات والهوديز
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'bottoms' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                onClick={() => setTab('bottoms')}
              >
                السراويل والجينز
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-center text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold">
                  {tab === 'tops' ? (
                    <tr>
                      <th className="p-2.5">المقاس</th>
                      <th className="p-2.5">عرض الصدر (سم)</th>
                      <th className="p-2.5">الطول (سم)</th>
                      <th className="p-2.5">الوزن المناسب (كغ)</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-2.5">المقاس</th>
                      <th className="p-2.5">محيط الخصر (سم)</th>
                      <th className="p-2.5">طول السروال (سم)</th>
                      <th className="p-2.5">الوزن التقريبي (كغ)</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                  {tab === 'tops' ? (
                    <>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">S</td>
                        <td className="p-2.5">48 - 50</td>
                        <td className="p-2.5">68</td>
                        <td className="p-2.5">55 - 65 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">M</td>
                        <td className="p-2.5">52 - 54</td>
                        <td className="p-2.5">70</td>
                        <td className="p-2.5">65 - 75 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">L</td>
                        <td className="p-2.5">56 - 58</td>
                        <td className="p-2.5">72</td>
                        <td className="p-2.5">75 - 85 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">XL</td>
                        <td className="p-2.5">60 - 62</td>
                        <td className="p-2.5">74</td>
                        <td className="p-2.5">85 - 95 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">XXL</td>
                        <td className="p-2.5">64 - 66</td>
                        <td className="p-2.5">76</td>
                        <td className="p-2.5">95 - 110 كغ</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">30 (S)</td>
                        <td className="p-2.5">76 - 78</td>
                        <td className="p-2.5">98</td>
                        <td className="p-2.5">55 - 65 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">32 (M)</td>
                        <td className="p-2.5">80 - 83</td>
                        <td className="p-2.5">100</td>
                        <td className="p-2.5">65 - 75 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">34 (L)</td>
                        <td className="p-2.5">85 - 88</td>
                        <td className="p-2.5">102</td>
                        <td className="p-2.5">75 - 85 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">36 (XL)</td>
                        <td className="p-2.5">90 - 94</td>
                        <td className="p-2.5">104</td>
                        <td className="p-2.5">85 - 95 كغ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-950 bg-zinc-50/50">38 (XXL)</td>
                        <td className="p-2.5">96 - 100</td>
                        <td className="p-2.5">106</td>
                        <td className="p-2.5">95 - 110 كغ</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Practical Advice */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <span>
                <b>نصيحة أسلوب STAYEL:</b> إذا كنت تفضل الإطلالة الفضفاضة العصرية (Oversized Fit)، ننصحك باختيار نمرة أكبر من مقاسك المعتاد. كما نضمن لك إمكانية استبدال المقاس بكل سهولة!
              </span>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              فهمت، العودة لاختيار المقاس
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
