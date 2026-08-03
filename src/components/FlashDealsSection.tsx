import React, { useState, useEffect } from "react";
import { Zap, Clock, ShoppingCart, Eye, Star, Flame } from "lucide-react";
import { Product } from "../types";

interface FlashDealsSectionProps {
  products: Product[];
  formatCurrency: (value: number) => string;
  onBuy: (productId: string, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

export default function FlashDealsSection({
  products,
  formatCurrency,
  onBuy,
  onOpenDetail
}: FlashDealsSectionProps) {
  // Live countdown timer state (e.g. 14h : 28m : 45s)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter products for flash deals (e.g., items with discount or wholesale, or top 4 products)
  const flashProducts = products.slice(0, 4);

  if (flashProducts.length === 0) return null;

  return (
    <section id="flash-deals-section" className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-amber-950/40 p-6 sm:p-8 rounded-3xl border border-amber-300/40 dark:border-amber-700/40 shadow-xl space-y-6">
      
      {/* Section Header with Live Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-800/60 pb-4">
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 animate-bounce">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="text-xl font-black font-display text-slate-900 dark:text-white flex items-center">
              Ventes Flash du Jour
              <span className="ml-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Jusqu'à -50%
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-amber-100 font-medium mt-0.5">
              Stocks limités à Lomé — Prix imbattables garantis en Séquestre LGF
            </p>
          </div>
        </div>

        {/* Live Timer Counter */}
        <div className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-2xl border border-slate-800 shadow-md self-start sm:self-auto">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Temps restant :
          </span>
          <div className="flex items-center space-x-1 font-mono text-xs font-black text-amber-400">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {String(timeLeft.hours).padStart(2, "0")}h
            </span>
            <span>:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {String(timeLeft.minutes).padStart(2, "0")}m
            </span>
            <span>:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {String(timeLeft.seconds).padStart(2, "0")}s
            </span>
          </div>
        </div>

      </div>

      {/* Flash Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {flashProducts.map((p, index) => {
          const fakeDiscountPercent = 15 + index * 10;
          const originalPrice = Math.round(p.price * (1 + fakeDiscountPercent / 100));

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-emerald-950 rounded-2xl border border-slate-200 dark:border-emerald-800/60 p-4 shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col justify-between relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-3 left-3 z-10 bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-md font-mono">
                -{fakeDiscountPercent}%
              </div>

              {/* Product Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-emerald-900/40 mb-3 cursor-pointer" onClick={() => onOpenDetail(p)}>
                <img
                  src={p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenDetail(p); }}
                  className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white p-2 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  title="Aperçu rapide"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Category */}
              <div className="space-y-1 mb-3">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase">
                  {p.category}
                </span>
                <h4 
                  onClick={() => onOpenDetail(p)}
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 cursor-pointer font-display leading-snug"
                >
                  {p.title}
                </h4>
              </div>

              {/* Price & Stock bar */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-emerald-900">
                <div className="flex items-baseline space-x-2">
                  <span className="text-base font-black text-rose-600 dark:text-amber-400 font-mono">
                    {formatCurrency(p.price)}
                  </span>
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatCurrency(originalPrice)}
                  </span>
                </div>

                {/* Stock progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-emerald-300 font-mono">
                    <span>Vendu : 78%</span>
                    <span>Stock : {p.stock}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-emerald-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full w-[78%] rounded-full"></div>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => onBuy(p.id, 1)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Acheter Vite</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
