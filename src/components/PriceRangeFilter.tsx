import React from "react";
import { Sliders, DollarSign } from "lucide-react";

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  maxCatalogPrice: number;
  onPriceChange: (min: number, max: number) => void;
  formatCurrency: (val: number) => string;
}

export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  maxCatalogPrice,
  onPriceChange,
  formatCurrency
}: PriceRangeFilterProps) {
  const absoluteMax = Math.max(500000, maxCatalogPrice || 100000);

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(parseInt(e.target.value) || 0, maxPrice - 500);
    onPriceChange(val, maxPrice);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(parseInt(e.target.value) || minPrice + 500, minPrice + 500);
    onPriceChange(minPrice, val);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    onPriceChange(val, maxPrice);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(minPrice, parseInt(e.target.value) || absoluteMax);
    onPriceChange(minPrice, val);
  };

  // Percentage calculations for range track highlight
  const minPct = Math.min(100, Math.max(0, (minPrice / absoluteMax) * 100));
  const maxPct = Math.min(100, Math.max(0, (maxPrice / absoluteMax) * 100));

  return (
    <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 space-y-3 font-sans">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-extrabold text-emerald-900 uppercase font-mono flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filtre Prix (FCFA) :</span>
        </label>
        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
          {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
        </span>
      </div>

      {/* Dual Handle Range Slider Track */}
      <div className="relative w-full py-2">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-emerald-100 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-emerald-600 rounded-full"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />

        {/* Min Range Slider */}
        <input
          type="range"
          min={0}
          max={absoluteMax}
          step={100}
          value={minPrice}
          onChange={handleMinSliderChange}
          className="absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-700 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-700"
        />

        {/* Max Range Slider */}
        <input
          type="range"
          min={0}
          max={absoluteMax}
          step={100}
          value={maxPrice}
          onChange={handleMaxSliderChange}
          className="absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500"
        />
      </div>

      {/* Synchronized Numeric Input Fields */}
      <div className="flex items-center space-x-2 pt-1">
        <div className="w-1/2">
          <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Min (FCFA)</span>
          <input
            type="number"
            min={0}
            max={maxPrice}
            value={minPrice}
            onChange={handleMinInputChange}
            className="w-full bg-white border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            placeholder="0"
          />
        </div>
        <span className="text-slate-400 font-bold self-end pb-2">-</span>
        <div className="w-1/2">
          <span className="text-[9px] font-bold text-slate-500 block mb-0.5">Max (FCFA)</span>
          <input
            type="number"
            min={minPrice}
            max={absoluteMax}
            value={maxPrice}
            onChange={handleMaxInputChange}
            className="w-full bg-white border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            placeholder={absoluteMax.toString()}
          />
        </div>
      </div>
    </div>
  );
}
