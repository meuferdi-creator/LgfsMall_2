import React, { useState, useRef, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Mic, 
  Camera, 
  Heart, 
  User, 
  Sun, 
  Moon, 
  Globe, 
  Phone, 
  Tag, 
  Store, 
  Truck, 
  Menu, 
  ChevronDown, 
  Check, 
  LogOut,
  Sparkles,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Lock,
  Plus,
  TrendingUp,
  Info
} from "lucide-react";
import { translations, SupportedLanguage } from "../translations";
import { UserRole } from "../types";
import { useClickOutside } from "../hooks/useClickOutside";
import { checkWorkspaceAccess, getWorkspaceTooltipText } from "../lib/workspaceAuth";

interface LgfHeaderProps {
  user: any;
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  lang: SupportedLanguage;
  setLanguage: (l: SupportedLanguage) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  catalogSearch: string;
  setCatalogSearch: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  onOpenAuthModal: () => void;
  onOpenCartDrawer: () => void;
  onOpenWishlist: () => void;
  onOpenFlashDeals?: () => void;
  onOpenVendorPortal?: () => void;
  onOpenTrackOrders?: () => void;
  logout: () => void;
  formatCurrency: (amount: number) => string;
  activePortalRole?: UserRole;
  onChangePortalRole?: (role: UserRole) => void;
  onWorkspaceAccessDenied?: (role: UserRole, reason?: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CREATED") => void;
  isAuthLoading?: boolean;
}

const CATEGORIES = [
  "Tous",
  "Électronique",
  "Mode Homme",
  "Mode Femme",
  "Maison & Cuisine",
  "Beauté & Santé",
  "Informatique",
  "Téléphones & Tablettes",
  "Agro-Alimentaire",
  "Artisanat Togolais"
];

export default function LgfHeader({
  user,
  cartCount,
  cartTotal,
  wishlistCount,
  lang,
  setLanguage,
  theme,
  setTheme,
  catalogSearch,
  setCatalogSearch,
  selectedCategory,
  setSelectedCategory,
  onOpenAuthModal,
  onOpenCartDrawer,
  onOpenWishlist,
  onOpenFlashDeals,
  onOpenVendorPortal,
  onOpenTrackOrders,
  logout,
  formatCurrency,
  activePortalRole,
  onChangePortalRole,
  onWorkspaceAccessDenied,
  isAuthLoading = false
}: LgfHeaderProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currency, setCurrency] = useState("XOF FCFA");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const currencyDropdownRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(userMenuRef, () => setShowUserMenu(false), showUserMenu);
  useClickOutside(categoryDropdownRef, () => setShowCategoryDropdown(false), showCategoryDropdown);
  useClickOutside(langDropdownRef, () => setShowLangDropdown(false), showLangDropdown);
  useClickOutside(currencyDropdownRef, () => setShowCurrencyDropdown(false), showCurrencyDropdown);

  const t = translations[lang] || translations.FR;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catalogEl = document.getElementById("public-catalog") || document.getElementById("buyer-portal");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header id="lgf-header" className="lgf-header sticky top-0 z-40 bg-white dark:bg-emerald-950 border-b border-slate-200 dark:border-emerald-800/60 shadow-md relative">
      
