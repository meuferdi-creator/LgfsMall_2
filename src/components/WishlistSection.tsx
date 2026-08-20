import React, { useState } from "react";
import { Heart, Trash2, ShoppingBag, Search, ArrowUpDown, Tag, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Product } from "../types";
import { useAppStore } from "../store";
import ProductCard from "./ProductCard";
import { useTranslation } from "../hooks/useTranslation";

interface WishlistSectionProps {
  products: Product[];
  formatCurrency: (val: number) => string;
  onOpenDetail?: (product: Product) => void;
  onGoToCatalog: () => void;
}

export default function WishlistSection({
  products,
  formatCurrency,
  onOpenDetail,
  onGoToCatalog
}: WishlistSectionProps) {
  const { t } = useTranslation();
  const { wishlist, toggleWishlist, clearWishlist, addToCart } = useAppStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "discount" | "stock">("newest");
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);

  // Filter products in wishlist
  const favoriteProducts = products.filter((p) => wishlist.includes(p.id));

  // Search filter
  const filteredFavorites = favoriteProducts.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  // Sort favorites
  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "stock") return b.stock - a.stock;
    if (sortBy === "discount") {
      const discA = a.wholesalePrice ? ((a.price - a.wholesalePrice) / a.price) * 100 : 0;
      const discB = b.wholesalePrice ? ((b.price - b.wholesalePrice) / b.price) * 100 : 0;
      return discB - discA;
    }
    return 0; // default order in array
  });

  const handleAddAllToCart = () => {
    let addedCount = 0;
    favoriteProducts.forEach((p) => {
      if (p.stock > 0) {
        addToCart(p, 1);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setAddedAllSuccess(true);
      setTimeout(() => setAddedAllSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 text-emerald-950 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">{t.wishlist}</h2>
          </div>
          <p className="text-xs text-emerald-200">
            {favoriteProducts.length} {t.productsCount}
          </p>
        </div>

        {favoriteProducts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddAllToCart}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.addToCart}</span>
            </button>

            <button
              onClick={() => {
                if (confirm("Voulez-vous vraiment vider l'ensemble de vos favoris ?")) {
                  clearWishlist();
                }
              }}
              className="px-3 py-2 bg-white/10 hover:bg-rose-600/80 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 border border-white/20"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>{t.cancel}</span>
            </button>
          </div>
        )}
      </div>

      {addedAllSuccess && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center space-x-3 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Tous vos articles favoris disponibles ont été ajoutés à votre panier !</span>
        </div>
      )}

      {favoriteProducts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-emerald-100/80 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <Heart className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-emerald-950">{t.wishlist}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.emptyCartSubtitle}
            </p>
          </div>
          <button
            onClick={onGoToCatalog}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.continueShopping}</span>
          </button>
        </div>
      ) : (
        /* Filters & Products Grid */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-100/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans mes favoris..."
                className="w-full pl-9 pr-3 py-2 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <ArrowUpDown className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-slate-600 font-mono">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-emerald-50/50 border border-emerald-100 text-xs font-mono font-bold text-emerald-950 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="newest">Ajout Récent</option>
                <option value="price_asc">Prix : Croissant</option>
                <option value="price_desc">Prix : Décroissant</option>
                <option value="discount">Meilleures Promos / Gros</option>
                <option value="stock">Disponibilité Stock</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedFavorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                formatCurrency={formatCurrency}
                onBuy={(id, qty) => {
                  addToCart(product, qty);
                }}
                actionText="Ajouter au Panier"
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
