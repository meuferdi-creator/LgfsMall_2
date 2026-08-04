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
import LgfHeader from "./components/LgfHeader";
import HeroBanner from "./components/HeroBanner";
import FlashDealsSection from "./components/FlashDealsSection";
import AuthModal from "./components/AuthModal";
import TrackOrderModal from "./components/TrackOrderModal";
import LgfFooter from "./components/LgfFooter";
import { executeGoogleSignIn, isFirebaseConfigured, auth } from "./lib/firebase";
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
    wishlist,
    addToCart,
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);
  const [activePortalRole, setActivePortalRole] = useState<UserRole>("BUYER");

  // Theme state & persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("lgf-mall-theme");
    return (saved === "light" || saved === "dark") ? saved : "light";
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

  // Handle redirect result on app load for Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (auth && isFirebaseConfigured) {
        try {
          const { getRedirectResult } = await import("firebase/auth");
          const result = await getRedirectResult(auth);
          if (result && result.user) {
            const user = result.user;
            const idToken = await user.getIdToken();
            
            const success = await loginWithGoogle({
              email: user.email || "",
              name: user.displayName || user.email?.split("@")[0] || "Utilisateur Google",
              uid: user.uid,
              role: "BUYER",
            });
            
            if (success) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }
        } catch (error: any) {
          if (!error?.message?.includes("no redirect data")) {
            console.warn("Redirect result handling error:", error);
          }
        }
      }
    };
    
    handleRedirectResult();
  }, []);

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

  const cartCount = (cart || []).reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = (cart || []).reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const wishlistCount = (wishlist || []).length;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-emerald-950 text-white" : "bg-slate-100 text-slate-900"} font-sans flex flex-col antialiased transition-colors duration-200`}>
      <SeoStructuredData selectedProduct={selectedProductForSeo} activeCategory={catalogCategory} searchQuery={catalogSearch} />
      
      {/* BRAND HEADER WITH TICKER, SEARCH, CURRENCY & ACCOUNT */}
      <LgfHeader
        user={user}
        cartCount={cartCount}
        cartTotal={cartTotal}
        wishlistCount={wishlistCount}
        lang={lang}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        catalogSearch={catalogSearch}
        setCatalogSearch={setCatalogSearch}
        selectedCategory={catalogCategory}
        setSelectedCategory={setCatalogCategory}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
        onOpenWishlist={() => {
          const catalogEl = document.getElementById("public-catalog") || document.getElementById("buyer-portal");
          if (catalogEl) catalogEl.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenFlashDeals={() => {
          const dealsEl = document.getElementById("flash-deals-section");
          if (dealsEl) dealsEl.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenVendorPortal={() => {
          if (!user) {
            setRegRole("VENDOR");
            setAuthMode("register");
            setIsAuthModalOpen(true);
          } else {
            setActivePortalRole("VENDOR");
            const dashboardEl = document.getElementById("user-dashboard");
            if (dashboardEl) dashboardEl.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onOpenTrackOrders={() => {
          setIsTrackOrderModalOpen(true);
        }}
        logout={logout}
        formatCurrency={formatCurrency}
        activePortalRole={activePortalRole}
        onChangePortalRole={(role) => setActivePortalRole(role)}
      />

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-8">
        
        {/* HERO BANNER & PROMOTIONAL FLASH DEALS */}
        {(!user || activePortalRole === "BUYER") && (
          <div className="space-y-8">
            <HeroBanner
              onSelectCategory={(cat) => {
                setCatalogCategory(cat);
                const catalogEl = document.getElementById("public-catalog") || document.getElementById("buyer-portal");
                if (catalogEl) catalogEl.scrollIntoView({ behavior: "smooth" });
              }}
              onOpenFlashDeals={() => {
                const dealsEl = document.getElementById("flash-deals-section");
                if (dealsEl) dealsEl.scrollIntoView({ behavior: "smooth" });
              }}
            />

            <FlashDealsSection
              products={products}
              formatCurrency={formatCurrency}
              onBuy={(productId, qty) => {
                const item = products.find((p) => p.id === productId);
                if (item) {
                  addToCart(item, qty);
                  setIsCartDrawerOpen(true);
                }
              }}
              onOpenDetail={(product) => {
                setOrderProductId(product.id);
                setShowOrderModal(true);
              }}
            />
          </div>
        )}

        {/* LANDING / HERO VIEW (IF NOT AUTHENTICATED) */}
        {!user ? (
          <>
          {/* BUYER PORTAL CATALOG */}
          <div id="public-catalog">
            <BuyerPortal
              products={products}
              buyerOrders={[]}
              placeOrder={async () => {
                setIsAuthModalOpen(true);
                return false;
              }}
              confirmOrderDelivery={async () => false}
              fetchStats={fetchStats}
              formatCurrency={formatCurrency}
              isLoading={isLoading}
            />
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
      <LgfFooter
        theme={theme}
        onOpenVendorPortal={() => {
          if (!user) {
            setIsAuthModalOpen(true);
          } else {
            setActivePortalRole("VENDOR");
          }
        }}
        onOpenTrackOrders={() => {
          if (!user) {
            setIsAuthModalOpen(true);
          } else {
            setActivePortalRole("BUYER");
          }
        }}
      />

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

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        isLoading={isLoading}
        error={error}
        successMessage={successMessage}
        clearMessages={clearMessages}
        login={login}
        register={register}
        onGoogleSignIn={handleGoogleSignInClick}
        onOpenResetPassword={() => {
          setIsAuthModalOpen(false);
          setIsResetModalOpen(true);
        }}
        pendingPurchase={pendingPurchase}
      />

      {/* Global Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderModalOpen}
        onClose={() => setIsTrackOrderModalOpen(false)}
        buyerOrders={buyerOrders}
        formatCurrency={formatCurrency}
      />

    </div>
  );
}
