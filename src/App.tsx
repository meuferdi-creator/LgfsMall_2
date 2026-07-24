import React, { useEffect, useState } from "react";
import { useAppStore } from "./store";
import { translations, SupportedLanguage } from "./translations";
import { UserRole } from "./types";
import BuyerPortal from "./components/BuyerPortal";
import VendorPortal from "./components/VendorPortal";
import InvestorPortal from "./components/InvestorPortal";
import DriverPortal from "./components/DriverPortal";
import AdminPortal from "./components/AdminPortal";
import SeoStructuredData from "./components/SeoStructuredData";
import LiveCommerce from "./components/LiveCommerce";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import KycDocumentUploader from "./components/KycDocumentUploader";
import { PasswordInput } from "./components/PasswordInput";
import { PasswordResetModal } from "./components/PasswordResetModal";
import { executeGoogleSignIn, isFirebaseConfigured } from "./lib/firebase";
import { 
  ShoppingBag, 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  Phone, 
  ArrowRight, 
  Coins, 
  Truck, 
  TrendingUp, 
  Tv,
  FileText,
  Clock,
  LogOut,
  ChevronRight,
  Plus,
  Trash,
  Edit,
  Search,
  Eye,
  Sun,
  Moon,
  Home,
  Grid,
  ShoppingCart,
  User
} from "lucide-react";

