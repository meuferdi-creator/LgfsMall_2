import React, { useState, useEffect } from "react";
import { Filter, Search, RotateCcw, SlidersHorizontal, Check, Tag, ShieldCheck, Star } from "lucide-react";
import PriceRangeFilter from "./PriceRangeFilter";

export interface FacetedFilterState {
  search: string;
  category: string;
  vendor: string;
  region: string;
  minPrice: number;
  maxPrice: number;
  availability: "all" | "in_stock" | "wholesale";
  minRating: number;
  sortBy: "featured" | "newest" | "bestseller" | "price_asc" | "price_desc";
}

interface FacetedSearchPanelProps {
  filters: FacetedFilterState;
  onFilterChange: (newFilters: Partial<FacetedFilterState>) => void;
  onResetFilters: () => void;
  availableVendors: string[];
  totalResultsCount: number;
  maxCatalogPrice: number;
  formatCurrency: (val: number) => string;
}

const REGIONS = [
  "Toutes Régions",
  "Lomé (Maritime)",
  "Kara (Kozah)",
  "Atakpamé (Plateaux)",
  "Sokodé (Centrale)",
  "Dapaong (Savanes)"
];

const CATEGORIES = [
  "Tous",
  "Maison & Décoration",
  "Maison & Décoration / Rideaux",
  "Maison & Décoration / Tapis",
  "Beauté & Soins / Visage",
  "Mode & Textiles",
  "Cosmétiques & Beauté",
  "Alimentation",
  "Électronique"
];

export default function FacetedSearchPanel({
  filters,
  onFilterChange,
  onResetFilters,
  availableVendors,
  totalResultsCount,
  maxCatalogPrice,
  formatCurrency
}: FacetedSearchPanelProps) {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-emerald-100/60 shadow-lg p-5 space-y-4">
      {/* Search Input and Filter Toggle Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Main Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500" />
          <input
            type="text"
            placeholder="Rechercher par article, mot-clé, tissu (ex: Wax, Karité, Pagne)..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full bg-emerald-50/50 border border-emerald-100 pl-10 pr-4 py-3 rounded-2xl text-xs text-emerald-950 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-auto flex gap-2">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="bg-emerald-50/80 border border-emerald-100 px-4 py-3 rounded-2xl text-xs font-bold text-emerald-950 focus:outline-none cursor-pointer flex-1 md:flex-initial"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "Tous" ? "Toutes Catégories" : cat}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="bg-emerald-50/80 border border-emerald-100 px-4 py-3 rounded-2xl text-xs font-bold text-emerald-950 focus:outline-none cursor-pointer flex-1 md:flex-initial font-mono"
          >
            <option value="featured">✨ Recommandations</option>
            <option value="newest">🔥 Nouveautés</option>
            <option value="bestseller">🏆 Meilleures Ventes</option>
            <option value="price_asc">📈 Prix Croissant</option>
            <option value="price_desc">📉 Prix Décroissant</option>
          </select>

          {/* Toggle Faceted Drawer button for mobile/desktop */}
          <button
            type="button"
            onClick={() => setIsExpandedMobile(!isExpandedMobile)}
            className={`px-4 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              isExpandedMobile
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres Avancés</span>
          </button>
        </div>
      </div>

      {/* Expanded Faceted Filter Drawer Panel */}
      {isExpandedMobile && (
        <div className="pt-4 border-t border-emerald-100/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in text-xs">
          {/* Dual Handle Price Range Filter */}
          <PriceRangeFilter
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            maxCatalogPrice={maxCatalogPrice}
            onPriceChange={(min, max) => onFilterChange({ minPrice: min, maxPrice: max })}
            formatCurrency={formatCurrency}
          />

          {/* Vendor Filter */}
          <div className="p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-100/60 space-y-2">
            <label className="text-[10px] font-extrabold text-emerald-800 uppercase font-mono block">
              Boutique / Vendeur :
            </label>
            <select
              value={filters.vendor}
              onChange={(e) => onFilterChange({ vendor: e.target.value })}
              className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les Boutiques</option>
              {availableVendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Region Filter */}
          <div className="p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-100/60 space-y-2">
            <label className="text-[10px] font-extrabold text-emerald-800 uppercase font-mono block">
              Région de Livraison :
            </label>
            <select
              value={filters.region}
              onChange={(e) => onFilterChange({ region: e.target.value })}
              className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-none cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Stock & Wholesale Availability */}
          <div className="p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-100/60 space-y-2">
            <label className="text-[10px] font-extrabold text-emerald-800 uppercase font-mono block">
              Disponibilité & Tarifs :
            </label>
            <select
              value={filters.availability}
              onChange={(e) => onFilterChange({ availability: e.target.value as any })}
              className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les articles</option>
              <option value="in_stock">En stock seulement</option>
              <option value="wholesale">Tarif de Gros Disponible</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Bar and Active Badges */}
      <div className="flex flex-wrap justify-between items-center text-xs pt-1 border-t border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-emerald-950 font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
            {totalResultsCount} article{totalResultsCount > 1 ? "s" : ""} trouvé{totalResultsCount > 1 ? "s" : ""}
          </span>
          {filters.category !== "Tous" && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
              Catégorie: {filters.category}
            </span>
          )}
          {filters.vendor !== "all" && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
              Boutique: {filters.vendor}
            </span>
          )}
        </div>

        {/* Reset Filters button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="text-slate-500 hover:text-emerald-700 font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser les filtres</span>
        </button>
      </div>
    </div>
  );
}
