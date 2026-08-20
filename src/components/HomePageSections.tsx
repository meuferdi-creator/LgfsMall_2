import React, { useState } from "react";
import { 
  Tv, 
  User, 
  Shirt, 
  Home, 
  Sparkles, 
  Smartphone, 
  Laptop, 
  ShoppingBag, 
  Dumbbell, 
  Baby, 
  Car, 
  Palette, 
  Tag, 
  Truck, 
  ShieldCheck, 
  Store, 
  TrendingUp, 
  ArrowRight, 
  QrCode, 
  Apple, 
  Play, 
  Copy, 
  Check, 
  Star,
  Clock
} from "lucide-react";
import { Product } from "../types";
import ProductCard from "./ProductCard";

interface HomePageSectionsProps {
  products: Product[];
  formatCurrency: (amount: number) => string;
  onSelectCategory: (category: string) => void;
  onBuyProduct: (productId: string, quantity: number) => void;
  onOpenDetail?: (product: Product) => void;
}

const CATEGORY_ITEMS = [
  { id: "Électronique", label: "Électronique", count: "3 produits", icon: Tv, bg: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "Mode Homme", label: "Mode Homme", count: "2 produits", icon: User, bg: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { id: "Mode Femme", label: "Mode Femme", count: "2 produits", icon: Shirt, bg: "bg-pink-50 text-pink-600 border-pink-200" },
  { id: "Maison & Cuisine", label: "Maison & Cuisine", count: "2 produits", icon: Home, bg: "bg-amber-50 text-amber-600 border-amber-200" },
  { id: "Beauté & Santé", label: "Beauté & Santé", count: "2 produits", icon: Sparkles, bg: "bg-rose-50 text-rose-600 border-rose-200" },
  { id: "Téléphones", label: "Téléphones", count: "4 produits", icon: Smartphone, bg: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { id: "Ordinateurs", label: "Ordinateurs", count: "2 produits", icon: Laptop, bg: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { id: "Épicerie", label: "Épicerie", count: "2 produits", icon: ShoppingBag, bg: "bg-lime-50 text-lime-600 border-lime-200" },
  { id: "Sport & Loisirs", label: "Sport & Loisirs", count: "1 produit", icon: Dumbbell, bg: "bg-orange-50 text-orange-600 border-orange-200" },
  { id: "Bébé & Enfant", label: "Bébé & Enfant", count: "1 produit", icon: Baby, bg: "bg-purple-50 text-purple-600 border-purple-200" },
  { id: "Auto & Moto", label: "Auto & Moto", count: "0 produit", icon: Car, bg: "bg-slate-50 text-slate-600 border-slate-200" },
  { id: "Artisanat Africain", label: "Artisanat Africain", count: "1 produit", icon: Palette, bg: "bg-teal-50 text-teal-600 border-teal-200" }
];

const STORES = [
  { id: "s1", name: "Abidjan Connect", category: "Électronique & High-Tech", location: "Lomé • Bè Kpota", rating: 4.9, image: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80" },
  { id: "s2", name: "Atelier Kpalimé", category: "Artisanat & Sculptures", location: "Kpalimé • Centre", rating: 4.8, image: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=400&q=80" },
  { id: "s3", name: "Kara Electronics", category: "Smartphones & TV", location: "Kara • Grand Marché", rating: 4.7, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80" },
  { id: "s4", name: "Sokodé Agricole", category: "Produits Vivriers & Épicerie", location: "Sokodé • Commercial", rating: 4.9, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80" },
  { id: "s5", name: "LGF's Mall Officiel", category: "Boutique Certifiée LGF", location: "Lomé • Blvd Mono", rating: 5.0, image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80" }
];

const POPULAR_BRANDS = [
  { name: "Adidas", logo: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=200&q=80" },
  { name: "Apple", logo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&q=80" },
  { name: "Infinix", logo: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=200&q=80" },
  { name: "L'Oréal", logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80" },
  { name: "Nike", logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80" },
  { name: "Nivea", logo: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80" },
  { name: "Samsung", logo: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&q=80" },
  { name: "Tecno", logo: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=200&q=80" }
];

export default function HomePageSections({
  products,
  formatCurrency,
  onSelectCategory,
  onBuyProduct,
  onOpenDetail
}: HomePageSectionsProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const bestSellers = products.slice(0, 6);
  const newArrivals = products.slice(2, 7);
  const trendingProducts = products.slice(0, 6);

  return (
    <div className="high-contrast-fix space-y-12 my-8">
      
      {/* 1. ACHETER PAR CATÉGORIE GRID */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              Acheter par catégorie
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">
              Explorez nos rayons et trouvez ce dont vous avez besoin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {CATEGORY_ITEMS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="bg-white dark:bg-emerald-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-emerald-800/60 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cat.bg}`}>
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {cat.label}
                  </h4>
                  <span className="text-[10px] text-slate-400 dark:text-emerald-300/80 font-mono block mt-0.5 font-medium">
                    {cat.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. FEATURE ACTION BANNERS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 rounded-2xl shadow-md border border-emerald-500/30 space-y-3 flex flex-col justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Paiement Mobile Money</h4>
              <p className="text-[11px] text-emerald-100">Moov Money, MTN, Mixx Yas</p>
            </div>
          </div>
          <p className="text-xs text-emerald-50/90 leading-relaxed">
            Réglez vos achats en un instant par code USSD ou QR Code. Séquestre LGF garantit votre argent.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 rounded-2xl shadow-md border border-amber-400/30 space-y-3 flex flex-col justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Livraison express à Lomé</h4>
              <p className="text-[11px] text-amber-100">Expédition sous 24h chrono</p>
            </div>
          </div>
          <p className="text-xs text-amber-50/90 leading-relaxed">
            Livraison à domicile ou en point relais dans tout le Togo et la sous-région UEMOA.
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-700 space-y-3 flex flex-col justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Artisanat local</h4>
              <p className="text-[11px] text-slate-300">Kpalimé, Sokodé, Dapaong</p>
            </div>
          </div>
          <p className="text-xs text-slate-200/90 leading-relaxed">
            Soutenez le savoir-faire africain et achetez directement auprès de nos créateurs locaux.
          </p>
        </div>

      </section>

      {/* 3. MEILLEURES VENTES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Meilleures ventes
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">
              Les articles les plus plébiscités par nos acheteurs ce mois-ci
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bestSellers.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              formatCurrency={formatCurrency}
              onBuy={onBuyProduct}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </section>

      {/* 4. COUPONS & OFFRES */}
      <section className="bg-white dark:bg-emerald-900/40 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-emerald-800/60 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Coupons & Offres Exclusives</h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/90 font-medium">Copiez le code et appliquez-le lors de votre commande</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-emerald-900/80 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider font-mono">Remise Spéciale Togo</span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">-2 000 FCFA sur votre panier</h4>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/90 font-medium">Valable dès 20 000 FCFA d'achat sur tout le site</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode("TOGO2000")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-sm"
            >
              {copiedCode === "TOGO2000" ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === "TOGO2000" ? "Copié !" : "TOGO2000"}</span>
            </button>
          </div>

          <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-amber-900/60 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider font-mono">Spécial Artisanat</span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">-10% sur l'Artisanat Local</h4>
              <p className="text-[11px] text-slate-500 dark:text-amber-200/90 font-medium">Valable sur tous les pagnes et objets faits main</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode("LGF10")}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-sm"
            >
              {copiedCode === "LGF10" ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === "LGF10" ? "Copié !" : "LGF10"}</span>
            </button>
          </div>

        </div>
      </section>

      {/* 5. NOUVEAUTÉS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center">
              <Clock className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Nouveautés
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">
              Les derniers arrivages ajoutés par nos boutiques partenaires
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {newArrivals.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              formatCurrency={formatCurrency}
              onBuy={onBuyProduct}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </section>

      {/* 6. BOUTIQUES PRÈS DE CHEZ VOUS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center">
              <Store className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Boutiques près de chez vous
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">
              Achetez directement dans les commerces certifiés LGF
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STORES.map((st) => (
            <div 
              key={st.id}
              className="bg-white dark:bg-emerald-900/50 rounded-2xl p-4 border border-slate-200/80 dark:border-emerald-800/60 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <img src={st.image} alt={st.name} referrerPolicy="no-referrer" className="w-full h-28 object-cover rounded-xl" />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{st.name}</h4>
                  <div className="flex items-center text-[10px] text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                    <span>{st.rating}</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{st.category}</span>
                <span className="text-[10px] text-slate-400 dark:text-emerald-300/80 font-medium block">{st.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. TENDANCES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
              Tendances du moment
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">
              Les produits viraux les plus consultés à Lomé et dans la région
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              formatCurrency={formatCurrency}
              onBuy={onBuyProduct}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </section>

      {/* 8. MARQUES POPULAIRES */}
      <section className="bg-white dark:bg-emerald-900/30 p-6 rounded-3xl border border-slate-200/80 dark:border-emerald-800/50 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
          Marques populaires disponibles
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 items-center">
          {POPULAR_BRANDS.map((br) => (
            <div key={br.name} className="p-3 bg-slate-50 dark:bg-emerald-950/40 rounded-xl border border-slate-200/60 dark:border-emerald-800/40 flex items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{br.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 9. LGF'S MALL DANS VOTRE POCHE - APP DOWNLOAD BANNER (MATCHES SCREENSHOT) */}
      <section className="bg-[#f8f7f2] dark:bg-emerald-950/80 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/90 dark:border-emerald-800/60 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Copy, Badges, Store Buttons */}
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase text-slate-700 dark:text-emerald-300 bg-white/90 dark:bg-emerald-900/80 border border-slate-200 dark:border-emerald-800 font-mono shadow-2xs">
              📱 APPLICATION MOBILE
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              LGF's Mall dans votre <span className="text-[#a17e20] dark:text-amber-400">poche</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg font-medium">
              Téléchargez l'application et shoppez partout en Afrique. Notifications de ventes flash en temps réel, suivi de commande en direct, paiement Mobile Money intégré.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-200 border border-slate-200/90 dark:border-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Alertes flash</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-200 border border-slate-200/90 dark:border-emerald-800 shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Suivi live</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-200 border border-slate-200/90 dark:border-emerald-800 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Paiement sécurisé</span>
              </div>
            </div>

            {/* Store Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => alert("Application iOS disponible très prochainement sur l'App Store.")}
                className="bg-black hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2.5 transition-all cursor-pointer shadow-md"
              >
                <Apple className="w-5 h-5 fill-white shrink-0" />
                <div className="text-left leading-tight">
                  <span className="text-[8px] text-slate-300 uppercase block font-medium">Télécharger sur</span>
                  <span className="font-extrabold text-xs">App Store</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => alert("Application Android disponible incessamment.")}
                className="bg-black hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2.5 transition-all cursor-pointer shadow-md"
              >
                <Play className="w-4 h-4 fill-white text-white shrink-0" />
                <div className="text-left leading-tight">
                  <span className="text-[8px] text-slate-300 uppercase block font-medium">Disponible sur</span>
                  <span className="font-extrabold text-xs">Google Play</span>
                </div>
              </button>
            </div>

            {/* Rating Subtext */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">4.8</span>
              <span>· +50 000 téléchargements</span>
            </div>
          </div>

          {/* Right Column: QR Code Box + Phone Frame Mockup */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end gap-4 sm:gap-6 pt-4 lg:pt-0">
            
            {/* QR Code Box */}
            <div className="bg-white dark:bg-emerald-900 p-5 rounded-2xl border border-slate-200/90 dark:border-emerald-800 shadow-xs text-center flex flex-col items-center justify-center space-y-2 shrink-0 w-40 sm:w-44">
              <div className="p-2 bg-slate-50 dark:bg-emerald-950 rounded-xl border border-slate-100 dark:border-emerald-800">
                <QrCode className="w-20 h-20 text-slate-900 dark:text-white" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">Scannez pour installer</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-mono">iOS & Android</span>
            </div>

            {/* Phone Mockup Frame */}
            <div className="relative w-44 sm:w-52 h-[320px] sm:h-[350px] bg-slate-950 rounded-[32px] border-4 border-slate-900 shadow-2xl p-2 overflow-hidden shrink-0 flex flex-col justify-between">
              {/* Dynamic Island Notch */}
              <div className="w-16 h-3 bg-black rounded-full mx-auto shrink-0 z-20"></div>

              {/* Screen Preview Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-85 rounded-[26px]"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent"></div>
              </div>

              {/* Bottom Screen Badge */}
              <div className="relative z-10 mt-auto text-center pb-2">
                <span className="inline-block bg-white text-emerald-900 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md font-mono">
                  LGF's Mall
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
