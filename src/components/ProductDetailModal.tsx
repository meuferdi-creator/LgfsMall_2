import React, { useState, useEffect } from "react";
import { 
  X, 
  Star, 
  ShoppingBag, 
  Share2, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Layers, 
  Check, 
  HelpCircle, 
  User as UserIcon, 
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import { Product } from "../types";
import { firestoreSync } from "../lib/firebase";

interface ProductDetailModalProps {
  product: Product;
  products: Product[];
  onClose: () => void;
  formatCurrency: (value: number) => string;
  onAddToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  onBuyNow: (productId: string, quantity: number) => void;
  isInWishlist: boolean;
  onToggleWishlist: (productId: string) => void;
}

const CATEGORY_IMAGES: Record<string, string[]> = {
  "Mode & Textiles": [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=800&auto=format&fit=crop&q=80"
  ],
  "Cosmétiques & Beauté": [
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1608248597481-496100c80836?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80"
  ],
  "Alimentation": [
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8c55f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1470304781262-411036780e7b?w=800&auto=format&fit=crop&q=80"
  ],
  "Électronique": [
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80"
  ]
};

const SPECIFICATIONS: Record<string, Record<string, string>> = {
  "Mode & Textiles": {
    "Matière": "100% Coton Premium (Pagne Africain véritable)",
    "Poids": "0.45 kg / mètre",
    "Origine": "Tissé main à Lomé, Togo",
    "Entretien": "Lavage à la main ou machine délicat (30°C)"
  },
  "Cosmétiques & Beauté": {
    "Composition": "Beurre de Karité brut, Huile de coco bio, Parfums naturels",
    "Poids": "250g net",
    "Origine": "Kloto, Togo",
    "Certification": "Bio-Togo certifié"
  },
  "Alimentation": {
    "Ingrédients": "Grains de café robusta torréfiés localement",
    "Poids": "500g",
    "Origine": "Kpalimé, Togo",
    "Emballage": "Sachet biodégradable hermétique"
  },
  "Électronique": {
    "Alimentation": "Batterie rechargeable Lithium-ion 4000mAh",
    "Garantie": "12 mois constructeur",
    "Connectivité": "Bluetooth 5.2 / Câble USB-C",
    "Inclus": "Chargeur rapide homologué CE"
  }
};

const REVIEWS = [
  { name: "Koffi A.", rating: 5, date: "Il y a 3 jours", text: "Qualité exceptionnelle ! Je l'ai acheté pour ma boutique à Assigamé, les clients adorent.", verified: true },
  { name: "Afiwa M.", rating: 4, date: "Il y a 1 semaine", text: "Très bon article, conforme à la description. Livraison rapide à Kara en 48h.", verified: true },
  { name: "Yaovi T.", rating: 5, date: "Il y a 2 semaines", text: "Le service séquestre de LGF m'a donné confiance pour commander. Top !", verified: true },
  { name: "Fati S.", rating: 5, date: "Il y a 3 semaines", text: "Super produit, très authentique. Les prix de gros sont imbattables.", verified: true }
];

export default function ProductDetailModal({
  product,
  products,
  onClose,
  formatCurrency,
  onAddToCart,
  onBuyNow,
  isInWishlist,
  onToggleWishlist
}: ProductDetailModalProps) {
  const [activeImage, setActiveImage] = useState(product.image || "");
  const [selectedSize, setSelectedSize] = useState("Standard");
  const [selectedColor, setSelectedColor] = useState("Original");
  const [qty, setQty] = useState(1);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load secondary images
  const extraImages = CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES["Mode & Textiles"];
  const allImages = [product.image || extraImages[0], ...extraImages.slice(1)];

  useEffect(() => {
    setActiveImage(product.image || allImages[0]);
    setQty(1);
    setSelectedSize(product.category === "Mode & Textiles" ? "Standard (6 Yards)" : "Standard");
    setSelectedColor("Original");
  }, [product]);

  useEffect(() => {
    const loadVendorProfile = async () => {
      if (product.vendorId) {
        try {
          const profile = await firestoreSync.getDocument("vendors", product.vendorId);
          if (profile) {
            setVendorProfile(profile);
          }
        } catch (e) {
          console.error("Error loading vendor profile for modal:", e);
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

  const savingsPercent = hasWholesale
    ? Math.round(((product.price - wholesalePrice) / product.price) * 100)
    : 0;

  const totalSavings = isWholesaleActive
    ? (product.price - wholesalePrice) * qty
    : 0;

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const similarProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const colors = ["Original", "Bleu Indigo", "Vert Forêt", "Or Royal", "Rouge Cerise"];
  const sizes = product.category === "Mode & Textiles" 
    ? ["Standard (6 Yards)", "Demi-pagne (3 Yards)", "Coupe sur-mesure"]
    : ["Standard", "Format Voyage", "Format Enterprise"];

  const specs = SPECIFICATIONS[product.category] || SPECIFICATIONS["Mode & Textiles"];

  return (
    <div 
      className="fixed inset-0 bg-emerald-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden border border-emerald-100 shadow-2xl flex flex-col my-4 sm:my-8 relative text-emerald-950 animate-scale-in">
        
        {/* Top Header Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <button
            onClick={onClose}
            aria-label="Retour aux articles"
            className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-emerald-600 font-bold text-xs transition-all cursor-pointer bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200/50"
          >
            <span>← Retour aux articles</span>
          </button>
          
          <span id="product-detail-modal-title" className="text-xs font-mono font-bold text-emerald-600 hidden sm:inline uppercase">Détails de l'article</span>
          
          <button 
            onClick={onClose}
            aria-label="Fermer la fiche produit"
            className="text-slate-400 hover:text-rose-600 p-1.5 transition-all cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto max-h-[80vh]">
          
          {/* LEFT COLUMN: Gallery & Zoom */}
          <div className="md:col-span-5 p-4 sm:p-6 bg-slate-50 flex flex-col justify-between border-r border-emerald-100/50">
            <div className="space-y-4">
              
              {/* Main Image Display with zoom */}
              <div 
                className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-emerald-100/40 shadow-sm cursor-zoom-in flex items-center justify-center"
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <img 
                  src={activeImage} 
                  alt={product.title} 
                  referrerPolicy="no-referrer"
                  className={`max-w-full max-h-full object-contain bg-white transition-transform duration-300 ${isZoomed ? "scale-150" : "scale-100"}`} 
                />
                <span className="absolute bottom-3 right-3 bg-emerald-950/60 backdrop-blur-md text-white text-[9px] px-2.5 py-1 rounded-lg uppercase font-mono font-bold tracking-wider">
                  {isZoomed ? "Cliquez pour réduire" : "Cliquez pour zoomer"}
                </span>

                {isWholesaleActive && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-emerald-950 text-[9px] font-black uppercase px-2 py-1 rounded-lg shadow animate-pulse">
                    Gros appliqué
                  </span>
                )}
              </div>

              {/* Thumbnails list */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImage(img); setIsZoomed(false); }}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer flex items-center justify-center bg-white ${
                      activeImage === img ? "border-emerald-600 scale-105 shadow-md" : "border-slate-200 hover:border-emerald-200"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
                  </button>
                ))}
              </div>

            </div>

            {/* Wishlist & Share buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
              <button
                onClick={() => onToggleWishlist(product.id)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  isInWishlist
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{isInWishlist ? "Dans mes favoris" : "Ajouter aux favoris"}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="py-3 px-4 rounded-xl text-xs font-bold border bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center space-x-2 relative"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? "Lien copié !" : "Partager"}</span>
              </button>
            </div>

            {/* Secure Escrow notice */}
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start space-x-3 text-emerald-800 text-[11px] leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-emerald-950">Protection Escrow LGF</span>
                Les fonds sont gardés en séquestre sécurisé. Le vendeur n'est payé que lorsque vous confirmez la livraison de l'article avec votre code OTP unique.
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Product details & actions */}
          <div className="md:col-span-7 p-4 sm:p-6 space-y-6 overflow-y-auto">
            
            {/* Header info */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block font-mono">
                {product.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-display tracking-tight leading-tight">
                {product.title}
              </h2>
              
              {/* Rating and short stats */}
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="font-extrabold text-amber-600">4.8</span>
                <span className="text-slate-400 font-medium">|</span>
                <span className="text-slate-500 font-semibold">24 avis vérifiés d'Assigamé</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-emerald-500 uppercase font-mono block">Prix de Détail :</span>
                <span className={`font-extrabold text-lg block ${isWholesaleActive ? "line-through text-slate-400" : "text-emerald-950"}`}>
                  {formatCurrency(product.price)}
                </span>
              </div>
              <div>
                {hasWholesale ? (
                  <>
                    <span className="text-[9px] font-bold text-amber-600 uppercase font-mono block">Prix de Gros :</span>
                    <span className={`font-extrabold text-lg block ${isWholesaleActive ? "text-amber-600 font-black" : "text-slate-500"}`}>
                      {formatCurrency(wholesalePrice)}
                    </span>
                    <span className="text-[8px] text-amber-600 font-bold block uppercase mt-0.5">Dès {wholesaleMin} pièces (-{savingsPercent}%)</span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase font-mono block">Statut du Stock :</span>
                    <span className={`text-xs font-bold block mt-1 ${product.stock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {product.stock > 0 ? `En Stock (${product.stock} dispo)` : "En rupture"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Variations / Options */}
            <div className="space-y-4">
              {/* Color selectors */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Variation de couleur :</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        selectedColor === c
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Options de taille / Dimensions :</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        selectedSize === s
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description & Specs Tabs */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Description complète :</span>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {product.description}
              </p>

              {/* Specs Table */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2 mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono mb-2">Fiche technique de l'article</span>
                <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                  {Object.entries(specs).map(([key, val]) => (
                    <React.Fragment key={key}>
                      <span className="text-slate-500 font-semibold">{key} :</span>
                      <span className="text-emerald-950 font-bold">{val}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Estimate */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70 flex items-start space-x-3 text-xs leading-relaxed">
              <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-800 block">Délais de Livraison & Transport</span>
                <b>Lomé (Assigamé/Bè) :</b> Livraison sécurisée sous 24h • <b>Régions (Kara/Dapaong) :</b> 48h à 72h par nos transporteurs partenaires agréés.
              </div>
            </div>

            {/* Vendor mini Profile */}
            <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100/50 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold font-mono text-sm uppercase shrink-0">
                  {product.vendor?.name?.slice(0, 2) || "VD"}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase block font-mono">Vendeur vérifié</span>
                  <span className="font-extrabold text-xs text-emerald-950 block truncate">
                    {product.vendor?.name || "Boutique d'Assigamé"}
                  </span>
                  <span className="text-[10px] text-emerald-600/90 font-semibold block">
                    ★ 4.9 (48 ventes complétées)
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                <span className="hidden sm:inline bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                  KYC Approved
                </span>
                <a
                  href={`https://wa.me/${(vendorProfile?.whatsapp || product.vendor?.phone || "22872998148").replace(/\s+/g, "").replace(/\+/g, "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Bonjour, je vous contacte à propos du produit "${product.title}" vu sur LGF's Mall.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20BA56] text-white p-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Contacter sur WhatsApp"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.906-6.99C16.255 1.876 13.779.844 11.14.844c-5.443 0-9.87 4.424-9.873 9.871-.001 1.773.476 3.51 1.381 5.035l-.934 3.415 3.493-.916zm10.742-7.447c-.29-.145-1.716-.847-1.98-.942-.262-.096-.453-.145-.642.145-.19.29-.733.942-.897 1.13-.164.19-.327.21-.617.066-.29-.145-1.223-.45-2.33-1.439-.861-.767-1.443-1.715-1.611-2.005-.168-.29-.018-.445.127-.589.13-.13.29-.34.435-.51.145-.17.19-.29.29-.483.096-.19.048-.36-.024-.505-.072-.145-.642-1.545-.88-2.115-.23-.553-.463-.48-.642-.48-.166-.003-.357-.003-.548-.003-.19 0-.501.072-.763.36-.262.29-1.002.978-1.002 2.38 0 1.402 1.02 2.753 1.163 2.946.143.19 2.01 3.067 4.869 4.298.68.293 1.21.468 1.62.598.683.217 1.303.186 1.793.113.546-.08 1.716-.702 1.958-1.381.242-.68.242-1.26.17-1.38-.073-.12-.267-.19-.557-.335z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Interactive simulator controls */}
            {product.stock > 0 ? (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase font-mono">Quantité à commander :</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                      className="w-8 h-8 bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-lg flex items-center justify-center font-bold text-xs hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                      min={1}
                      max={product.stock}
                      className="w-12 h-8 bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-lg text-center text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      disabled={qty >= product.stock}
                      className="w-8 h-8 bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-lg flex items-center justify-center font-bold text-xs hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bulk Savings warning bar */}
                {hasWholesale && (
                  <div className="flex justify-between items-center text-[10px] font-bold bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    {isWholesaleActive ? (
                      <span className="text-amber-600">
                        🔥 Tarif de gros appliqué ! Économie de {formatCurrency(totalSavings)}
                      </span>
                    ) : (
                      <span className="text-emerald-700">
                        Ajoutez <strong className="text-amber-600 font-bold">{wholesaleMin - qty} pièces</strong> pour débloquer le prix de gros !
                      </span>
                    )}
                    <span className="text-slate-400 font-mono">Min gros: {wholesaleMin} psc</span>
                  </div>
                )}

                {/* Total price section & buttons */}
                <div className="flex justify-between items-end pt-3">
                  <div>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase block font-mono">Total du lot :</span>
                    <span className="font-extrabold text-emerald-950 text-xl leading-none">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  {isWholesaleActive && (
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border border-amber-200">
                      Prix de gros appliqué
                    </span>
                  )}
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => {
                      onAddToCart(product, qty, selectedSize, selectedColor);
                      onClose();
                    }}
                    className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-800" />
                    <span>Ajouter au Panier</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onBuyNow(product.id, qty);
                      onClose();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    <span>Acheter Immédiatement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                <p className="text-xs font-bold text-rose-600">⚠️ Cet article est actuellement en rupture de stock.</p>
                <p className="text-[10px] text-rose-500 mt-1">Vous pouvez contacter le vendeur via WhatsApp pour connaître la date de réapprovisionnement.</p>
              </div>
            )}

          </div>

        </div>

        {/* REVIEWS SECTION */}
        <div className="bg-slate-50 p-6 border-t border-emerald-100/50 space-y-4">
          <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center">
            <UserIcon className="w-4 h-4 mr-2 text-emerald-600" />
            Avis des acheteurs certifiés ({REVIEWS.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REVIEWS.map((rev, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-emerald-100/30 space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-950">{rev.name}</span>
                    {rev.verified && (
                      <span className="ml-2 text-[8px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-150 px-1 py-0.5 rounded uppercase">
                        Acheteur vérifié
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{rev.date}</span>
                </div>
                <div className="flex text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* SIMILAR PRODUCTS SECTION */}
        {similarProducts.length > 0 && (
          <div className="p-6 border-t border-emerald-100/50 space-y-4 bg-white">
            <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center">
              <Layers className="w-4 h-4 mr-2 text-emerald-600" />
              Articles similaires suggérés
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarProducts.map((p) => {
                const isWholesaleSim = p.wholesalePrice && p.wholesaleMinQty;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      // Switch to similar product!
                      onBuyNow(p.id, 1);
                    }}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/20 border border-slate-100 hover:border-emerald-200 rounded-2xl transition-all cursor-pointer flex space-x-3 items-center group"
                  >
                    <img 
                      src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"} 
                      alt={p.title} 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-xl" 
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-bold text-emerald-950 truncate group-hover:text-emerald-600 transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-xs font-extrabold text-emerald-950 mt-0.5">
                        {formatCurrency(p.price)}
                      </p>
                      {isWholesaleSim && (
                        <span className="text-[8px] font-bold text-amber-600 block uppercase font-mono mt-0.5">
                          Gros disponible
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
