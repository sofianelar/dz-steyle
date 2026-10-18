import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@heroui/react';
import { ArrowLeft, ImageOff, ShoppingBag } from 'lucide-react';
import { useCart } from '../lib/cart';

export default function ProductCard({ p }) {
  const { add } = useCart();
  const sortedImages = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const primaryImg = sortedImages[0]?.url;
  const secondaryImg = sortedImages[1]?.url;

  const variants = p.product_variants || [];
  const inStock = variants.some(v => v.stock > 0);
  const availableSizes = [...new Set(variants.filter(v => v.stock > 0).map(v => v.size))];

  const discountPercent =
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  return (
    <div className="group relative block text-inherit no-underline">
      <Link to={`/product/${p.id}`} className="block text-inherit no-underline">
        <Card className="product-card">
          <div className="product-card-img-wrapper relative overflow-hidden">
            {primaryImg ? (
              <>
                {/* Primary Image */}
                <img
                  src={primaryImg}
                  alt={p.name}
                  loading="lazy"
                  className={`product-card-img ${
                    secondaryImg ? 'transition-opacity duration-500 group-hover:opacity-0' : ''
                  }`}
                />

                {/* Secondary Image for Hover Flip */}
                {secondaryImg && (
                  <img
                    src={secondaryImg}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                <ImageOff size={32} />
                <span className="text-xs mt-2 font-medium">لا توجد صورة</span>
              </div>
            )}

            {/* Floating Badges */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
              {discountPercent && (
                <span className="discount-badge shadow-sm">
                  -{discountPercent}%
                </span>
              )}
              {p.is_featured && (
                <span className="bg-amber-500 text-zinc-950 font-bold text-[11px] px-2 py-0.5 rounded shadow-sm">
                  مميز
                </span>
              )}
            </div>

            {!inStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                  نفذت الكمية
                </span>
              </div>
            )}

            {/* Quick Size Bar Hover Reveal */}
            {inStock && availableSizes.length > 0 && (
              <div className="absolute bottom-2 inset-x-2 hidden sm:flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10 shadow-md">
                <span className="text-[10px] font-bold text-zinc-500 ml-1">المقاسات:</span>
                {availableSizes.slice(0, 5).map(sz => (
                  <span
                    key={sz}
                    className="text-[11px] font-extrabold text-zinc-900 bg-zinc-100 hover:bg-zinc-900 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                  >
                    {sz}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="product-card-body">
            <h3 className="product-title" title={p.name}>
              {p.name}
            </h3>

            <div className="product-price-row">
              <span className="current-price">
                {Number(p.price).toLocaleString('ar-DZ')} دج
              </span>
              {p.original_price && p.original_price > p.price && (
                <span className="original-price">
                  {Number(p.original_price).toLocaleString('ar-DZ')} دج
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
              {inStock ? (
                <span className="text-xs text-zinc-500 font-medium">
                  {availableSizes.length > 0 ? availableSizes.join(' · ') : 'متوفر بالمخزون'}
                </span>
              ) : (
                <span className="text-xs text-red-500 font-semibold">غير متوفر</span>
              )}

              <span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-950 group-hover:text-white transition-all transform group-hover:-translate-x-1">
                <ArrowLeft size={13} />
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