      {/* Dynamic Authentication Progress Bar / Shimmer */}
      {isAuthLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-emerald-950/40">
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 animate-pulse shadow-sm" />
        </div>
      )}
      
      {/* 1. TOP ANNOUNCEMENT TICKER BAR (Scrolling Marquee Ticker) */}
      <div className="bg-amber-500 dark:bg-amber-500 text-slate-950 dark:text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b border-amber-600/40 overflow-hidden relative select-none shadow-xs">
        
        {/* Continuous Scrolling Marquee Track */}
        <div className="flex-1 overflow-hidden relative mr-4">
          <div className="animate-marquee flex items-center space-x-12 whitespace-nowrap cursor-pointer">
            {/* Loop Set 1 */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2 font-black text-slate-950 dark:text-slate-950">
                <span className="bg-slate-950 dark:bg-slate-950 text-amber-300 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono shadow-xs tracking-wide">
                  INFO LGF
                </span>
                <span>{t.welcomeTicker || "🌿 Bienvenue sur LGF's Mall — Le Marché Africain de Confiance !"}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <Store className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.becomeVendorTicker || "Devenez Vendeur Marchand — 0 FCFA Frais d'Inscription"}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <Tag className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.promoTicker || "Code Promo -10% :"} <strong className="bg-slate-950 dark:bg-slate-950 text-amber-300 dark:text-amber-300 px-2 py-0.5 rounded font-mono shadow-xs">LGF10</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <Truck className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.freeDeliveryTicker || "Livraison Offerte partout au Togo dès 25 000 FCFA"}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                <span>Paiement Sécurisé TMoney, Flooz & Cartes Visa/Mastercard en Séquestre</span>
              </div>
            </div>

            {/* Loop Set 2 (Identical duplicate for seamless continuous loop) */}
            <div className="flex items-center space-x-8" aria-hidden="true">
              <div className="flex items-center space-x-2 font-black text-slate-950 dark:text-slate-950">
                <span className="bg-slate-950 dark:bg-slate-950 text-amber-300 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono shadow-xs tracking-wide">
                  INFO LGF
                </span>
                <span>🌿 Bienvenue sur LGF's Mall — Le Marché Africain de Confiance !</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <Store className="w-3.5 h-3.5 text-slate-950" />
                <span>Devenez Vendeur Marchand — 0 FCFA Frais d'Inscription</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <Tag className="w-3.5 h-3.5 text-slate-950" />
                <span>Code Promo -10% : <strong className="bg-slate-950 dark:bg-slate-950 text-amber-300 dark:text-amber-300 px-2 py-0.5 rounded font-mono shadow-xs">LGF10</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <Truck className="w-3.5 h-3.5 text-slate-950" />
                <span>Livraison Offerte partout au Togo dès 25 000 FCFA</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-950 dark:text-slate-950 font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                <span>Paiement Sécurisé TMoney, Flooz & Cartes Visa/Mastercard en Séquestre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Shortcuts (Phone & Quick WhatsApp) */}
        <div className="flex items-center space-x-3 shrink-0 font-black text-[11px] bg-amber-500 dark:bg-amber-500 pl-3 z-10 text-slate-950 dark:text-slate-950">
          <a href="tel:+22872998148" className="hover:underline flex items-center space-x-1 text-slate-950 dark:text-slate-950">
            <Phone className="w-3.5 h-3.5 text-slate-950 dark:text-slate-950" />
            <span className="hidden sm:inline">+228 72 99 81 48</span>
          </a>
          <a
            href="https://wa.me/22872998148"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#20BA56] text-white px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all flex items-center space-x-1 shadow-xs"
          >
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 2. MAIN BRAND HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-yellow-400 shrink-0 font-display">
            L
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black font-display tracking-tight text-emerald-950 dark:text-white flex items-center">
              LGF's Mall
            </h1>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 dark:text-yellow-400 tracking-widest uppercase block -mt-1 font-mono">
              LE MARCHÉ AFRICAIN
            </span>
          </div>
        </div>

        {/* Search Bar (Centered, with Voice/Photo icons and Green Button) */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative hidden sm:flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-emerald-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder={t.searchPlaceholder || "Rechercher produits, marque..."}
              className="w-full bg-slate-100 dark:bg-emerald-900/50 border border-slate-200 dark:border-emerald-700/60 rounded-full py-2.5 pl-10 pr-24 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
            
            {/* Inner Icons (Mic, Camera) */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-slate-400 dark:text-emerald-400">
              <button 
                type="button" 
                className="hover:text-emerald-600 dark:hover:text-white cursor-pointer transition-colors"
                title="Recherche Vocale"
                onClick={() => alert("Recherche vocale activée. Parlez maintenant...")}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                className="hover:text-emerald-600 dark:hover:text-white cursor-pointer transition-colors"
                title="Recherche par Image"
                onClick={() => alert("Importez une photo pour trouver des articles similaires à Assigamé!")}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-full text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.searchBtn || "Rechercher"}</span>
          </button>
        </form>

        {/* Right Tools & Account Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          
          {/* Language Selector Dropdown */}
          <div ref={langDropdownRef} className="relative block">
            <button
              type="button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {lang === "FR" ? "Français 🇫🇷" : lang === "EN" ? "English 🇬🇧" : lang === "EWE" ? "Éwé 🇹🇬" : lang === "KABYE" ? "Kabyè 🇹🇬" : lang}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-2xl shadow-xl p-1 z-50 animate-in fade-in-50">
                {(["FR", "EN", "EWE", "KABYE"] as SupportedLanguage[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                      lang === l
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-900/50"
                    }`}
                  >
                    <span>
                      {l === "FR" ? "Français 🇫🇷" : l === "EN" ? "English 🇬🇧" : l === "EWE" ? "Éwé (Eʋegbe) 🇹🇬" : "Kabyè (Kabɩyɛ) 🇹🇬"}
                    </span>
                    {lang === l && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Dropdown */}
          <div ref={currencyDropdownRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-xs font-mono font-bold text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-all"
            >
              <span className="text-amber-500 font-extrabold">XOF</span>
              <span>FCFA</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCurrencyDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-2xl shadow-xl p-1 z-50">
                <button
                  onClick={() => { setCurrency("XOF FCFA"); setShowCurrencyDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900"
                >
                  XOF FCFA (Togo)
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-all"
            title={theme === "light" ? "Activer le Mode Sombre" : "Activer le Mode Clair"}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="p-2 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-900/50 cursor-pointer relative transition-all"
            title="Mes Favoris"
          >
            <Heart className={`w-4 h-4 ${wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* User Account / Connexion */}
          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 text-xs font-bold text-emerald-950 dark:text-white cursor-pointer hover:bg-emerald-100 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">{user.name}</span>
                <span className="text-[9px] bg-yellow-400 text-emerald-950 px-1.5 py-0.5 rounded font-black font-mono">
                  {user.role}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-emerald-900">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 truncate">{user.email}</p>
                  </div>

                  {/* Switch Role Portals */}
                  {onChangePortalRole && (
                    <div className="py-1">
                      <p className="text-[9px] font-extrabold text-slate-400 dark:text-emerald-500 uppercase px-3 py-1 font-mono">
                        Changer d'Espace :
                      </p>
                      {[
                        { 
                          role: "BUYER" as UserRole, 
                          label: "E-Boutique (Acheteur)", 
                          icon: ShoppingBag,
                          iconColor: "text-emerald-500" 
                        },
                        { 
                          role: "VENDOR" as UserRole, 
                          label: "Espace Vendeur", 
                          icon: Store,
                          iconColor: "text-amber-500" 
                        },
                        { 
                          role: "DRIVER" as UserRole, 
                          label: "Espace Chauffeur", 
                          icon: Truck,
                          iconColor: "text-blue-500" 
                        },
                        { 
                          role: "INVESTOR" as UserRole, 
                          label: "Espace Investisseur", 
                          icon: TrendingUp,
                          iconColor: "text-indigo-500" 
                        },
                        { 
                          role: "ADMIN" as UserRole, 
                          label: "Administration", 
                          icon: ShieldCheck,
                          iconColor: "text-purple-500" 
                        }
                      ].map((item) => {
                        const accessCheck = checkWorkspaceAccess(user, item.role);
                        const isCurrentActive = activePortalRole === item.role;
                        const tooltipText = getWorkspaceTooltipText(user, item.role);
                        const IconComponent = item.icon;

                        return (
                          <div key={item.role} className="relative group">
                            <button
                              id={`portal-nav-btn-${item.role.toLowerCase()}`}
                              title={tooltipText}
                              onClick={() => {
                                setShowUserMenu(false);
                                if (accessCheck.hasAccess) {
                                  onChangePortalRole(item.role);
                                } else {
                                  onWorkspaceAccessDenied?.(item.role, accessCheck.reason);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                isCurrentActive
                                  ? "bg-emerald-600 text-white font-extrabold shadow-sm"
                                  : "text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-900/50"
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${
                                  isCurrentActive ? "text-white" : item.iconColor
                                }`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                                {isCurrentActive ? (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                ) : !accessCheck.hasAccess ? (
                                  item.role === "ADMIN" ? (
                                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-emerald-600" />
                                  ) : (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                                      + Activer
                                    </span>
                                  )
                                ) : null}
                              </div>
                            </button>

                            {/* Informative Tooltip on Hover for restricted / actionable items */}
                            {!accessCheck.hasAccess && (
                              <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden md:group-hover:flex flex-col z-50 w-48 p-2 rounded-xl bg-slate-900 text-white text-[11px] font-medium leading-tight shadow-xl border border-slate-700 animate-in fade-in duration-150">
                                <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
                                  <Info className="w-3 h-3 shrink-0" />
                                  <span className="text-[10px] uppercase font-mono tracking-wider">Information</span>
                                </div>
                                <p className="text-slate-200 text-[10.5px]">
                                  {tooltipText}
                                </p>
                                <span className="text-[9px] text-emerald-400 font-bold mt-1">
                                  {item.role === "ADMIN" ? "🔒 Accès restreint" : "✨ Cliquez pour créer"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-100 dark:border-emerald-900">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-emerald-700 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-all shadow-xs"
            >
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left hidden sm:block leading-none">
                <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-normal block">Connexion</span>
                <span className="font-extrabold">Mon compte</span>
              </div>
            </button>
          )}

          {/* Panier Button (Green pill with cart icon & total) */}
          <button
            type="button"
            onClick={onOpenCartDrawer}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 cursor-pointer active:scale-95 shrink-0"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-emerald-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden xs:inline sm:inline font-bold">Panier</span>
            {cartTotal > 0 && (
              <span className="hidden md:inline bg-emerald-800/80 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-yellow-300">
                {formatCurrency(cartTotal)}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* 3. SUB-HEADER / CATEGORY NAVIGATION BAR */}
      <div className="bg-slate-100 dark:bg-emerald-950 border-t border-b border-slate-200 dark:border-emerald-800/60 px-4 sm:px-6 lg:px-8 py-2 text-xs font-extrabold text-slate-900 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-xs relative z-30">
        
        {/* Left: Category Menu Dropdown & Quick Category Tabs */}
        <div className="flex items-center space-x-3 min-w-0">
          
          {/* "Toutes les catégories" Dropdown Trigger */}
          <div className="relative shrink-0" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>{t.allCategories || "Toutes les catégories"}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showCategoryDropdown && (
              <>
                {/* Transparent backdrop overlay on screen to close dropdown on tap outside */}
                <div 
                  className="fixed inset-0 z-[90] bg-slate-950/20 backdrop-blur-[1px]" 
                  onClick={() => setShowCategoryDropdown(false)} 
                />

                {/* Category Dropdown Menu Box */}
                <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-emerald-950 border-2 border-emerald-500 dark:border-emerald-600 rounded-2xl shadow-2xl p-2 z-[100] text-xs max-h-[75vh] overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                        const catEl = document.getElementById("catalog-section") || document.getElementById("public-catalog") || document.getElementById("buyer-portal");
                        if (catEl) catEl.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-emerald-900/80"
                      }`}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Direct Category Quick Links (Scrollable Container) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-0.5 whitespace-nowrap min-w-0">
            {["Électronique", "Mode Homme", "Mode Femme", "Maison & Cuisine", "Beauté & Santé"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  const catEl = document.getElementById("catalog-section") || document.getElementById("public-catalog") || document.getElementById("buyer-portal");
                  if (catEl) catEl.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white font-black shadow-sm"
                    : "text-slate-900 dark:text-emerald-100 hover:bg-slate-200 dark:hover:bg-emerald-800/60 font-extrabold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Right Quick Action Shortcuts */}
        <div className="flex items-center space-x-3 shrink-0 whitespace-nowrap text-xs font-black">
          <button
            onClick={() => onOpenFlashDeals ? onOpenFlashDeals() : null}
            className="flex items-center space-x-1 text-amber-950 dark:text-amber-300 hover:underline cursor-pointer bg-amber-400/20 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-400/60 dark:border-amber-700 shadow-2xs"
          >
            <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.flashDeals || "Ventes Flash"}</span>
          </button>

          <button
            onClick={() => onOpenVendorPortal ? onOpenVendorPortal() : null}
            className="flex items-center space-x-1 text-slate-900 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-amber-300 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.sellOnLgf || "Vendre sur LGF"}</span>
          </button>

          <button
            onClick={() => onOpenTrackOrders ? onOpenTrackOrders() : null}
            className="hidden sm:flex items-center space-x-1 text-slate-900 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-amber-300 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.trackOrder || "Suivre ma commande"}</span>
          </button>
        </div>

      </div>

    </header>
  );
}