export default function App() {
  const {
    user,
    token,
    lang,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    stats,
    pendingKycs,
    allUsers,
    products,
    vendorProducts,
    buyerOrders,
    vendorOrders,
    investments,
    isLoading,
    error,
    successMessage,
    setLanguage,
    clearMessages,
    initSession,
    login,
    loginWithGoogle,
    register,
    logout,
    fetchStats,
    submitKyc,
    fetchPendingKycs,
    fetchAllUsers,
    verifyKyc,
    fetchProducts,
    fetchVendorProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    placeOrder,
    fetchBuyerOrders,
    fetchVendorOrders,
    confirmOrderDelivery,
    withdrawEscrowFunds,
    fetchInvestments,
    createInvestment
  } = useAppStore();

  // Role-specific workspace tab selections
  const [buyerTab, setBuyerTab] = useState<"catalog" | "history" | "order">("catalog");
  const [vendorTab, setVendorTab] = useState<"escrow" | "articles" | "form" | "sales">("articles");
  const [investorTab, setInvestorTab] = useState<"portfolio" | "fund" | "ledger">("portfolio");

  const [pendingPurchase, setPendingPurchase] = useState<{ productId: string; quantity: number } | null>(null);

  // Catalog search & filtering states
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Tous");

  // Ordering form state
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQty, setOrderQty] = useState(1);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState("TMoney");
  const [orderPhone, setOrderPhone] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Vendor product creation / editing form state
  const [prodTitle, setProdTitle] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodWholesalePrice, setProdWholesalePrice] = useState("");
  const [prodWholesaleMinQty, setProdWholesaleMinQty] = useState("");
  const [prodStock, setProdStock] = useState("10");
  const [prodCategory, setProdCategory] = useState("Mode & Textiles");
  const [prodImage, setProdImage] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Investor financing states
  const [investAmount, setInvestAmount] = useState("500000");
  const [investCampaign, setInvestCampaign] = useState("textiles");

  // Withdrawal form states
  const [withdrawMethod, setWithdrawMethod] = useState("TMoney");
  const [withdrawAccount, setWithdrawAccount] = useState("");

  // Admin Sandbox Role Switcher state
  const [sandboxRole, setSandboxRole] = useState<UserRole>("ADMIN");
  const [currentDashboardView, setCurrentDashboardView] = useState<"workspace" | "live">("workspace");

  // Auth toggle ("login" | "register")
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Registration form state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("BUYER");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // KYC submission form state
  const [kycDocType, setKycDocType] = useState("NATIONAL_ID");
  const [kycIdNumber, setKycIdNumber] = useState("");
  const [kycDocUrl, setKycDocUrl] = useState("");

  // Admin action state
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Theme state & persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("lgf-mall-theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  // Simulated Email Verification flow state
  const [showSimulatedEmailModal, setShowSimulatedEmailModal] = useState(false);
  const [simulatedUserForVerification, setSimulatedUserForVerification] = useState<{
    email: string;
    name: string;
    token: string;
    userObj: any;
  } | null>(null);

  // Google Sign-In state
  const [showGoogleSelector, setShowGoogleSelector] = useState(false);
  const [googleSelectorCallback, setGoogleSelectorCallback] = useState<((user: any) => void) | null>(null);
  const [googleCustomEmail, setGoogleCustomEmail] = useState("");
  const [googleCustomName, setGoogleCustomName] = useState("");
  const [googleCustomRole, setGoogleCustomRole] = useState<UserRole>("BUYER");

  const handleGoogleSignInClick = async () => {
    try {
      const result = await executeGoogleSignIn((onSelect) => {
        setGoogleSelectorCallback(() => (selectedUser: any) => {
          setShowGoogleSelector(false);
          setGoogleSelectorCallback(null);
          onSelect(selectedUser);
        });
        setShowGoogleSelector(true);
      });
      
      const success = await loginWithGoogle({
        email: result.email,
        name: result.name,
        uid: result.uid,
        role: (result as any).role || "BUYER",
      });
      
      if (success) {
        setGoogleCustomEmail("");
        setGoogleCustomName("");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e: any) {
      console.error("Google Sign-In integration error:", e);
    }
  };

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("lgf-mall-theme", theme);
  }, [theme]);

  // Fetch initial session, stats, and default products catalog
  useEffect(() => {
    initSession();
    fetchStats();
    fetchProducts();
  }, [initSession, fetchStats, fetchProducts]);

  // Load lists when user state transitions
  useEffect(() => {
    if (user) {
      if (user.role === "BUYER" || user.role === "ADMIN") {
        fetchBuyerOrders();
      }
      if (user.role === "VENDOR" || user.role === "ADMIN") {
        fetchVendorProducts();
        fetchVendorOrders();
      }
      if (user.role === "INVESTOR" || user.role === "ADMIN") {
        fetchInvestments();
      }
      if (user.role === "ADMIN") {
        fetchPendingKycs();
        fetchAllUsers();
      }
      if (pendingPurchase) {
        const timer = setTimeout(() => {
          setPendingPurchase(null);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, pendingPurchase, fetchBuyerOrders, fetchVendorProducts, fetchVendorOrders, fetchInvestments, fetchPendingKycs, fetchAllUsers]);

  // Get localized strings
  const t = translations[lang] || translations.FR;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPassword);
    if (success) {
      setLoginEmail("");
      setLoginPassword("");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempEmail = regEmail;
    const tempName = regName;
    const success = await register({
      email: regEmail,
      name: regName,
      password: regPassword,
      phone: regPhone,
      role: regRole
    });
    if (success) {
      setSimulatedUserForVerification({
        email: tempEmail,
        name: tempName,
        token: localStorage.getItem("lgf_token") || "",
        userObj: useAppStore.getState().user
      });
      setShowSimulatedEmailModal(true);
      setRegEmail("");
      setRegPassword("");
      setRegName("");
      setRegPhone("");
      setRegRole("BUYER");
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitKyc({
      documentType: kycDocType,
      idNumber: kycIdNumber,
      documentUrl: kycDocUrl || undefined
    });
    if (success) {
      setKycIdNumber("");
      setKycDocUrl("");
    }
  };

  const handleGuestBuy = (productId: string, quantity: number) => {
    setPendingPurchase({ productId, quantity });
    const authElement = document.getElementById("auth-console");
    if (authElement) {
      authElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace("XOF", "FCFA");
  };

  const selectedProductForSeo = products.find((p) => p.id === orderProductId) || null;

  return (
    <div className="min-h-screen bg-emerald-950 font-sans text-white flex flex-col antialiased">
      <SeoStructuredData selectedProduct={selectedProductForSeo} activeCategory={catalogCategory} searchQuery={catalogSearch} />
      
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-emerald-950/80 backdrop-blur-md border-b border-emerald-800/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-emerald-950 shadow-md">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center">
                LGF's Mall
              </h1>
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] font-mono block leading-none mt-0.5">
                Elite Marketplace Africa
              </span>
            </div>
          </div>

          {/* Quick Support & Multi-lingual Toggle */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2.5 rounded-lg transition-all cursor-pointer bg-emerald-900/40 border border-emerald-800/60 hover:bg-emerald-800/80 text-yellow-500 hover:text-yellow-400 flex items-center justify-center"
              title={theme === "light" ? "Activer le Mode Sombre" : "Activer le Mode Clair"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-yellow-500" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-500" />
              )}
            </button>

            {/* Localized Language Selector */}
            <div className="bg-emerald-900/40 rounded-lg p-1 flex items-center space-x-1 border border-emerald-800/60">
              <Globe className="w-4 h-4 text-emerald-400 mx-1 hidden sm:inline" />
              {(["FR", "EN", "EWE", "KABYE"] as SupportedLanguage[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    lang === l 
                      ? "bg-yellow-500 text-emerald-950 shadow-xs" 
                      : "text-emerald-300 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Support Info (Desktop) with WhatsApp Button next to it */}
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">{t.supportContact}</span>
                <a href="tel:+22872998148" className="text-sm font-semibold text-yellow-500 hover:underline flex items-center justify-end">
                  <Phone className="w-3.5 h-3.5 mr-1 text-yellow-500" />
                  +228 72 99 81 48
                </a>
                <a href="mailto:lgfmall.lmdg11@gmail.com" className="text-[10px] text-emerald-300 hover:underline hover:text-white font-mono mt-0.5">
                  lgfmall.lmdg11@gmail.com
                </a>
              </div>
              
              <a 
                href="https://wa.me/22872998148" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 bg-[#25D366] hover:bg-[#20BA56] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-md whitespace-nowrap border border-transparent"
                title="WhatsApp Support"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.906-6.99C16.255 1.876 13.779.844 11.14.844c-5.443 0-9.87 4.424-9.873 9.871-.001 1.773.476 3.51 1.381 5.035l-.934 3.415 3.493-.916zm10.742-7.447c-.29-.145-1.716-.847-1.98-.942-.262-.096-.453-.145-.642.145-.19.29-.733.942-.897 1.13-.164.19-.327.21-.617.066-.29-.145-1.223-.45-2.33-1.439-.861-.767-1.443-1.715-1.611-2.005-.168-.29-.018-.445.127-.589.13-.13.29-.34.435-.51.145-.17.19-.29.29-.483.096-.19.048-.36-.024-.505-.072-.145-.642-1.545-.88-2.115-.23-.553-.463-.48-.642-.48-.166-.003-.357-.003-.548-.003-.19 0-.501.072-.763.36-.262.29-1.002.978-1.002 2.38 0 1.402 1.02 2.753 1.163 2.946.143.19 2.01 3.067 4.869 4.298.68.293 1.21.468 1.62.598.683.217 1.303.186 1.793.113.546-.08 1.716-.702 1.958-1.381.242-.68.242-1.26.17-1.38-.073-.12-.267-.19-.557-.335z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Logout Trigger (If logged in) */}
            {user && (
              <button 
                onClick={logout}
                className="p-2.5 text-emerald-400 hover:text-red-400 hover:bg-emerald-900/30 rounded-lg transition-colors border border-transparent hover:border-emerald-800/50 cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* GLOBAL SYSTEM ALERTS & MESSAGES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-900 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs animate-fade-in">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <button onClick={clearMessages} className="text-rose-400 hover:text-rose-600 text-xs font-bold font-mono">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 p-4 rounded-r-xl flex items-start space-x-3 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{successMessage}</p>
            </div>
            <button onClick={clearMessages} className="text-emerald-400 hover:text-emerald-600 text-xs font-bold font-mono">✕</button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT ENGINE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* LANDING / HERO VIEW (IF NOT AUTHENTICATED) */}
        {!user ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-4">
            
            {/* Left side: System Architecture & Pitch */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  📍 Lomé, Togo
                </span>
                <span className="text-yellow-500 font-mono text-xs block tracking-widest uppercase font-semibold">
                  Architectural Status
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
                  {t.tagline}
                </h2>
                <p className="text-lg text-emerald-300/80 max-w-xl leading-relaxed">
                  {t.slogan} {t.securedByEscrow}
                </p>
              </div>

              {/* Unique Escrow security features info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-900/40 rounded-2xl border border-emerald-700/30 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-yellow-500 border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white font-display">Tiers de Confiance Sécurisé</h3>
                  <p className="text-xs text-emerald-300/70 leading-relaxed">
                    Les fonds sont conservés en séquestre LGF et ne sont versés au marchand qu'après confirmation de livraison via code unique.
                  </p>
                </div>

                <div className="p-5 bg-emerald-900/40 rounded-2xl border border-emerald-700/30 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-yellow-500 border border-emerald-500/30">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white font-display">Intégration Mobile Money</h3>
                  <p className="text-xs text-emerald-300/70 leading-relaxed">
                    Payez ou recevez vos fonds par TMoney ou Flooz avec un système de versement instantané post-escrow.
                  </p>
                </div>
              </div>

              {/* Technical Stack Grid from Sleek design */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-700/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider font-mono">Base de données</span>
                  </div>
                  <p className="font-mono text-xs text-white">Prisma ORM & SQLite</p>
                </div>
                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-700/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider font-mono">Framework</span>
                  </div>
                  <p className="font-mono text-xs text-white">React & Vite</p>
                </div>
                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-700/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider font-mono">État Global</span>
                  </div>
                  <p className="font-mono text-xs text-white">Zustand Store</p>
                </div>
                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-700/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider font-mono">Infrastructure</span>
                  </div>
                  <p className="font-mono text-xs text-white">Monolith Architecture</p>
                </div>
              </div>

              {/* Live Platform Stats */}
              <div className="bg-emerald-900/20 text-white rounded-3xl p-8 border border-emerald-800/50 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-5">
                  <ShoppingBag className="w-64 h-64 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wider text-yellow-500 uppercase mb-6 flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
                  {t.statsTitle}
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                      {stats ? (stats.BUYER || 0) + 120 : "120+"}
                    </span>
                    <p className="text-[11px] text-emerald-300/75 font-semibold">{t.activeBuyers}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                      {stats ? (stats.VENDOR || 0) + 42 : "42+"}
                    </span>
                    <p className="text-[11px] text-emerald-300/75 font-semibold">{t.activeVendors}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                      {stats ? (stats.totalProducts || 0) + 310 : "310+"}
                    </span>
                    <p className="text-[11px] text-emerald-300/75 font-semibold">{t.totalProducts}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                      {stats ? (stats.totalOrders || 0) + 1580 : "1.5K+"}
                    </span>
                    <p className="text-[11px] text-emerald-300/75 font-semibold">{t.totalOrders}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* AUTHENTICATION CONSOLE (LOGIN / REGISTER) */}
            <div id="auth-console" className="lg:col-span-5 scroll-mt-24">
              {pendingPurchase && (
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-emerald-950 p-5 rounded-3xl mb-6 text-xs font-bold shadow-xl border border-amber-400 animate-pulse relative">
                  <div className="flex items-start space-x-3 pr-8">
                    <ShoppingBag className="w-5 h-5 shrink-0 text-emerald-950 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm tracking-tight leading-none text-emerald-950">Option d'Achat Bloquée !</p>
                      <p className="text-emerald-900 font-medium leading-relaxed mt-1">
                        L'article <strong className="font-black text-emerald-950">"{products.find(p => p.id === pendingPurchase.productId)?.title}"</strong> en quantité de <strong className="font-black text-emerald-950">{pendingPurchase.quantity} pièce(s)</strong> a été sélectionné avec succès.
                      </p>
                      <p className="text-[10px] text-emerald-950 font-black uppercase tracking-wider mt-1">
                        👉 Connectez-vous ou créez votre compte ci-dessous pour finaliser l'achat en séquestre sécurisé.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingPurchase(null)}
                    className="absolute top-4 right-4 text-emerald-950 font-black hover:text-rose-800 font-mono text-sm cursor-pointer"
                    title="Annuler la présélection"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="bg-white rounded-3xl p-10 shadow-2xl shadow-black/40 text-emerald-950">
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2 font-display">Portail Authentifié</h3>
                  <p className="text-sm text-emerald-600 font-medium">Connectez-vous pour configurer les fondations</p>
                </div>

                {/* Form header tab selector */}
                <div className="flex border-b border-emerald-50 mb-8">
                  <button
                    onClick={() => { setAuthMode("login"); clearMessages(); }}
                    className={`flex-1 pb-4 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      authMode === "login" 
                        ? "border-emerald-600 text-emerald-950" 
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => { setAuthMode("register"); clearMessages(); }}
                    className={`flex-1 pb-4 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      authMode === "register" 
                        ? "border-emerald-600 text-emerald-950" 
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t.register}
                  </button>
                </div>

                {/* LOGIN FORM */}
                {authMode === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-900 p-3.5 rounded-r-xl flex items-start space-x-2.5 shadow-sm animate-fade-in text-xs font-semibold">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={clearMessages} className="text-rose-400 hover:text-rose-600 font-bold">✕</button>
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono">
                        {t.email} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="exemple@lgfmall.tg"
                        className="w-full bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
                      />
                    </div>

                    <div>
                      <PasswordInput
                        label={t.password}
                        requiredStar
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <div className="flex items-center justify-end text-xs mt-2">
                        <button
                          type="button"
                          onClick={() => setIsResetModalOpen(true)}
                          className="text-emerald-600 font-bold hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <span>{t.login}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-emerald-100/50"></div>
                      <span className="flex-shrink mx-4 text-[9px] text-emerald-600 font-mono font-extrabold uppercase tracking-widest">OU</span>
                      <div className="flex-grow border-t border-emerald-100/50"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignInClick}
                      className="w-full bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-sm hover:shadow cursor-pointer duration-200"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span className="text-xs">S'authentifier avec Google</span>
                    </button>

                    <div className="pt-4 border-t border-emerald-50 text-center space-y-2">
                      <p className="text-xs text-emerald-700/80 font-medium">
                        {t.dontHaveAccount}{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("register")}
                          className="text-emerald-600 font-bold hover:underline"
                        >
                          {t.register}
                        </button>
                      </p>
                      <p className="text-[10px] text-emerald-500 font-mono">
                        Besoin d'aide ? Contactez-nous à <a href="mailto:lgfmall.lmdg11@gmail.com" className="underline hover:text-emerald-700">lgfmall.lmdg11@gmail.com</a>
                      </p>
                    </div>
                  </form>
                ) : (
                  
                  /* REGISTER FORM */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-900 p-3.5 rounded-r-xl flex items-start space-x-2.5 shadow-sm animate-fade-in text-xs font-semibold">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={clearMessages} className="text-rose-400 hover:text-rose-600 font-bold">✕</button>
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono">
                        {t.name} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Jean Koffi / Ets. Togoworx"
                        className="w-full bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono">
                        {t.email} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="koffi@exemple.tg"
                        className="w-full bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono">
                        {t.phone}
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+228 90 00 00 00"
                        className="w-full bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono">
                        {t.role} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950 cursor-pointer"
                      >
                        <option value="BUYER">{t.buyer}</option>
                        <option value="VENDOR">{t.vendor}</option>
                        <option value="DRIVER">{t.driver}</option>
                        <option value="INVESTOR">{t.investor}</option>
                      </select>
                    </div>

                    <div>
                      <PasswordInput
                        label={t.password}
                        requiredStar
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    {regRole === "VENDOR" && (
                      <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed font-medium">
                        💡 <b>Portefeuille Séquestre Auto-créé :</b> En vous inscrivant en tant que Vendeur, un compte escrow LGF sera immédiatement rattaché à votre profil pour stocker vos gains sous séquestre mobile money.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <span>{t.register.toUpperCase()}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-emerald-100/50"></div>
                      <span className="flex-shrink mx-4 text-[9px] text-emerald-600 font-mono font-extrabold uppercase tracking-widest">OU</span>
                      <div className="flex-grow border-t border-emerald-100/50"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignInClick}
                      className="w-full bg-white text-slate-800 border border-slate-200/80 hover:bg-slate-50 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-sm hover:shadow cursor-pointer duration-200"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span className="text-xs">S'inscrire avec Google</span>
                    </button>

                    <div className="pt-4 border-t border-emerald-50 text-center space-y-2">
                      <p className="text-xs text-emerald-700/80 font-medium">
                        {t.alreadyHaveAccount}{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("login")}
                          className="text-emerald-600 font-bold hover:underline"
                        >
                          {t.login}
                        </button>
                      </p>
                      <p className="text-[10px] text-emerald-500 font-mono">
                        Besoin d'aide ? Contactez-nous à <a href="mailto:lgfmall.lmdg11@gmail.com" className="underline hover:text-emerald-700">lgfmall.lmdg11@gmail.com</a>
                      </p>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>

          {/* PUBLIC PRODUCT CATALOG */}
          <div id="public-catalog" className="mt-16 space-y-8 scroll-mt-24">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                Marché d'Assigamé en Direct
              </span>
              <h3 className="text-3xl font-extrabold font-display text-white tracking-tight">
                Découvrez nos articles & Tarifs de Gros
              </h3>
              <p className="text-sm text-emerald-300/80 leading-relaxed font-medium">
                Parcourez les produits de Lomé et simulez vos achats en gros. Cliquez sur <strong>"Acheter avec Escrow"</strong> pour réserver l'article et finaliser votre transaction sécurisée en quelques clics.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-emerald-900/40 p-6 rounded-3xl border border-emerald-700/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un article (ex: pagne, savon, électronique)..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full bg-emerald-950/50 border border-emerald-700/40 pl-10 pr-4 py-3 rounded-xl text-xs text-emerald-100 placeholder:text-emerald-500/75 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="bg-emerald-950/50 border border-emerald-700/40 px-4 py-3 rounded-xl text-xs text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  <option value="Tous">Toutes Catégories</option>
                  <option value="Maison & Décoration">Maison & Décoration</option>
                  <option value="Maison & Décoration / Rideaux">Rideaux</option>
                  <option value="Maison & Décoration / Tapis">Tapis</option>
                  <option value="Beauté & Soins / Visage">Soins Visage</option>
                  <option value="Mode & Textiles">Mode & Textiles</option>
                  <option value="Cosmétiques & Beauté">Cosmétiques & Beauté</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Électronique">Électronique</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {products.length === 0 ? (
              <div className="text-center py-16 bg-emerald-900/10 rounded-3xl border border-dashed border-emerald-800/50">
                <ShoppingBag className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-emerald-500">Aucun produit disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products
                  .filter((p) => {
                    const matchesSearch = p.title.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                                          p.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                                          p.category.toLowerCase().includes(catalogSearch.toLowerCase());
                    const matchesCategory = catalogCategory === "Tous" || 
                                            p.category.toLowerCase().includes(catalogCategory.toLowerCase()) || 
                                            catalogCategory.toLowerCase().includes(p.category.toLowerCase());
                    return matchesSearch && matchesCategory;
                  })
                  .map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      formatCurrency={formatCurrency}
                      onBuy={handleGuestBuy}
                    />
                  ))}
              </div>
            )}
          </div>
        </>
        ) : (
          
          /* AUTHENTICATED USER WORKSPACE DASHBOARD */
          <div id="user-dashboard" className="space-y-8 scroll-mt-24">
            
            {/* WELCOME BANNER */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-3xl p-8 shadow-xl border border-emerald-800/50 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                  Tableau de bord sécurisé (Étape 1)
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display flex items-center">
                  {t.welcomeBack} <span className="text-yellow-500 ml-2">{user.name}</span>
                </h2>
                <p className="text-sm text-emerald-300 max-w-xl font-medium">
                  Votre espace marchand, vos soldes de séquestre sécurisés en FCFA, et vos informations de certification KYC.
                </p>
              </div>

              {/* Quick Role Badge */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="bg-emerald-900/60 border border-emerald-700/30 px-4 py-2.5 rounded-2xl flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block leading-none font-mono">Rôle</span>
                    <span className="text-sm font-bold text-white">{user.role}</span>
                  </div>
                </div>

                <div className="bg-yellow-500 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center space-x-2 shadow-md shadow-yellow-500/20">
                  <Clock className="w-4 h-4 text-emerald-950 animate-pulse" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-900 block leading-none font-mono">Statut</span>
                    <span className="text-sm font-bold text-emerald-950 uppercase">{user.kyc?.status || "NONE"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WORKSPACE & LIVE NAVIGATION */}
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-100/80 shadow-md flex space-x-2 max-w-md">
              <button
                onClick={() => setCurrentDashboardView("workspace")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  currentDashboardView === "workspace"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Mon Espace ({user.role})</span>
              </button>
              <button
                onClick={() => setCurrentDashboardView("live")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  currentDashboardView === "live"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Lomé Live Market 🎥</span>
              </button>
            </div>

            {currentDashboardView === "live" ? (
              <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-xl">
                <LiveCommerce
                  user={user}
                  products={products}
                  formatCurrency={formatCurrency}
                  onBuyProduct={(productId, quantity) => {
                    setPendingPurchase({ productId, quantity });
                    setCurrentDashboardView("workspace");
                    setSandboxRole("BUYER");
                  }}
                />
              </div>
            ) : (
              /* DASHBOARD CONTENT GRID */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT SIDEBAR / USER PROFILE & KYC WORKSPACE */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* 1. PORTFOLIO / USER CARD */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center">
                    <UserIcon className="w-4 h-4 mr-2 text-emerald-600" />
                    Profil de l'Utilisateur
                  </h3>
                  
                  <div className="border-t border-emerald-50 pt-3 space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-emerald-50">
                      <span className="text-emerald-800 font-medium">Adresse Email</span>
                      <span className="text-emerald-950 font-semibold font-mono">{user.email}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-emerald-50">
                      <span className="text-emerald-800 font-medium">Téléphone</span>
                      <span className="text-emerald-950 font-semibold">{user.phone || "Non renseigné"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-emerald-50">
                      <span className="text-emerald-800 font-medium">Création</span>
                      <span className="text-emerald-950 font-semibold font-mono">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. REGULATORY KYC SUBMISSION PANEL */}
                <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-emerald-600" />
                      Documents KYC
                    </h3>
                    
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                      user.kyc?.status === "APPROVED" 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                        : user.kyc?.status === "PENDING"
                        ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                        : user.kyc?.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {user.kyc ? t[`kyc${user.kyc.status as "APPROVED" | "PENDING" | "REJECTED"}`] : t.kycNone}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800/80 leading-normal font-medium">
                    Conformément aux directives de la BCEAO, vous devez certifier votre identité pour réaliser des transactions sur la plateforme.
                  </p>

                  {user.kyc?.status === "REJECTED" && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800">
                      <p className="font-bold mb-0.5">{t.kycRejected}</p>
                      <p className="italic">"{user.kyc.rejectionReason || 'Dossier incomplet.'}"</p>
                    </div>
                  )}

                  {(!user.kyc || user.kyc.status === "REJECTED") ? (
                    <form onSubmit={handleKycSubmit} className="space-y-3 border-t border-emerald-50 pt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase">{t.docType}</label>
                        <select
                          value={kycDocType}
                          onChange={(e) => setKycDocType(e.target.value)}
                          className="w-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs text-emerald-950 focus:outline-none cursor-pointer"
                        >
                          <option value="NATIONAL_ID">{t.nationalId}</option>
                          <option value="PASSPORT">{t.passport}</option>
                          <option value="DRIVERS_LICENSE">{t.driversLicense}</option>
                          <option value="BUSINESS_REGISTRATION">{t.businessReg}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase">{t.docNumber}</label>
                        <input
                          type="text"
                          required
                          value={kycIdNumber}
                          onChange={(e) => setKycIdNumber(e.target.value)}
                          placeholder="CNI-TG-4321..."
                          className="w-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs text-emerald-950 focus:outline-none"
                        />
                      </div>

                      <KycDocumentUploader
                        value={kycDocUrl}
                        onChange={(dataUrl) => setKycDocUrl(dataUrl)}
                        disabled={isLoading}
                      />

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                      >
                        {isLoading ? t.submitting : t.submitKycBtn}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-emerald-600 block">Type :</span>
                          <span className="font-semibold text-emerald-950">{user.kyc.documentType}</span>
                        </div>
                        <div>
                          <span className="text-emerald-600 block">Numéro :</span>
                          <span className="font-semibold text-emerald-950 font-mono">{user.kyc.idNumber}</span>
                        </div>
                      </div>
                      {user.kyc.documentUrl && (
                        <div className="pt-2 border-t border-emerald-100">
                          <img 
                            src={user.kyc.documentUrl} 
                            alt="KYC User Submission" 
                            referrerPolicy="no-referrer"
                            className="w-full max-h-24 object-cover rounded-lg border border-slate-200" 
                          />
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* RIGHT MAIN WORKSPACE PANEL */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. ADMIN SIMULATION CONTROLS */}
                {user.role === "ADMIN" && (
                  <div className="bg-amber-50 p-4 rounded-3xl border border-amber-200 text-amber-950 space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1 text-amber-700 animate-pulse" />
                      Admin Sandbox Workspace Controls
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-normal">
                      Simulez l'expérience d'un acheteur d'Assigamé, d'un vendeur de boutique ou d'un investisseur de stock pour vérifier les flux séquestres conformes BCEAO :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSandboxRole("BUYER")}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "BUYER"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Client (Acheteur)
                      </button>
                      <button
                        onClick={() => setSandboxRole("VENDOR")}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "VENDOR"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Vendeur (Storefront CRUD)
                      </button>
                      <button
                        onClick={() => setSandboxRole("INVESTOR")}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "INVESTOR"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Investisseur (Fonds & Contrats)
                      </button>
                      <button
                        onClick={() => setSandboxRole("DRIVER")}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "DRIVER"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Transporteur / Chauffeur
                      </button>
                      <button
                        onClick={() => setSandboxRole("ADMIN")}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "ADMIN"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Admin (Modération KYC)
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. DYNAMIC WORKSPACE PORTALS RENDER */}
                {(() => {
                  const activeRole = user.role === "ADMIN" ? sandboxRole : user.role;
                  
                  if (activeRole === "BUYER") {
                    return (
                      <BuyerPortal
                        products={products}
                        buyerOrders={buyerOrders}
                        placeOrder={placeOrder}
                        confirmOrderDelivery={confirmOrderDelivery}
                        fetchStats={fetchStats}
                        formatCurrency={formatCurrency}
                        isLoading={isLoading}
                        initialProductId={pendingPurchase?.productId}
                        initialQuantity={pendingPurchase?.quantity}
                        initialTab={pendingPurchase ? "order" : undefined}
                      />
                    );
                  }
                  
                  if (activeRole === "VENDOR") {
                    return (
                      <VendorPortal
                        user={user}
                        vendorProducts={vendorProducts}
                        vendorOrders={vendorOrders}
                        createProduct={createProduct}
                        updateProduct={updateProduct}
                        deleteProduct={deleteProduct}
                        withdrawEscrowFunds={withdrawEscrowFunds}
                        fetchStats={fetchStats}
                        formatCurrency={formatCurrency}
                        isLoading={isLoading}
                        fetchVendorOrders={fetchVendorOrders}
                      />
                    );
                  }
                  
                  if (activeRole === "INVESTOR") {
                    return (
                      <InvestorPortal
                        investments={investments}
                        createInvestment={createInvestment}
                        fetchStats={fetchStats}
                        formatCurrency={formatCurrency}
                        isLoading={isLoading}
                      />
                    );
                  }

                  if (activeRole === "DRIVER") {
                    return (
                      <DriverPortal
                        user={user}
                        formatCurrency={formatCurrency}
                        isLoading={isLoading}
                      />
                    );
                  }

                  // Admin View
                  if (activeRole === "ADMIN") {
                    return (
                      <AdminPortal
                        allUsers={allUsers}
                        pendingKycs={pendingKycs}
                        verifyKyc={verifyKyc}
                        formatCurrency={formatCurrency}
                        isLoading={isLoading}
                        rejectionReasons={rejectionReasons}
                        setRejectionReasons={setRejectionReasons}
                      />
                    );
                  }

                  return null;
                })()}

              </div>

            </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-emerald-950 border-t border-emerald-900/60 mt-12 py-8 text-emerald-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-sm font-medium">
            © 2026 LGF's Mall - Lomé, Togo. Tous droits réservés.
          </p>
          <p className="text-xs text-emerald-400/70 max-w-md mx-auto leading-relaxed">
            Plateforme de commerce multi-vendeurs éditée à des fins de conformité réglementaire. Support direct de niveau entreprise disponible 24/7 via <a href="mailto:lgfmall.lmdg11@gmail.com" className="text-yellow-500 hover:underline">lgfmall.lmdg11@gmail.com</a>.
          </p>
          <div className="flex justify-center space-x-6 text-xs font-semibold text-yellow-500">
            <span className="hover:underline cursor-pointer">Conditions Générales</span>
            <span className="hover:underline cursor-pointer">Politique de Séquestre LGF</span>
            <span className="hover:underline cursor-pointer">BCEAO Compliance</span>
          </div>
          
          {/* Production Status bar */}
          <div className="pt-6 border-t border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-emerald-400 font-mono">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="tracking-tight uppercase font-bold text-[9px]">LGF's Mall Service En Ligne</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>Paiement Séquestre Sécurisé</span>
              <span>Conformité Réglementaire BCEAO</span>
              <span className="text-yellow-500 font-bold uppercase">© 2026 LGF's Mall Inc.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* EMAIL VERIFICATION MODAL */}
      {showSimulatedEmailModal && simulatedUserForVerification && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col my-8 animate-scale-in">
            {/* Mail Client Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-xs font-mono text-slate-300 pl-2">Notification de Sécurité & Confirmation Email - LGF's Mall</span>
              </div>
              <button 
                onClick={() => {
                  setShowSimulatedEmailModal(false);
                  setSimulatedUserForVerification(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold font-mono transition-colors"
                title="Ignorer la simulation"
              >
                Passer [✕]
              </button>
            </div>

            {/* Email Metadata */}
            <div className="bg-white p-5 border-b border-slate-200/60 space-y-2 text-xs">
              <div className="flex justify-between items-start text-slate-500">
                <div>
                  <p>De : <strong className="text-slate-800">LGF's Mall Security</strong> &lt;security@lgfmall.lmdg11@gmail.com&gt;</p>
                  <p className="mt-0.5">À : <strong className="text-slate-800">{simulatedUserForVerification.name}</strong> &lt;{simulatedUserForVerification.email}&gt;</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">À l'instant</span>
              </div>
              <p className="font-extrabold text-sm text-slate-800 pt-1">
                ✉️ Confirmez votre adresse e-mail sur LGF's Mall
              </p>
            </div>

            {/* Email Body */}
            <div className="bg-white p-8 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-h-[400px] overflow-y-auto">
              <div className="space-y-4">
                {/* Logo Banner */}
                <div className="bg-emerald-950 p-4 rounded-2xl text-center">
                  <span className="text-lg font-black text-white font-display">LGF's Mall</span>
                  <p className="text-[9px] text-emerald-300 font-mono tracking-widest uppercase">E-Commerce Escrow de Confiance</p>
                </div>

                <p className="font-semibold text-slate-800">Bonjour {simulatedUserForVerification.name},</p>
                
                <p>
                  Nous sommes ravis de vous accueillir sur <strong>LGF's Mall</strong>, la plateforme de commerce multi-vendeurs leader pour vos transactions sécurisées.
                </p>

                <p>
                  Pour activer votre compte et sécuriser l'accès à nos fonctionnalités d'achat et vente de gros sous séquestre, veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse email :
                </p>

                {/* Main Action Button */}
                <div className="text-center py-4">
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await useAppStore.getState().verifyEmail(simulatedUserForVerification.email);
                      if (success) {
                        setShowSimulatedEmailModal(false);
                        setSimulatedUserForVerification(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                    ) : null}
                    <span>Valider mon adresse e-mail</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-normal border-t border-slate-100 pt-4">
                  Ce lien de confirmation est à usage unique et reste valide pendant 24 heures. Si vous n'êtes pas à l'origine de cette inscription, veuillez simplement ignorer ce message.
                </p>

                {/* Footer Signature */}
                <div className="border-t border-slate-100 pt-4 space-y-1 text-xs text-slate-500">
                  <p className="font-bold text-slate-800">L'Équipe de Support LGF's Mall</p>
                  <p>Support direct : <a href="mailto:lgfmall.lmdg11@gmail.com" className="text-emerald-600 hover:underline">lgfmall.lmdg11@gmail.com</a></p>
                  <p>Téléphone / WhatsApp : <strong className="text-slate-700">+228 72 99 81 48</strong></p>
                </div>
              </div>
            </div>

            {/* Simulated Mail Client Bottom Bar */}
            <div className="bg-slate-100 p-4 text-center border-t border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">
                🔒 Environnement de simulation sécurisé LGF • Cliquez sur le bouton vert ci-dessus pour confirmer et entrer dans la plateforme.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE SIGN-IN SELECTOR OVERLAY */}
      {showGoogleSelector && googleSelectorCallback && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-emerald-100 shadow-2xl flex flex-col my-8 animate-scale-in text-slate-800">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-6 text-center relative border-b border-emerald-900">
              <button 
                onClick={() => {
                  setShowGoogleSelector(false);
                  setGoogleSelectorCallback(null);
                }}
                className="absolute top-4 right-4 text-emerald-300 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF"/>
                </svg>
              </div>
              <h3 className="font-extrabold text-lg">Connexion via Google</h3>
              <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-mono mt-1 font-bold">Authentification Sécurisée Firebase</p>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-emerald-900 text-[11px] leading-relaxed flex items-start space-x-2.5 font-medium">
              <span className="text-sm mt-0.5">🔐</span>
              <div>
                <b>Connexion Rapide et Sécurisée :</b> Choisissez un compte Google pour vous connecter directement et accéder à vos services LGF's Mall en toute sécurité.
              </div>
            </div>

            {/* Selector Options */}
            <div className="p-6 space-y-4">
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide font-mono">Comptes Google Enregistrés :</span>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {/* Demo profile 2 */}
                <button
                  type="button"
                  onClick={() => {
                    googleSelectorCallback({
                      email: "koffi.togo@gmail.com",
                      name: "Koffi Mensah",
                      uid: "gg-buyer-koffi",
                      role: "BUYER"
                    });
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="pr-2">
                    <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-950">Koffi Mensah (Acheteur)</p>
                    <p className="text-[10px] text-slate-500 font-mono">koffi.togo@gmail.com</p>
                  </div>
                  <span className="text-[9px] font-bold font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase flex-shrink-0">ACHETEUR</span>
                </button>

                {/* Demo profile 3 */}
                <button
                  type="button"
                  onClick={() => {
                    googleSelectorCallback({
                      email: "lawson.textiles@gmail.com",
                      name: "Ets. Lawson (Wholesale)",
                      uid: "gg-vendor-lawson",
                      role: "VENDOR"
                    });
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="pr-2">
                    <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-950">Ets. Lawson (Vendeur)</p>
                    <p className="text-[10px] text-slate-500 font-mono">lawson.textiles@gmail.com</p>
                  </div>
                  <span className="text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase flex-shrink-0">VENDEUR</span>
                </button>

                {/* Demo profile 4 */}
                <button
                  type="button"
                  onClick={() => {
                    googleSelectorCallback({
                      email: "driver.kokou@gmail.com",
                      name: "Kokou Delivery",
                      uid: "gg-driver-kokou",
                      role: "DRIVER"
                    });
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="pr-2">
                    <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-950">Kokou Delivery (Livreur)</p>
                    <p className="text-[10px] text-slate-500 font-mono">driver.kokou@gmail.com</p>
                  </div>
                  <span className="text-[9px] font-bold font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase flex-shrink-0">LIVREUR</span>
                </button>
              </div>

              {/* Custom Input */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide font-mono">Ou tester un compte Google personnalisé :</span>
                
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={googleCustomName}
                    onChange={(e) => setGoogleCustomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800"
                  />
                  <input
                    type="email"
                    placeholder="adresse.google@gmail.com"
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 font-mono"
                  />
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 mb-1.5 block font-mono">Rôle rattaché au compte</label>
                    <select
                      value={googleCustomRole}
                      onChange={(e) => setGoogleCustomRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="BUYER">Acheteur (Customer)</option>
                      <option value="VENDOR">Vendeur (Vendor)</option>
                      <option value="DRIVER">Livreur (Driver)</option>
                      <option value="INVESTOR">Investisseur (Investor)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={!googleCustomEmail}
                    onClick={() => {
                      googleSelectorCallback({
                        email: googleCustomEmail,
                        name: googleCustomName || googleCustomEmail.split("@")[0],
                        uid: "gg-custom-" + Date.now(),
                        role: googleCustomRole
                      });
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 cursor-pointer"
                  >
                    <span>Simuler Google Sign-In</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer info */}
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-[9px] text-slate-500 font-mono">
                Statut SDK: {isFirebaseConfigured ? "🔥 CONNECTÉ À LA CLOUD FIRESTORE" : "💡 MODE SIMULATION LOCAL (DÉMO)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER MODAL */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
        onCheckout={(address, promoCode, paymentMethod) => {
          setIsCartDrawerOpen(false);
          setOrderPaymentMethod(paymentMethod);
          if (cart.length > 0) {
            handleGuestBuy(cart[0].product.id, cart[0].quantity);
          }
        }}
        formatCurrency={formatCurrency}
        products={products}
      />

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav aria-label="Navigation mobile principale" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 border-t border-emerald-800/80 backdrop-blur-xl px-2 py-2 flex items-center justify-around text-emerald-300 shadow-2xl">
        <button
          type="button"
          aria-label="Accueil"
          onClick={() => {
            setCurrentDashboardView("workspace");
            setCatalogCategory("Tous");
            const catalogEl = document.getElementById("public-catalog");
            if (catalogEl) {
              catalogEl.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex flex-col items-center justify-center space-y-1 text-emerald-300 hover:text-yellow-400 cursor-pointer py-1 px-2"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Accueil</span>
        </button>

        <button
          type="button"
          aria-label="Catégories du catalogue"
          onClick={() => {
            setCurrentDashboardView("workspace");
            const catalogEl = document.getElementById("public-catalog");
            if (catalogEl) {
              catalogEl.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex flex-col items-center justify-center space-y-1 text-emerald-300 hover:text-yellow-400 cursor-pointer py-1 px-2"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Catégories</span>
        </button>

        <button
          type="button"
          aria-label="Diffusions en direct"
          onClick={() => {
            setCurrentDashboardView("live");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer py-1 px-2 relative ${
            currentDashboardView === "live" ? "text-yellow-400" : "text-emerald-300 hover:text-yellow-400"
          }`}
        >
          <div className="relative">
            <Tv className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </div>
          <span className="text-[10px] font-bold">En Direct</span>
        </button>

        <button
          type="button"
          aria-label={`Panier (${cart.reduce((a, c) => a + c.quantity, 0)} articles)`}
          onClick={() => setIsCartDrawerOpen(true)}
          className="flex flex-col items-center justify-center space-y-1 text-emerald-300 hover:text-yellow-400 cursor-pointer py-1 px-2 relative"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-yellow-500 text-emerald-950 font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Panier</span>
        </button>

        <button
          type="button"
          aria-label={user ? "Profil utilisateur" : "Connexion à votre compte"}
          onClick={() => {
            if (user) {
              const dashEl = document.getElementById("user-dashboard");
              if (dashEl) {
                dashEl.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            } else {
              const authEl = document.getElementById("auth-console");
              if (authEl) {
                authEl.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
          }}
          className="flex flex-col items-center justify-center space-y-1 text-emerald-300 hover:text-yellow-400 cursor-pointer py-1 px-2"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">{user ? "Profil" : "Connexion"}</span>
        </button>
      </nav>

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        initialEmail={loginEmail}
        onReturnToLogin={() => setAuthMode("login")}
      />

    </div>
  );
}
