import React, { useState, useEffect } from "react";
import { ShoppingBag, ArrowRight, Check, HelpCircle, Layers, TrendingDown, Heart, Store, AlertTriangle, Flame } from "lucide-react";
import { Product } from "../types";
import { firestoreSync } from "../lib/firebase";
import { useAppStore } from "../store";
import { translations } from "../translations";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

interface ProductCardProps {
  product: Product;
  formatCurrency: (value: number) => string;
  onBuy: (productId: string, quantity: number, color?: string) => void;
  actionText?: string;
  onOpenDetail?: (product: Product) => void;
  onOpenStore?: (vendorId: string, storeName: string) => void;
}

// In-memory cache for vendor profiles across all product cards to boost mobile fluidity
const vendorProfileCache = new Map<string, any>();
const vendorPendingRequests = new Map<string, Promise<any>>();

export default function ProductCard({
  product,
  formatCurrency,
  onBuy,
  actionText,
  onOpenDetail,
  onOpenStore
}: ProductCardProps) {
  const { wishlist, toggleWishlist, lang } = useAppStore();
  const t = translations[lang] || translations.FR;
  const effectiveActionText = actionText || t.buyNow || "Acheter avec Escrow";
  const isFavorite = wishlist.includes(product.id);
  const [qty, setQty] = useState(1);
  const [vendorProfile, setVendorProfile] = useState<any | null>(() => {
    return product.vendorId ? (vendorProfileCache.get(product.vendorId) || null) : null;
  });
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const productImages = (product.images && Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop"]);

  const activeImage = productImages[selectedImageIdx] || productImages[0];

  useEffect(() => {
    let isMounted = true;
    const loadVendorProfile = async () => {
      if (!product.vendorId) return;

      if (vendorProfileCache.has(product.vendorId)) {
        setVendorProfile(vendorProfileCache.get(product.vendorId));
        return;
      }

      try {
        let fetchPromise = vendorPendingRequests.get(product.vendorId);
        if (!fetchPromise) {
          fetchPromise = firestoreSync.getDocument("vendors", product.vendorId);
          vendorPendingRequests.set(product.vendorId, fetchPromise);
        }

        const profile = await fetchPromise;
        if (profile) {
          vendorProfileCache.set(product.vendorId, profile);
          if (isMounted) {
            setVendorProfile(profile);
          }
        }
      } catch (e) {
        // Non-blocking fallback
      } finally {
        vendorPendingRequests.delete(product.vendorId);
      }
    };
    loadVendorProfile();
    return () => {
      isMounted = false;
    };
  }, [product.vendorId]);

  // Variants & Colors handling
  const parsedVariants: { color: string; price?: number }[] = Array.isArray(product.variants)
    ? product.variants
    : (typeof product.variants === "string" ? (() => { try { return JSON.parse(product.variants); } catch (e) { return []; } })() : []);

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const activeVariant = parsedVariants[selectedVariantIdx];

  const hasWholesale = !!(product.wholesalePrice && product.wholesaleMinQty);
  const wholesaleMin = product.wholesaleMinQty || 1;
  const wholesalePrice = product.wholesalePrice || product.price;

  const maxAvailableStock = product.stock > 0 ? product.stock : 999;
  const isWholesaleActive = hasWholesale && qty >= wholesaleMin;
  const basePrice = activeVariant?.price ? activeVariant.price : product.price;
  const activeUnitPrice = isWholesaleActive ? wholesalePrice : basePrice;
  const totalPrice = Math.round(activeUnitPrice * qty);
  const packPrice = Math.round(wholesaleMin * wholesalePrice);

  // Calculate savings percentage and absolute savings
  const savingsPercent = hasWholesale
    ? Math.round(((product.price - wholesalePrice) / product.price) * 100)
    : 0;

  const totalSavings = isWholesaleActive
    ? Math.round((product.price - wholesalePrice) * qty)
    : 0;

  const progressPercent = hasWholesale
    ? Math.min(100, (qty / wholesaleMin) * 100)
    : 0;

  const handleIncrement = () => {
    if (qty < maxAvailableStock) {
      setQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (qty > 1) {
      setQty((prev) => prev - 1);
    }
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setQty(Math.max(1, Math.min(maxAvailableStock, val)));
  };

  const handleJumpToWholesale = () => {
    if (hasWholesale && maxAvailableStock >= wholesaleMin) {
      setQty(wholesaleMin);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className={`high-contrast-fix bg-white dark:bg-emerald-950/90 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full ${
        isWholesaleActive
          ? "border-amber-400 dark:border-amber-500 shadow-amber-100/40 dark:shadow-amber-950/30 shadow-xl ring-2 ring-amber-400/20"
          : "border-emerald-100/60 dark:border-emerald-800/60 shadow-md hover:shadow-xl"
      }`}
    >
      <div 
        onClick={() => onOpenDetail && onOpenDetail(product)} 
        className={onOpenDetail ? "cursor-pointer" : ""}
      >
        {/* Product Image & Badge Overlay */}
        <div className="relative aspect-video bg-emerald-50/30 dark:bg-emerald-900/40 overflow-hidden">
          <img
            src={getOptimizedImageUrl(activeImage, 500, 70)}
            alt={product.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Multiple Image Thumbnail Selector */}
          {productImages.length > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex space-x-1 z-10 bg-black/75 px-2 py-1 rounded-full border border-white/20">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIdx(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    selectedImageIdx === idx ? "bg-amber-400 scale-125" : "bg-white/50 hover:bg-white"
                  }`}
                  title={`Photo ${idx + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Category Badge */}
          <span className="absolute top-3 left-3 bg-emerald-700 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
            {product.category}
          </span>

          {/* Heart Wishlist Button & Stock Badge */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`p-1.5 rounded-full shadow-md transition-all transform active:scale-125 cursor-pointer ${
                isFavorite
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-white dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-rose-500"
              }`}
              title={isFavorite ? "Retirer de mes favoris" : "Ajouter à mes favoris"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
            </button>

            {product.stock === 0 ? (
              <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase">
                Rupture
              </span>
            ) : product.stock < 5 ? (
              <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight flex items-center space-x-1 shadow-md animate-pulse">
                <Flame className="w-3 h-3 fill-white" />
                <span>Plus que {product.stock} !</span>
              </span>
            ) : (
              <span className="bg-amber-500 text-emerald-950 font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase">
                Stock: {product.stock}
              </span>
            )}
          </div>

          {/* Wholesale Eligible Glow Badge */}
          {hasWholesale && !isWholesaleActive && (
            <button
              onClick={handleJumpToWholesale}
              className="absolute bottom-3 left-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-[9px] px-2.5 py-1.5 rounded-lg shadow-md cursor-pointer flex items-center space-x-1 uppercase transition-all"
            >
              <Layers className="w-3 h-3" />
              <span>Gros dispo : -{savingsPercent}% dès {wholesaleMin} psc</span>
            </button>
          )}

          {isWholesaleActive && (
            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-[9px] px-2.5 py-1.5 rounded-lg shadow-md flex items-center space-x-1 uppercase animate-pulse">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Tarif de Gros Activé (-{savingsPercent}%)</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-extrabold text-sm text-emerald-950 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-display">
              {product.title}
            </h4>

            {/* Vendor Badge & Store Name explicitly below product title */}
            <div className="mt-1.5 mb-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenStore && product.vendorId) {
                    onOpenStore(product.vendorId, vendorProfile?.shopName || product.vendor?.name || "LGF's Mall");
                  }
                }}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-700/60 hover:text-emerald-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate max-w-[180px]">{vendorProfile?.shopName || product.vendor?.name || "LGF's Mall"}</span>
              </button>
            </div>

            <p className="text-xs text-emerald-800 dark:text-emerald-200/90 line-clamp-2 leading-relaxed mt-1">
              {product.description}
            </p>
          </div>

          {/* Color Variants Pills (if available) */}
          {parsedVariants.length > 0 && (
            <div className="space-y-1.5 p-2 bg-emerald-50/40 dark:bg-emerald-900/30 rounded-xl border border-emerald-100/40 dark:border-emerald-800/40">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">Couleur disponible :</span>
              <div className="flex flex-wrap gap-1">
                {parsedVariants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariantIdx(idx);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      selectedVariantIdx === idx
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800 hover:border-emerald-400"
                    }`}
                  >
                    {v.color} {v.price && v.price !== product.price ? `(${formatCurrency(v.price)})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Stats - Spacious, Clear & Non-Truncated */}
          <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/70 shadow-2xs space-y-2.5">
            {/* 1. Prix à l'unité */}
            <div className="bg-white/95 dark:bg-emerald-900/60 p-2.5 sm:p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-mono">
                  Prix à l'unité
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-400 font-medium">
                  Tarif au détail
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-black text-sm sm:text-base whitespace-nowrap block ${
                    isWholesaleActive
                      ? "line-through text-slate-400 dark:text-slate-500 text-xs"
                      : "text-emerald-950 dark:text-white"
                  }`}
                >
                  {formatCurrency(basePrice)} / unité
                </span>
              </div>
            </div>

            {/* 2. Offre de quantité / Prix de gros */}
            {hasWholesale ? (
              <div
                className={`p-2.5 sm:p-3 rounded-xl border transition-all shadow-2xs flex flex-col gap-2 ${
                  isWholesaleActive
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-amber-50/95 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${
                        isWholesaleActive ? "bg-amber-700 text-white" : "bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                      }`}
                    >
                      OFFRE
                    </span>
                    <span className="text-xs font-black">
                      {wholesaleMin} pour {formatCurrency(packPrice)}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold ${
                      isWholesaleActive ? "text-amber-100" : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    -{savingsPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold border-t border-amber-200/50 dark:border-amber-800/50 pt-1">
                  <span className={isWholesaleActive ? "text-amber-100" : "text-amber-700 dark:text-amber-300"}>
                    Soit {formatCurrency(Math.round(wholesalePrice))} / unité
                  </span>
                  {!isWholesaleActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToWholesale();
                      }}
                      className="text-[9px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded shadow-2xs cursor-pointer transition-colors"
                    >
                      Profiter du pack →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/95 dark:bg-emerald-900/60 p-2.5 sm:p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Boutique
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Vendeur vérifié
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenStore && product.vendorId) {
                      onOpenStore(
                        product.vendorId,
                        vendorProfile?.shopName || product.vendor?.name || "Boutique d'Assigamé"
                      );
                    }
                  }}
                  className="font-bold text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 underline truncate max-w-[130px] text-right cursor-pointer"
                >
                  {vendorProfile?.shopName || product.vendor?.name || "Boutique d'Assigamé"}
                </button>
              </div>
            )}
          </div>

          {/* Interactive Wholesale Simulator Area */}
          <div className="space-y-3 pt-1">
            {/* Real-time low stock urgency banner */}
            {product.stock > 0 && product.stock < 5 && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-amber-500/15 dark:bg-amber-950/60 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-[11px] font-bold shadow-2xs">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                <span>
                  ⚡ <strong>Stock limité :</strong> plus que <strong>{product.stock}</strong> exemplaire{product.stock > 1 ? "s" : ""} disponible{product.stock > 1 ? "s" : ""} !
                </span>
              </div>
            )}

            {/* Dynamic quantity select and summary */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase font-mono">Simuler la quantité :</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={qty <= 1}
                  aria-label="Diminuer la quantité"
                  className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-700 text-emerald-950 dark:text-white rounded-lg flex items-center justify-center font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={handleQtyChange}
                  min={1}
                  max={maxAvailableStock}
                  aria-label="Quantité souhaitée"
                  className="w-10 h-7 bg-emerald-50 dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-700 text-emerald-950 dark:text-white rounded-lg text-center text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={qty >= maxAvailableStock}
                  aria-label="Augmenter la quantité"
                  className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-700 text-emerald-950 dark:text-white rounded-lg flex items-center justify-center font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Real-time Dynamic bulk savings bar */}
            {hasWholesale && (
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-emerald-900/80 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-emerald-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isWholesaleActive
                        ? "bg-gradient-to-r from-amber-400 to-yellow-500 shadow-sm"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-[9px] font-semibold">
                  {isWholesaleActive ? (
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center">
                      🔥 Offre activée : {formatCurrency(totalSavings)} d'économie !
                    </span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      Ajoutez <strong className="text-amber-600 dark:text-amber-400 font-bold">{wholesaleMin - qty} pcs</strong> pour l'offre à {formatCurrency(Math.round(wholesalePrice))}/u !
                    </span>
                  )}
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {qty}/{wholesaleMin} pcs
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 pt-0 border-t border-emerald-50/50 dark:border-emerald-800/40 mt-auto bg-emerald-50/20 dark:bg-emerald-900/20">
        <div className="flex justify-between items-end mb-4 pt-3">
          <div>
            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block font-mono">Total Estimé :</span>
            <span className="font-extrabold text-emerald-950 dark:text-white text-base leading-none">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          {isWholesaleActive && (
            <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-700">
              Gros appliqué
            </span>
          )}
        </div>

        <div className="space-y-2">
          <button
            disabled={product.stock === 0}
            onClick={() => onBuy(product.id, qty, activeVariant?.color)}
            className={`w-full font-bold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              product.stock === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : isWholesaleActive
                ? "bg-amber-500 hover:bg-amber-600 text-emerald-950 shadow-md shadow-amber-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{product.stock === 0 ? (t.outOfStock || "Rupture de stock") : effectiveActionText}</span>
          </button>

          <a
            href={`https://wa.me/${(vendorProfile?.whatsapp || product.vendor?.phone || "22872998148").replace(/\s+/g, "").replace(/\+/g, "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Bonjour ${vendorProfile?.shopName || product.vendor?.name || "Boutique"}, je souhaite vous contacter pour l'article "${product.title}" vu sur LGF's Mall.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BA56] text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer border border-transparent shadow-md shadow-[#25D366]/10 text-center"
          >
            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.906-6.99C16.255 1.876 13.779.844 11.14.844c-5.443 0-9.87 4.424-9.873 9.871-.001 1.773.476 3.51 1.381 5.035l-.934 3.415 3.493-.916zm10.742-7.447c-.29-.145-1.716-.847-1.98-.942-.262-.096-.453-.145-.642.145-.19.29-.733.942-.897 1.13-.164.19-.327.21-.617.066-.29-.145-1.223-.45-2.33-1.439-.861-.767-1.443-1.715-1.611-2.005-.168-.29-.018-.445.127-.589.13-.13.29-.34.435-.51.145-.17.19-.29.29-.483.096-.19.048-.36-.024-.505-.072-.145-.642-1.545-.88-2.115-.23-.553-.463-.48-.642-.48-.166-.003-.357-.003-.548-.003-.19 0-.501.072-.763.36-.262.29-1.002.978-1.002 2.38 0 1.402 1.02 2.753 1.163 2.946.143.19 2.01 3.067 4.869 4.298.68.293 1.21.468 1.62.598.683.217 1.303.186 1.793.113.546-.08 1.716-.702 1.958-1.381.242-.68.242-1.26.17-1.38-.073-.12-.267-.19-.557-.335z"/>
            </svg>
            <span>Poser une question sur WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
