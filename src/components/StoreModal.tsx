import React, { useState, useEffect } from "react";
import { Store, MapPin, Phone, Mail, X, ShoppingBag, ShieldCheck, Star, Search, ArrowLeft } from "lucide-react";
import { Product } from "../types";
import ProductCard from "./ProductCard";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string | null;
  storeName: string | null;
  products: Product[];
  formatCurrency: (amount: number) => string;
  onBuyProduct: (productId: string, quantity: number, color?: string) => void;
  onOpenDetail?: (product: Product) => void;
}

export default function StoreModal({
  isOpen,
  onClose,
  vendorId,
  storeName,
  products,
  formatCurrency,
  onBuyProduct,
  onOpenDetail
}: StoreModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [storeInfo, setStoreInfo] = useState<{
    shopName?: string;
    description?: string;
    phone?: string;
    city?: string;
    location?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSearchQuery("");
    setStoreInfo(null);

    if (vendorId) {
      fetch(`/api/vendor/profile/${vendorId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.shopName) {
            setStoreInfo(data);
          }
        })
        .catch(() => {});
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, vendorId]);

  if (!isOpen) return null;

  const displayName = storeInfo?.shopName || storeName || "LGF's Mall";

  // Filter products for this boutique
  const storeProducts = products.filter((p) => {
    if (vendorId && p.vendorId === vendorId) return true;
    if (storeName && p.vendor?.name?.toLowerCase() === storeName.toLowerCase()) return true;
    if (storeName && p.vendorId === storeName) return true;
    // Fallback: If opening official store or LGF's Mall
    if (
      (storeName && (storeName.toLowerCase().includes("lgf") || storeName.toLowerCase().includes("officiel") || storeName.toLowerCase() === "s5")) ||
      (vendorId === "s5")
    ) {
      if (p.vendor?.email === "lgfmall.lmdg11@gmail.com" || p.vendor?.name?.toLowerCase().includes("lgf") || p.vendorId) return true;
    }
    return false;
  });

  const filteredProducts = storeProducts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-emerald-950 w-full max-w-5xl rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Retour à l'accueil</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
              aria-label="Fermer la boutique"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-amber-400 border border-white/20 shrink-0">
              <Store className="w-10 h-10 stroke-[1.5]" />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-extrabold font-display">{displayName}</h2>
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 uppercase font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Vérifiée LGF</span>
                </span>
              </div>

              {storeInfo?.description && (
                <p className="text-xs text-emerald-100 max-w-2xl line-clamp-2">{storeInfo.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-emerald-100/90 pt-1">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  <span>{storeInfo?.city || storeInfo?.location || "Lomé, Togo"}</span>
                </span>
                {storeInfo?.phone && (
                  <span className="flex items-center font-mono">
                    <Phone className="w-3.5 h-3.5 mr-1 text-amber-300" />
                    <span>{storeInfo.phone}</span>
                  </span>
                )}
                <span className="flex items-center">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  <span>{storeProducts.length} articles en stock</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search bar inside store */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher un article dans ${displayName}...`}
                className="w-full bg-emerald-50/50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 pl-9 pr-4 py-2 rounded-xl text-xs text-emerald-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-emerald-300 font-mono">
              {filteredProducts.length} résultat(s)
            </span>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-emerald-50/30 dark:bg-emerald-900/20 rounded-3xl border border-dashed border-emerald-200 dark:border-emerald-800 space-y-3">
              <ShoppingBag className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-950 dark:text-white">
                {searchQuery ? "Aucun produit ne correspond à votre recherche" : "Aucun article disponible pour le moment"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300 max-w-sm mx-auto">
                Cette boutique n'a pas encore ajouté de produits correspondant à ce critère.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  formatCurrency={formatCurrency}
                  onBuy={onBuyProduct}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer sticky bar on mobile */}
        <div className="p-3 bg-slate-100 dark:bg-emerald-950/90 border-t border-slate-200 dark:border-emerald-800 flex items-center justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quitter la boutique &amp; Retourner à l'accueil LGF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
