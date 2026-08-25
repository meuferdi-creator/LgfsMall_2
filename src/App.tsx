import React, { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useAppStore } from "./store";
import { translations, SupportedLanguage } from "./translations";
import { UserRole, Product } from "./types";

// Lazy load Portal components to optimize bundle size and load performance
const BuyerPortal = lazy(() => import("./components/BuyerPortal"));
const VendorPortal = lazy(() => import("./components/VendorPortal"));
const InvestorPortal = lazy(() => import("./components/InvestorPortal"));
const DriverPortal = lazy(() => import("./components/DriverPortal"));
const AdminPortal = lazy(() => import("./components/AdminPortal"));

function PortalSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse bg-white dark:bg-emerald-900/40 rounded-3xl border border-slate-200 dark:border-emerald-800/60 my-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-800 rounded-2xl"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-emerald-200 dark:bg-emerald-800 rounded w-1/3"></div>
          <div className="h-3 bg-emerald-100 dark:bg-emerald-800/60 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="h-28 bg-slate-100 dark:bg-emerald-900/60 rounded-2xl border border-slate-200 dark:border-emerald-800/40"></div>
        <div className="h-28 bg-slate-100 dark:bg-emerald-900/60 rounded-2xl border border-slate-200 dark:border-emerald-800/40"></div>
        <div className="h-28 bg-slate-100 dark:bg-emerald-900/60 rounded-2xl border border-slate-200 dark:border-emerald-800/40"></div>
      </div>
    </div>
  );
}
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
import ProductDetailModal from "./components/ProductDetailModal";
import StoreModal from "./components/StoreModal";
import TrackOrderModal from "./components/TrackOrderModal";
import NotificationBanner from "./components/NotificationBanner";
import LgfFooter from "./components/LgfFooter";
import GeminiAssistantWidget from "./components/GeminiAssistantWidget";
import HelpCenterPage from "./components/HelpCenterPage";
import InfoPages from "./components/InfoPages";
import NotFoundPage from "./components/NotFoundPage";
import MobileProfileModal from "./components/MobileProfileModal";
import MobileFaqDrawer from "./components/MobileFaqDrawer";
import { WorkspaceAccessModal } from "./components/WorkspaceAccessModal";
import WorkspaceOnboardingTour from "./components/WorkspaceOnboardingTour";
import { checkWorkspaceAccess, guardWorkspaceAccess } from "./lib/workspaceAuth";
import { executeGoogleSignIn, auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { formatAccountCreationDate } from "./lib/utils";
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
  ArrowLeft,
  X,
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
  Edit3,
  Check,
  Search,
  Eye,
  Sun,
  Moon,
  Home,
  Grid,
  ShoppingCart,
  User,
  HelpCircle
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
    setError,
    successMessage,
    wishlist,
    toggleWishlist,
    addToCart,
    setLanguage,
    clearMessages,
    checkSession,
    initSession,
    login,
    loginWithGoogle,
    register,
    logout,
    fetchStats,
    submitKyc,
    updateUserProfile,
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
    createInvestment,
    investmentProjects,
    fetchInvestmentProjects,
    createInvestmentProject,
    updateInvestmentProject,
    deleteInvestmentProject
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

  // Global Product Detail & Store modals (for Flash Deals, Live Commerce & Highlights)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedStoreVendorId, setSelectedStoreVendorId] = useState<string | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  const handleOpenStoreModal = (vendorId: string, storeName: string) => {
    setSelectedStoreVendorId(vendorId);
    setSelectedStoreName(storeName);
    setIsStoreModalOpen(true);
  };

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

  // User profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateUserProfile({ name: profileName, phone: profilePhone });
    if (ok) {
      setIsEditingProfile(false);
    }
  };

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
  const [isMobileFaqOpen, setIsMobileFaqOpen] = useState(false);
  const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);
  const [isMobileProfileModalOpen, setIsMobileProfileModalOpen] = useState(false);
  const [activePortalRole, setActivePortalRole] = useState<UserRole>("BUYER");
  const [workspaceModalState, setWorkspaceModalState] = useState<{
    isOpen: boolean;
    targetRole: UserRole | null;
    reason?: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CREATED";
  }>({
    isOpen: false,
    targetRole: null,
    reason: "NOT_CREATED"
  });

  const handleRequestPortalRoleChange = (role: UserRole) => {
    const guard = guardWorkspaceAccess(user, role);
    if (guard.isAllowed) {
      setActivePortalRole(role);
      setSandboxRole(role);
      setCurrentDashboardView("workspace");
      setTimeout(() => {
        const dashboardEl = document.getElementById("user-dashboard");
        if (dashboardEl) {
          dashboardEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    } else {
      setWorkspaceModalState({
        isOpen: true,
        targetRole: role,
        reason: guard.reason
      });
    }
  };

  // Theme state & persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("lgf-mall-theme");
    return (saved === "light" || saved === "dark") ? saved : "light";
  });

  // Client Routing State & Sync
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\//, "");
    const hash = window.location.hash.replace(/^#/, "").split("?")[0];
    return hash || path || "home";
  });
  const [faqCategoryParam, setFaqCategoryParam] = useState<string>("all");
  const [faqSearchParam, setFaqSearchParam] = useState<string>("");

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const path = window.location.pathname.replace(/^\//, "");
      const hashFull = window.location.hash.replace(/^#/, "");
      const [hashRoute, hashQuery] = hashFull.split("?");
      const route = hashRoute || path || "home";

      setCurrentRoute(route);

      const searchString = hashQuery || window.location.search.replace(/^\?/, "");
      const params = new URLSearchParams(searchString);
      if (params.has("category")) {
        setFaqCategoryParam(params.get("category") || "all");
      }
      if (params.has("q")) {
        setFaqSearchParam(params.get("q") || "");
      }
    };

    syncRouteFromLocation();

    window.addEventListener("hashchange", syncRouteFromLocation);
    window.addEventListener("popstate", syncRouteFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncRouteFromLocation);
      window.removeEventListener("popstate", syncRouteFromLocation);
    };
  }, []);

  // Update Page Title and Meta Description dynamically based on route
  useEffect(() => {
    const routeTitles: Record<string, string> = {
      home: "LGF's Mall | Le Marché Africain & E-Commerce Sécurisé au Togo",
      help: "Centre d'Aide & Support Client 7j/7 | LGF's Mall",
      faq: "Foire Aux Questions (FAQ) & Guides d'Achat | LGF's Mall",
      about: "Qui sommes-nous ? Notre Mission | LGF's Mall",
      careers: "Recrutement & Carrières | LGF's Mall",
      blog: "Actualités & Conseils E-Commerce en Afrique | LGF's Mall",
      press: "Espace Presse & Médias | LGF's Mall",
      sustainability: "Notre Engagement Durable & RSE | LGF's Mall",
      delivery: "Livraison & Expédition Rapide au Togo | LGF's Mall",
      shipping: "Frais & Zones de Livraison | LGF's Mall",
      returns: "Politique de Retours & Remboursements Séquestre | LGF's Mall",
      payments: "Moyens de Paiement Sécurisés (Mobile Money & Cartes) | LGF's Mall",
      commissions: "Barème des Commissions Vendeurs & Tarifs | LGF's Mall",
      ads: "Publicité Sponsorisée & Visibilité Marchande | LGF's Mall",
      affiliates: "Programme Partenaires & Affiliation | LGF's Mall",
      terms: "Conditions Générales d'Utilisation (CGU) | LGF's Mall",
      privacy: "Politique de Confidentialité & Données Personnelles | LGF's Mall",
      cookies: "Politique relative aux Cookies | LGF's Mall"
    };

    const isKnownRoute = Object.keys(routeTitles).includes(currentRoute) || currentRoute === "" || currentRoute === "home";
    if (isKnownRoute) {
      document.title = routeTitles[currentRoute] || routeTitles.home;
    } else {
      document.title = "Page Non Trouvée (404) | LGF's Mall";
    }
  }, [currentRoute]);

  const navigateToRoute = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = `#${route}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Simulated Email Verification flow state
  const [showSimulatedEmailModal, setShowSimulatedEmailModal] = useState(false);
  const [simulatedUserForVerification, setSimulatedUserForVerification] = useState<{
    email: string;
    name: string;
    token: string;
    userObj: any;
  } | null>(null);

  // Google OAuth Loading State for visual feedback
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [activeFirebaseUser, setActiveFirebaseUser] = useState<{ email: string; displayName?: string | null; photoURL?: string | null } | null>(null);

  // Sync active Firebase user session for instant 1-click authentication
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser?.email) {
        setActiveFirebaseUser({
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL
        });
      } else {
        setActiveFirebaseUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignInClick = async (explicitData?: { role?: UserRole }) => {
    setIsGoogleAuthLoading(true);
    console.log("🔥 [App Auth] Initiating Google Sign-In sequence...");

    try {
      const googleUser = await executeGoogleSignIn();

      if (!googleUser) {
        console.log("ℹ️ [App Auth] Google Sign-In popup closed by user or cancelled.");
        return;
      }

      if (googleUser.requiresEmailPrompt || !googleUser.email || !googleUser.idToken) {
        console.log("ℹ️ [App Auth] Google OAuth provider notice / code:", googleUser.errorCode || "no_token");
        if (
          googleUser.errorCode &&
          googleUser.errorCode !== "auth/popup-closed-by-user" &&
          googleUser.errorCode !== "auth/cancelled-popup-request"
        ) {
          setError(googleUser.errorCode);
        }
        return;
      }

      console.log("✅ [App Auth] Firebase authenticated Google user:", googleUser.email, "(UID:", googleUser.uid, ")");
      console.log("🔥 [App Auth] Syncing user profile with backend Prisma database (/api/auth/firebase-sync)...");

      const success = await loginWithGoogle({
        email: googleUser.email,
        name: googleUser.name,
        uid: googleUser.uid,
        idToken: googleUser.idToken,
        role: explicitData?.role || "BUYER",
      });

      if (success) {
        const loggedInUser = useAppStore.getState().user;
        const targetRole = loggedInUser?.role || explicitData?.role || "BUYER";
        console.log("🎉 [App Auth] Backend sync successful! Session established for:", googleUser.email, "Target Role:", targetRole);
        
        setActivePortalRole(targetRole);
        setSandboxRole(targetRole);
        setIsAuthModalOpen(false);
        setAuthModalMode("login");

        if (pendingPurchase) {
          setIsCartDrawerOpen(true);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        console.warn("⚠️ [App Auth] Backend sync failed or returned non-200 response.");
      }
    } catch (e: any) {
      console.error("🚨 [App Auth Notice] Google Sign-In notice:", e?.message || e);
      setError(e?.message || "Erreur de connexion Google.");
    } finally {
      setIsGoogleAuthLoading(false);
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

  // Initial Session Check: Verifies validity of 'lgf_token' from local storage against /api/auth/me
  // Also loads platform stats and default product catalog
  useEffect(() => {
    checkSession();
    fetchStats();
    fetchProducts();
  }, [checkSession, fetchStats, fetchProducts]);

  // Auto-redirect user to their dedicated role portal upon login
  useEffect(() => {
    if (user?.role) {
      setActivePortalRole(user.role);
    }
  }, [user]);

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
        fetchInvestmentProjects();
      }
      if (user.role === "ADMIN") {
        fetchPendingKycs();
        fetchAllUsers();
        fetchInvestmentProjects();
      }
      if (pendingPurchase) {
        const timer = setTimeout(() => {
          setPendingPurchase(null);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, pendingPurchase, fetchBuyerOrders, fetchVendorProducts, fetchVendorOrders, fetchInvestments, fetchPendingKycs, fetchAllUsers, fetchInvestmentProjects]);

  // Auto-dismiss notification banners (success / error) after 8000ms (8 seconds)
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 8000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [successMessage, error, clearMessages]);

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
            setWorkspaceModalState({
              isOpen: true,
              targetRole: "VENDOR",
              reason: "UNAUTHENTICATED"
            });
          } else {
            handleRequestPortalRoleChange("VENDOR");
          }
        }}
        onOpenTrackOrders={() => {
          setIsTrackOrderModalOpen(true);
        }}
        onNavigate={navigateToRoute}
        logout={logout}
        formatCurrency={formatCurrency}
        activePortalRole={user?.role === "ADMIN" ? sandboxRole : activePortalRole}
        onChangePortalRole={handleRequestPortalRoleChange}
        isAuthLoading={isGoogleAuthLoading || isLoading}
        onWorkspaceAccessDenied={(role, reason) => {
          setWorkspaceModalState({
            isOpen: true,
            targetRole: role,
            reason: reason || "NOT_CREATED"
          });
        }}
      />

      {/* GLOBAL SYSTEM ALERTS & MESSAGES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 space-y-3">
        <NotificationBanner
          message={error}
          type="error"
          onClose={clearMessages}
          autoDismissMs={8000}
        />
        <NotificationBanner
          message={successMessage}
          type="success"
          onClose={clearMessages}
          autoDismissMs={8000}
        />
      </div>

      {/* MAIN LAYOUT ENGINE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-8">
        {(currentRoute === "help" || currentRoute === "faq") ? (
          <HelpCenterPage
            user={user}
            onNavigateHome={() => navigateToRoute("home")}
            initialCategory={faqCategoryParam}
            initialSearchQuery={faqSearchParam}
          />
        ) : [
          "about", "careers", "blog", "press", "sustainability", 
          "delivery", "shipping", "returns", "payments", "commissions", 
          "ads", "affiliates", "terms", "privacy", "cookies"
        ].includes(currentRoute) ? (
          <InfoPages
            slug={currentRoute}
            user={user}
            onNavigateHome={() => navigateToRoute("home")}
            onNavigateHelp={() => navigateToRoute("help")}
            onOpenVendorPortal={() => {
              if (!user) setIsAuthModalOpen(true);
              else setActivePortalRole("VENDOR");
            }}
            onOpenTrackOrders={() => setIsTrackOrderModalOpen(true)}
          />
        ) : (currentRoute !== "home" && currentRoute !== "") ? (
          <NotFoundPage
            onNavigateHome={() => navigateToRoute("home")}
            onNavigateHelp={() => navigateToRoute("help")}
            onOpenCatalog={() => {
              navigateToRoute("home");
              setTimeout(() => {
                const catalogEl = document.getElementById("public-catalog") || document.getElementById("buyer-portal");
                if (catalogEl) catalogEl.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          />
        ) : (
          <>
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
                setSelectedProductForDetail(product);
              }}
            />
          </div>
        )}

        {/* LANDING / HERO VIEW (IF NOT AUTHENTICATED) */}
        {!user ? (
          currentDashboardView === "live" ? (
            <div className="bg-white dark:bg-emerald-950 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-xl">
              <LiveCommerce
                user={null}
                products={products}
                formatCurrency={formatCurrency}
                onBuyProduct={(productId, quantity) => {
                  setOrderProductId(productId);
                  setShowOrderModal(true);
                }}
              />
            </div>
          ) : (
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
                externalCategory={catalogCategory}
                externalSearch={catalogSearch}
              />
            </div>
          )
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
            <div className="bg-white dark:bg-emerald-950 p-1.5 rounded-2xl border border-emerald-100/80 dark:border-emerald-800/80 shadow-md flex space-x-2 max-w-md">
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
                <div className="bg-white dark:bg-emerald-950 rounded-3xl p-6 border border-emerald-100/50 dark:border-emerald-800/50 shadow-xl text-emerald-950 dark:text-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-white font-display flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                      Profil de l'Utilisateur
                    </h3>
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileName(user.name || "");
                          setProfilePhone(user.phone || "");
                          setIsEditingProfile(true);
                        }}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-800/60 px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Éditer mon profil</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 px-2 py-1 cursor-pointer"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                  
                  {!isEditingProfile ? (
                    <div className="border-t border-emerald-50 dark:border-emerald-900/50 pt-3 space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-emerald-50 dark:border-emerald-900/50">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">Nom & Prénom</span>
                        <span className="text-emerald-950 dark:text-white font-bold">{user.name || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-emerald-50 dark:border-emerald-900/50">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">Adresse Email</span>
                        <span className="text-emerald-950 dark:text-white font-semibold font-mono truncate max-w-[170px]">{user.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-emerald-50 dark:border-emerald-900/50">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">Téléphone</span>
                        <span className="text-emerald-950 dark:text-white font-semibold">{user.phone || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-emerald-50 dark:border-emerald-900/50">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">Création</span>
                        <span className="text-emerald-950 dark:text-white font-semibold font-mono">
                          {formatAccountCreationDate(user.createdAt)}
                        </span>
                      </div>

                      {/* Explicit Logout Button in Profile Card */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="w-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 shadow-xs"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Se Déconnecter de la session</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="border-t border-emerald-50 dark:border-emerald-900/50 pt-3 space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-1">
                          Nom & Prénom
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-emerald-900/50 border border-slate-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: LGF Admin Global"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-emerald-900/50 border border-slate-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="+228 90 00 00 00"
                        />
                      </div>

                      <div className="py-1">
                        <span className="block text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-0.5">Adresse Email</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-xs truncate block">{user.email}</span>
                      </div>

                      <div className="py-1">
                        <span className="block text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-0.5">Création</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{formatAccountCreationDate(user.createdAt)}</span>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Enregistrer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="bg-slate-100 dark:bg-emerald-900/40 hover:bg-slate-200 dark:hover:bg-emerald-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}
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
                      {user.kyc
                        ? t[
                            (`kyc${user.kyc.status.charAt(0) + user.kyc.status.slice(1).toLowerCase()}` as
                              | "kycApproved"
                              | "kycPending"
                              | "kycRejected")
                          ]
                        : t.kycNone}
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
                        onClick={() => {
                          setSandboxRole("BUYER");
                          setActivePortalRole("BUYER");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "BUYER"
                            ? "bg-amber-600 text-white shadow-sm font-extrabold"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Client (Acheteur)
                      </button>
                      <button
                        onClick={() => {
                          setSandboxRole("VENDOR");
                          setActivePortalRole("VENDOR");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "VENDOR"
                            ? "bg-amber-600 text-white shadow-sm font-extrabold"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Vendeur (Storefront CRUD)
                      </button>
                      <button
                        onClick={() => {
                          setSandboxRole("INVESTOR");
                          setActivePortalRole("INVESTOR");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "INVESTOR"
                            ? "bg-amber-600 text-white shadow-sm font-extrabold"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Investisseur (Fonds & Contrats)
                      </button>
                      <button
                        onClick={() => {
                          setSandboxRole("DRIVER");
                          setActivePortalRole("DRIVER");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "DRIVER"
                            ? "bg-amber-600 text-white shadow-sm font-extrabold"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Transporteur / Chauffeur
                      </button>
                      <button
                        onClick={() => {
                          setSandboxRole("ADMIN");
                          setActivePortalRole("ADMIN");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          sandboxRole === "ADMIN"
                            ? "bg-amber-600 text-white shadow-sm font-extrabold"
                            : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/40"
                        }`}
                      >
                        Portail Admin (Modération KYC)
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. DYNAMIC WORKSPACE PORTALS RENDER */}
                <Suspense fallback={<PortalSkeleton />}>
                  {(() => {
                    const requestedRole = user.role === "ADMIN" ? sandboxRole : activePortalRole;
                    const guard = guardWorkspaceAccess(user, requestedRole);
                    const activeRole = guard.effectiveRole;
                    
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
                          externalCategory={catalogCategory}
                          externalSearch={catalogSearch}
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
                          investmentProjects={investmentProjects}
                          createInvestmentProject={createInvestmentProject}
                          updateInvestmentProject={updateInvestmentProject}
                          deleteInvestmentProject={deleteInvestmentProject}
                          fetchInvestmentProjects={fetchInvestmentProjects}
                          allProducts={products}
                          fetchProducts={fetchProducts}
                        />
                      );
                    }

                    return null;
                  })()}
                </Suspense>

              </div>

            </div>
            )}

          </div>
        )}
          </>
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
        onNavigate={navigateToRoute}
      />

      {/* EMAIL VERIFICATION MODAL */}
      {showSimulatedEmailModal && simulatedUserForVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-950/80 transition-opacity" 
            onClick={() => {
              setShowSimulatedEmailModal(false);
              setSimulatedUserForVerification(null);
            }} 
          />
          <div className="relative z-10 bg-slate-100 rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col my-8 animate-scale-in">
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
      <nav aria-label="Navigation mobile principale" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950 border-t border-emerald-800 px-2 py-2 flex items-center justify-around text-emerald-300 shadow-2xl">
        <button
          type="button"
          aria-label="Accueil"
          onClick={() => {
            navigateToRoute("home");
            setCurrentDashboardView("workspace");
            setCatalogCategory("Tous");
            setCatalogSearch("");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer py-1 px-2.5 transition-all duration-200 active:scale-95 ${
            currentRoute === "home" && currentDashboardView === "workspace" ? "text-amber-400 font-extrabold scale-105" : "text-emerald-300/80 hover:text-amber-400"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Accueil</span>
        </button>

        <button
          type="button"
          aria-label="Catégories du catalogue"
          onClick={() => {
            navigateToRoute("home");
            setCurrentDashboardView("workspace");
            setTimeout(() => {
              const categoriesEl = document.getElementById("categories-grid-section") || document.getElementById("catalog-section") || document.getElementById("public-catalog");
              if (categoriesEl) {
                categoriesEl.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }, 50);
          }}
          className="flex flex-col items-center justify-center space-y-1 text-emerald-300/80 hover:text-amber-400 active:scale-95 transition-all duration-200 cursor-pointer py-1 px-2.5"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Catégories</span>
        </button>

        <button
          type="button"
          aria-label="Diffusions en direct"
          onClick={() => {
            navigateToRoute("home");
            setCurrentDashboardView("live");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer py-1 px-2.5 relative transition-all duration-200 active:scale-95 ${
            currentRoute === "home" && currentDashboardView === "live" ? "text-amber-400 font-extrabold scale-105" : "text-emerald-300/80 hover:text-amber-400"
          }`}
        >
          <div className="relative">
            <Tv className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </div>
          <span className="text-[10px] font-bold tracking-tight">En Direct</span>
        </button>

        <button
          type="button"
          aria-label={`Panier (${cart.reduce((a, c) => a + c.quantity, 0)} articles)`}
          onClick={() => setIsCartDrawerOpen(true)}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer py-1 px-2 relative transition-all duration-200 active:scale-95 ${
            isCartDrawerOpen ? "text-amber-400 font-extrabold" : "text-emerald-300/80 hover:text-amber-400"
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-400 text-emerald-950 font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Panier</span>
        </button>

        {/* Mobile Help & FAQ Drawer Trigger */}
        <button
          type="button"
          aria-label="Aide & FAQ Support"
          onClick={() => setIsMobileFaqOpen(true)}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer py-1 px-2 transition-all duration-200 active:scale-95 ${
            isMobileFaqOpen ? "text-amber-400 font-extrabold" : "text-emerald-300/80 hover:text-amber-400"
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Aide</span>
        </button>

        <button
          type="button"
          aria-label={user ? "Profil utilisateur" : "Connexion à votre compte"}
          onClick={() => {
            if (user) {
              setIsMobileProfileModalOpen(true);
            } else {
              setAuthMode("login");
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer py-1 px-2 transition-all duration-200 active:scale-95 ${
            isAuthModalOpen || isMobileProfileModalOpen ? "text-amber-400 font-extrabold" : "text-emerald-300/80 hover:text-amber-400"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">{user ? "Profil" : "Connexion"}</span>
        </button>
      </nav>

      {/* Mobile FAQ Slide-in Drawer */}
      <MobileFaqDrawer
        isOpen={isMobileFaqOpen}
        onClose={() => setIsMobileFaqOpen(false)}
        onOpenHelpCenter={() => navigateToRoute("help")}
      />

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
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalMode("login");
        }}
        lang={lang}
        isLoading={isLoading}
        isGoogleAuthLoading={isGoogleAuthLoading}
        authMode={authModalMode}
        onAuthModeChange={setAuthModalMode}
        error={error}
        successMessage={successMessage}
        clearMessages={clearMessages}
        login={login}
        register={register}
        activeFirebaseUser={activeFirebaseUser}
        onGoogleSignIn={handleGoogleSignInClick}
        onOpenResetPassword={() => {
          setIsAuthModalOpen(false);
          setIsResetModalOpen(true);
        }}
        pendingPurchase={pendingPurchase}
      />

      {/* Mobile Profile & Quick Actions Modal with prominent Logout */}
      <MobileProfileModal
        isOpen={isMobileProfileModalOpen}
        onClose={() => setIsMobileProfileModalOpen(false)}
        user={user}
        onLogout={() => {
          logout();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        theme={theme}
        setTheme={setTheme}
        activePortalRole={activePortalRole}
        onChangePortalRole={handleRequestPortalRoleChange}
        onWorkspaceAccessDenied={(role, reason) => {
          setWorkspaceModalState({
            isOpen: true,
            targetRole: role,
            reason: reason || "NOT_CREATED"
          });
        }}
        onNavigateToDashboard={() => {
          setCurrentDashboardView("workspace");
          setTimeout(() => {
            const dashEl = document.getElementById("user-dashboard");
            if (dashEl) dashEl.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }}
        onNavigateToOrders={() => {
          setIsTrackOrderModalOpen(true);
        }}
      />

      {/* Global Workspace Authorization & Account Creation Modal */}
      <WorkspaceAccessModal
        isOpen={workspaceModalState.isOpen}
        targetRole={workspaceModalState.targetRole}
        reason={workspaceModalState.reason}
        onClose={() => setWorkspaceModalState((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={(role) => {
          setActivePortalRole(role);
          setSandboxRole(role);
          setCurrentDashboardView("workspace");
          setTimeout(() => {
            const dashEl = document.getElementById("user-dashboard");
            if (dashEl) dashEl.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }}
        onOpenAuthModal={() => {
          setAuthModalMode("login");
          setIsAuthModalOpen(true);
        }}
      />

      {/* Global Product Detail Modal for Flash Deals & Previews */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          products={products}
          onClose={() => setSelectedProductForDetail(null)}
          formatCurrency={formatCurrency}
          onAddToCart={(product, qty, size, color) => {
            addToCart(product, qty, size, color);
            setSelectedProductForDetail(null);
            setIsCartDrawerOpen(true);
          }}
          onBuyNow={(productId, qty) => {
            const targetProd = products.find((p) => p.id === productId) || selectedProductForDetail;
            if (targetProd) {
              addToCart(targetProd, qty);
              setIsCartDrawerOpen(true);
            }
            setSelectedProductForDetail(null);
          }}
          isInWishlist={wishlist.includes(selectedProductForDetail.id)}
          onToggleWishlist={toggleWishlist}
          onOpenStore={(vendorId, storeName) => {
            setSelectedProductForDetail(null);
            handleOpenStoreModal(vendorId, storeName);
          }}
        />
      )}

      {/* Global Boutique Store Modal */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        vendorId={selectedStoreVendorId}
        storeName={selectedStoreName}
        products={products}
        formatCurrency={formatCurrency}
        onBuyProduct={(productId, qty, color) => {
          setIsStoreModalOpen(false);
          const targetProd = products.find((p) => p.id === productId);
          if (targetProd) {
            addToCart(targetProd, qty, undefined, color);
            setIsCartDrawerOpen(true);
          }
        }}
        onOpenDetail={(product) => {
          setIsStoreModalOpen(false);
          setSelectedProductForDetail(product);
        }}
      />

      {/* Global Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderModalOpen}
        onClose={() => setIsTrackOrderModalOpen(false)}
        buyerOrders={buyerOrders}
        formatCurrency={formatCurrency}
      />

      {/* First-time Workspace Onboarding Interactive Tour */}
      <WorkspaceOnboardingTour
        currentRole={user?.role === "ADMIN" ? sandboxRole : activePortalRole}
        userId={user?.id}
      />

      {/* Floating Gemini AI Assistant & FAQ Widget */}
      <GeminiAssistantWidget />

    </div>
  );
}
