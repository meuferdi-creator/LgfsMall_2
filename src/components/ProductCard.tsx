import React, { useState, useEffect } from "react";
import { ShoppingBag, ArrowRight, Check, HelpCircle, Layers, TrendingDown, Heart } from "lucide-react";
import { Product } from "../types";
import { firestoreSync } from "../lib/firebase";
import { useAppStore } from "../store";

interface ProductCardProps {
  product: Product;
  formatCurrency: (value: number) => string;
  onBuy: (productId: string, quantity: number) => void;
  actionText?: string;
  onOpenDetail?: (product: Product) => void;
}

export default function ProductCard({
  product,
  formatCurrency,
  onBuy,
  actionText = "Acheter avec Escrow",
  onOpenDetail
}: ProductCardProps) {
  const { wishlist, toggleWishlist } = useAppStore();
  const isFavorite = wishlist.includes(product.id);
  const [qty, setQty] = useState(1);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const productImages = (product.images && Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop"]);

  const activeImage = productImages[selectedImageIdx] || productImages[0];

  useEffect(() => {
    const loadVendorProfile = async () => {
      if (product.vendorId) {
        try {
          const profile = await firestoreSync.getDocument("vendors", product.vendorId);
          if (profile) {
            setVendorProfile(profile);
          }
        } catch (e) {
          console.error("Error loading vendor profile for card:", e);
        }
      }
    };
    loadVendorProfile();
  }, [product.vendorId]);

  const hasWholesale = !!(product.wholesalePrice && product.wholesaleMinQty);
  const wholesaleMin = product.wholesaleMinQty || 1;
  const wholesalePrice = product.wholesalePrice || product.price;

  const isWholesaleActive = hasWholesale && qty >= wholesaleMin;
  const activeUnitPrice = isWholesaleActive ? wholesalePrice : product.price;
  const totalPrice = activeUnitPrice * qty;

  // Calculate savings percentage and absolute savings
  const savingsPercent = hasWholesale
    ? Math.round(((product.price - wholesalePrice) / product.price) * 100)
    : 0;

  const totalSavings = isWholesaleActive
    ? (product.price - wholesalePrice) * qty
    : 0;

  const progressPercent = hasWholesale
    ? Math.min(100, (qty / wholesaleMin) * 100)
    : 0;

  const handleIncrement = () => {
    if (qty < product.stock) {
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
    setQty(Math.max(1, Math.min(product.stock, val)));
  };

  const handleJumpToWholesale = () => {
    if (hasWholesale && product.stock >= wholesaleMin) {
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
            src={activeImage}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Multiple Image Thumbnail Selector */}
          {productImages.length > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex space-x-1 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
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
          <span className="absolute top-3 left-3 bg-emerald-600/95 dark:bg-emerald-700/95 backdrop-blur-md text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
            {product.category}
          </span>

          {/* Heart Wishlist Button & Stock Badge */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md shadow-md transition-all transform active:scale-125 cursor-pointer ${
                isFavorite
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-rose-500"
              }`}
              title={isFavorite ? "Retirer de mes favoris" : "Ajouter à mes favoris"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
            </button>

            {product.stock === 0 ? (
              <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase">
                Rupture
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
            <p className="text-xs text-emerald-800 dark:text-emerald-200/90 line-clamp-2 leading-relaxed mt-1">
              {product.description}
            </p>
          </div>

          {/* Pricing Stats Grid */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-900/50 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/60 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">Prix de Détail :</span>
              <span className={`font-extrabold text-sm block ${isWholesaleActive ? "line-through text-slate-400 dark:text-slate-500" : "text-emerald-950 dark:text-white"}`}>
                {formatCurrency(product.price)}
              </span>
            </div>
            {hasWholesale ? (
              <div>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase font-mono block">Prix de Gros :</span>
                <span className={`font-extrabold text-sm block ${isWholesaleActive ? "text-amber-600 dark:text-amber-400 font-black text-base" : "text-slate-500 dark:text-slate-400"}`}>
                  {formatCurrency(wholesalePrice)}
                </span>
                <span className="text-[8px] text-amber-600 dark:text-amber-400 block font-bold uppercase mt-0.5">Dès {wholesaleMin} pièces</span>
              </div>
            ) : (
              <div>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono block">Vendeur vérifié :</span>
                <span className="font-semibold text-[10px] text-emerald-900 dark:text-emerald-200 truncate block mt-0.5">
                  {product.vendor?.name || "Boutique d'Assigamé"}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Wholesale Simulator Area */}
          {product.stock > 0 && (
            <div className="space-y-3 pt-1">
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
                    max={product.stock}
                    aria-label="Quantité souhaitée"
                    className="w-10 h-7 bg-emerald-50 dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-700 text-emerald-950 dark:text-white rounded-lg text-center text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={qty >= product.stock}
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
                        🔥 ÉCONOMIE DU GROS DE {formatCurrency(totalSavings)} !
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-300">
                        Ajoutez <strong className="text-amber-600 dark:text-amber-400 font-bold">{wholesaleMin - qty} pièces</strong> pour le prix de gros !
                      </span>
                    )}
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {qty}/{wholesaleMin} psc
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
            onClick={() => onBuy(product.id, qty)}
            className={`w-full font-bold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              product.stock === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : isWholesaleActive
                ? "bg-amber-500 hover:bg-amber-600 text-emerald-950 shadow-md shadow-amber-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{product.stock === 0 ? "En Rupture" : actionText}</span>
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
