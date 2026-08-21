import { create } from "zustand";
import { User, PlatformStats, Kyc, SupportedLanguage, UserRole, Product, Order, Investment, InvestmentProject } from "./types";
import { firestoreSync } from "./lib/firebase";
import { DEFAULT_CATALOG_PRODUCTS } from "./data/defaultProducts";
import { safeJson } from "./lib/utils";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  lang: SupportedLanguage;
  stats: PlatformStats | null;
  pendingKycs: Kyc[];
  allUsers: User[];
  products: Product[];
  vendorProducts: Product[];
  buyerOrders: Order[];
  vendorOrders: Order[];
  investments: Investment[];
  investmentProjects: InvestmentProject[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  requiresEmailVerification?: boolean;
  pendingVerificationEmail?: string;
  cart: CartItem[];
  wishlist: string[];
  
  setLanguage: (lang: SupportedLanguage) => void;
  setError: (err: string | null) => void;
  clearMessages: () => void;
  checkSession: () => Promise<boolean>;
  initSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (data: { email: string; name: string; uid: string; role?: UserRole; phone?: string; idToken?: string }) => Promise<boolean>;
  loginWithSupabaseOAuthData: (user: any, token: string) => void;
  register: (data: { email: string; name: string; password: string; phone: string; role: UserRole }) => Promise<boolean>;
  verifyEmail: (email: string, token?: string) => Promise<boolean>;
  logout: () => void;
  fetchStats: () => Promise<void>;
  submitKyc: (data: { documentType: string; idNumber: string; documentUrl?: string }) => Promise<boolean>;
  updateUserProfile: (data: { name?: string; phone?: string }) => Promise<boolean>;
  activateWorkspaceAccount: (workspace: "VENDOR" | "DRIVER" | "INVESTOR") => Promise<boolean>;
  fetchPendingKycs: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  verifyKyc: (kycId: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) => Promise<boolean>;

  fetchProducts: () => Promise<void>;
  fetchVendorProducts: () => Promise<void>;
  createProduct: (data: { title: string; description: string; price: number; wholesalePrice?: number; wholesaleMinQty?: number; image?: string; images?: string[]; category: string; stock: number }) => Promise<boolean>;
  updateProduct: (id: string, data: { title?: string; description?: string; price?: number; wholesalePrice?: number; wholesaleMinQty?: number; image?: string; images?: string[]; category?: string; stock?: number }) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  placeOrder: (data: { productId: string; quantity: number; paymentMethod: string }) => Promise<boolean>;
  fetchBuyerOrders: () => Promise<void>;
  fetchVendorOrders: () => Promise<void>;
  confirmOrderDelivery: (orderId: string) => Promise<boolean>;
  withdrawEscrowFunds: (data: { method: string; accountNumber: string }) => Promise<boolean>;
  fetchInvestments: () => Promise<void>;
  createInvestment: (amount: number) => Promise<boolean>;
  fetchInvestmentProjects: (status?: string, search?: string) => Promise<void>;
  createInvestmentProject: (data: Partial<InvestmentProject>) => Promise<boolean>;
  updateInvestmentProject: (id: string, data: Partial<InvestmentProject>) => Promise<boolean>;
  deleteInvestmentProject: (id: string) => Promise<boolean>;
  
  addToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
  loadLocalCartAndWishlist: () => void;
  syncCartWithFirebase: (userId: string) => Promise<void>;
}

const API_BASE = "/api";

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  lang: (typeof window !== "undefined" && (localStorage.getItem("lgf_lang") as SupportedLanguage)) || "FR",
  stats: null,
  pendingKycs: [],
  allUsers: [],
  products: DEFAULT_CATALOG_PRODUCTS,
  vendorProducts: [],
  buyerOrders: [],
  vendorOrders: [],
  investments: [],
  investmentProjects: [],
  isLoading: false,
  error: null,
  successMessage: null,
  pendingVerificationEmail: "",
  requiresEmailVerification: false,
  cart: [],
  wishlist: [],

  setLanguage: (lang: SupportedLanguage) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lgf_lang", lang);
    }
    set({ lang });
  },
  
  setError: (error) => set({ error }),
  clearMessages: () => set({ error: null, successMessage: null, requiresEmailVerification: false, pendingVerificationEmail: "" }),

  checkSession: async (): Promise<boolean> => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("lgf_token") : null;
    if (!savedToken) {
      get().loadLocalCartAndWishlist();
      return false;
    }

    set({ isLoading: true, token: savedToken });
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data?.user) {
          set({ user: data.user, token: savedToken, error: null });
          get().loadLocalCartAndWishlist();
          await get().syncCartWithFirebase(data.user.id);
          return true;
        } else {
          if (typeof window !== "undefined") localStorage.removeItem("lgf_token");
          set({ token: null, user: null });
          get().loadLocalCartAndWishlist();
          return false;
        }
      } else {
        // Stale or invalid session
        if (typeof window !== "undefined") localStorage.removeItem("lgf_token");
        set({ token: null, user: null });
        get().loadLocalCartAndWishlist();
        return false;
      }
    } catch (err) {
      console.warn("Session verification notice:", err);
      get().loadLocalCartAndWishlist();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  initSession: async () => {
    await get().checkSession();
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.requiresEmailVerification) {
          set({
            error: data.error || "Veuillez confirmer votre adresse e-mail avant de continuer.",
            requiresEmailVerification: true,
            pendingVerificationEmail: email
          });
          return false;
        }
        set({ error: data.error || "Identifiants invalides." });
        return false;
      }

      // SECURITY FIX: Check if email is actually verified before completing authentication
      if (!data.verified && !data.user?.isEmailVerified) {
        set({ 
          error: "Veuillez confirmer votre adresse e-mail avant de continuer.",
          requiresEmailVerification: true,
          pendingVerificationEmail: email
        });
        return false;
      }

      localStorage.setItem("lgf_token", data.token);
      set({ user: data.user, token: data.token, successMessage: data.message, error: null, requiresEmailVerification: false, pendingVerificationEmail: "" });
      
      // Real-time Firestore sync
      if (data.user) {
        firestoreSync.saveDocument("users", data.user.id, data.user);
        await get().syncCartWithFirebase(data.user.id);
      }
      
      return true;
    } catch (err) {
      set({ error: "Impossible de contacter le serveur de paiement et d'authentification." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ email, name, password, phone, role }) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, phone, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de l'inscription." });
        return false;
      }

      // SECURITY FIX: Do NOT auto-login after registration
      // User must verify email first
      if (data.requiresEmailVerification) {
        set({ 
          successMessage: data.message || "Inscription réussie ! Veuillez vérifier votre adresse e-mail.",
          error: null,
          requiresEmailVerification: true,
          pendingVerificationEmail: email
        });
        return false; // Return false to prevent auto-login, UI should show verification prompt
      }

      localStorage.setItem("lgf_token", data.token);
      set({ user: data.user, token: data.token, successMessage: data.message, error: null });
      
      // Real-time Firestore sync
      if (data.user) {
        firestoreSync.saveDocument("users", data.user.id, data.user);
        await get().syncCartWithFirebase(data.user.id);
      }
      
      return true;
    } catch (err) {
      set({ error: "Une erreur réseau est survenue lors de l'inscription." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmail: async (email, token) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la vérification de l'adresse e-mail." });
        return false;
      }

      localStorage.setItem("lgf_token", data.token);
      set({ user: data.user, token: data.token, successMessage: data.message, error: null, requiresEmailVerification: false, pendingVerificationEmail: "" });

      // Real-time Firestore sync
      if (data.user) {
        firestoreSync.saveDocument("users", data.user.id, data.user);
        await get().syncCartWithFirebase(data.user.id);
      }

      return true;
    } catch (err) {
      set({ error: "Impossible de contacter le serveur pour vérifier l'adresse e-mail." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async ({ email, name, uid, role, phone, idToken }) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/auth/firebase-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, uid, role, phone, idToken }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        set({ error: data?.error || "Erreur lors de la synchronisation du compte Google." });
        return false;
      }

      if (!data?.user || !data?.token) {
        set({ error: data?.error || "Données de session invalides reçues du serveur." });
        return false;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("lgf_token", data.token);
      }

      // Synchronously update the Zustand store user & session state
      set({
        user: data.user,
        token: data.token,
        successMessage: data.message || "Connexion réussie !",
        error: null,
        requiresEmailVerification: false,
        pendingVerificationEmail: ""
      });
      
      // Real-time Firestore sync
      if (data.user) {
        firestoreSync.saveDocument("users", data.user.id, data.user);
        await get().syncCartWithFirebase(data.user.id);
      }
      
      return true;
    } catch (err) {
      set({ error: "Impossible de se connecter via Google. Vérifiez votre connexion." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithSupabaseOAuthData: (user, token) => {
    localStorage.setItem("lgf_token", token);
    set({
      user,
      token,
      successMessage: "Connexion réussie via Supabase OAuth 2.1 !",
      error: null,
      requiresEmailVerification: false,
      pendingVerificationEmail: ""
    });
    if (user) {
      firestoreSync.saveDocument("users", user.id, user);
      get().syncCartWithFirebase(user.id);
    }
  },

  logout: () => {
    localStorage.removeItem("lgf_token");
    localStorage.removeItem("lgf_cart");
    set({ user: null, token: null, pendingKycs: [], error: null, successMessage: "Déconnexion réussie.", cart: [] });
  },

  fetchStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await safeJson(res);
        if (data) {
          set({ stats: data });
        }
      }
    } catch (err) {
      console.warn("Notice: Failed to load platform stats:", err);
    }
  },

  submitKyc: async ({ documentType, idNumber, documentUrl }) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/kyc/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentType, idNumber, documentUrl }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        set({ error: data?.error || "Erreur de soumission KYC." });
        return false;
      }

      // Reload current user state to update kyc in UI
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await safeJson(userRes);
        if (userData?.user) {
          set({ user: userData.user });
        }
      }

      set({ successMessage: data?.message || "KYC soumis avec succès !", error: null });
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la soumission du KYC." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserProfile: async (data) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await safeJson(res);
      if (!res.ok) {
        set({ error: result?.error || "Erreur lors de la mise à jour du profil.", isLoading: false });
        return false;
      }
      const currentUser = get().user;
      if (currentUser && result?.user) {
        const updatedUser = { ...currentUser, ...result.user };
        set({ user: updatedUser, successMessage: "Profil mis à jour avec succès !", isLoading: false });
        firestoreSync.saveDocument("users", updatedUser.id, updatedUser);
      }
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la mise à jour du profil.", isLoading: false });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  activateWorkspaceAccount: async (workspace) => {
    const token = get().token;
    if (!token) {
      set({ error: "Veuillez vous connecter pour activer cet espace." });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/user/workspace-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ workspace })
      });
      const result = await safeJson(res);
      if (!res.ok) {
        set({ error: result?.error || "Impossible d'activer cet espace pour le moment.", isLoading: false });
        return false;
      }

      if (result?.user) {
        set({
          user: result.user,
          successMessage: result.message || `Espace activé avec succès !`,
          isLoading: false
        });
        firestoreSync.saveDocument("users", result.user.id, result.user);
      }

      // Fetch corresponding workspace data if appropriate
      if (workspace === "VENDOR") {
        await get().fetchVendorProducts();
        await get().fetchVendorOrders();
      } else if (workspace === "INVESTOR") {
        await get().fetchInvestments();
        await get().fetchInvestmentProjects();
      }

      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de l'activation de votre espace.", isLoading: false });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingKycs: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/admin/kyc/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) {
          set({ pendingKycs: data });
        }
      }
    } catch (err) {
      console.warn("Notice: Error fetching pending KYCs:", err);
    }
  },

  fetchAllUsers: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) {
          set({ allUsers: data });
        }
      }
    } catch (err) {
      console.warn("Notice: Error fetching admin users:", err);
    }
  },

  verifyKyc: async (kycId, status, rejectionReason) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ kycId, status, rejectionReason }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        set({ error: data?.error || "Erreur lors de l'validation du KYC." });
        return false;
      }

      set({ successMessage: data?.message || "KYC validé avec succès !", error: null });
      
      // Refresh pending lists
      await get().fetchPendingKycs();
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la validation." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProducts: async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map((p: any) => {
            let imgs = p.images;
            if (typeof imgs === "string") {
              try { imgs = JSON.parse(imgs); } catch (e) { imgs = [p.image].filter(Boolean); }
            }
            if (!Array.isArray(imgs) || imgs.length === 0) {
              imgs = [p.image].filter(Boolean);
            }
            let v = p.variants;
            if (typeof v === "string") {
              try { v = JSON.parse(v); } catch (e) { v = null; }
            }
            return { ...p, images: imgs, variants: v };
          });
          set({ products: parsed });

          // Save each product to Firestore for cloud persistence
          parsed.forEach((prod: any) => {
            firestoreSync.saveDocument("products", prod.id, prod);
          });
        } else {
          set({ products: DEFAULT_CATALOG_PRODUCTS });
        }
      } else {
        if (get().products.length === 0) {
          set({ products: DEFAULT_CATALOG_PRODUCTS });
        }
      }
    } catch (err) {
      console.warn("Notice: Error fetching products:", err);
      if (get().products.length === 0) {
        set({ products: DEFAULT_CATALOG_PRODUCTS });
      }
    }
  },

  fetchVendorProducts: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/products/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) {
          const parsed = data.map((p: any) => {
            let imgs = p.images;
            if (typeof imgs === "string") {
              try { imgs = JSON.parse(imgs); } catch (e) { imgs = [p.image].filter(Boolean); }
            }
            if (!Array.isArray(imgs) || imgs.length === 0) {
              imgs = [p.image].filter(Boolean);
            }
            let v = p.variants;
            if (typeof v === "string") {
              try { v = JSON.parse(v); } catch (e) { v = null; }
            }
            return { ...p, images: imgs, variants: v };
          });
          set({ vendorProducts: parsed });
        }
      }
    } catch (err) {
      console.warn("Notice: Error fetching vendor products:", err);
    }
  },

  createProduct: async (productData) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la création de l'article." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      await get().fetchVendorProducts();
      await get().fetchProducts();
      await get().fetchStats();

      // Real-time Firestore sync
      if (data.product) {
        firestoreSync.saveDocument("products", data.product.id, data.product);
      }

      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la création de l'article." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProduct: async (id, productData) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la mise à jour." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      await get().fetchVendorProducts();
      await get().fetchProducts();

      // Real-time Firestore sync
      if (data.product) {
        firestoreSync.saveDocument("products", data.product.id, data.product);
      }

      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la mise à jour." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la suppression de l'article." });
        return false;
      }

      set({ successMessage: data.message || "Article supprimé avec succès.", error: null });

      // Clean up from Firestore
      try {
        firestoreSync.deleteDocument("products", id);
      } catch (fsErr) {
        console.warn("Firestore product deletion notice:", fsErr);
      }

      // Optimistically remove from state so the UI reacts immediately
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        vendorProducts: state.vendorProducts.filter((p) => p.id !== id)
      }));

      await get().fetchVendorProducts();
      await get().fetchProducts();
      await get().fetchStats();
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la suppression." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  placeOrder: async (orderData) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la passation de commande." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      
      // Sync user wallet / orders state
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        set({ user: userData.user });
      }

      await get().fetchBuyerOrders();
      await get().fetchProducts();
      await get().fetchStats();

      // Real-time Firestore sync
      if (data.order) {
        firestoreSync.saveDocument("orders", data.order.id, data.order);
      }

      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la passation de commande." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBuyerOrders: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/orders/buyer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ buyerOrders: data });
      }
    } catch (err) {
      console.error("Error fetching buyer orders:", err);
    }
  },

  fetchVendorOrders: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/orders/vendor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ vendorOrders: data });
      }
    } catch (err) {
      console.error("Error fetching vendor orders:", err);
    }
  },

  confirmOrderDelivery: async (orderId) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la confirmation." });
        return false;
      }

      set({ successMessage: data.message, error: null });

      // Refresh profiles (for escrow balance updates)
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        set({ user: userData.user });
      }

      await get().fetchBuyerOrders();
      await get().fetchVendorOrders();

      // Real-time Firestore sync
      if (data.order) {
        firestoreSync.saveDocument("orders", data.order.id, data.order);
      }

      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la confirmation." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  withdrawEscrowFunds: async (withdrawData) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/escrow/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(withdrawData)
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de l'initiation du retrait." });
        return false;
      }

      set({ successMessage: data.message, error: null });

      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        set({ user: userData.user });
      }

      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors du retrait." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvestments: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/investments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ investments: data });
      }
    } catch (err) {
      console.error("Error fetching investments:", err);
    }
  },

  createInvestment: async (amount) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/investments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de l'enregistrement de l'investissement." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      await get().fetchInvestments();
      await get().fetchStats();
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de l'investissement." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvestmentProjects: async (status, search) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      const url = `${API_BASE}/investment-projects${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ investmentProjects: data });
      }
    } catch (err) {
      console.error("Error fetching investment projects:", err);
    }
  },

  createInvestmentProject: async (projectData) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/investment-projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la création du projet d'investissement." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      await get().fetchInvestmentProjects();
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la création du projet d'investissement." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateInvestmentProject: async (id, projectData) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/investment-projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la modification du projet d'investissement." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      await get().fetchInvestmentProjects();
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la modification du projet d'investissement." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteInvestmentProject: async (id) => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/investment-projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la suppression du projet d'investissement." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      await get().fetchInvestmentProjects();
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la suppression du projet d'investissement." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: (product, quantity, size, color) => {
    const currentCart = [...get().cart];
    const existingIndex = currentCart.findIndex(
      (item) => item.product.id === product.id && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      const id = `${product.id}-${size || "std"}-${color || "orig"}`;
      currentCart.push({ id, product, quantity, size, color });
    }

    set({ cart: currentCart });
    localStorage.setItem("lgf_cart", JSON.stringify(currentCart));

    // Async sync with Firestore if logged in
    const user = get().user;
    if (user) {
      firestoreSync.saveDocument("carts", user.id, { items: currentCart }).catch(err => {
        console.error("Failed to sync cart to Firestore:", err);
      });
    }
  },

  removeFromCart: (itemId) => {
    const updatedCart = get().cart.filter((item) => item.id !== itemId);
    set({ cart: updatedCart });
    localStorage.setItem("lgf_cart", JSON.stringify(updatedCart));

    const user = get().user;
    if (user) {
      firestoreSync.saveDocument("carts", user.id, { items: updatedCart }).catch(err => {
        console.error("Failed to sync cart to Firestore:", err);
      });
    }
  },

  updateCartQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId);
      return;
    }

    const updatedCart = get().cart.map((item) => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.min(item.product.stock, quantity) };
      }
      return item;
    });

    set({ cart: updatedCart });
    localStorage.setItem("lgf_cart", JSON.stringify(updatedCart));

    const user = get().user;
    if (user) {
      firestoreSync.saveDocument("carts", user.id, { items: updatedCart }).catch(err => {
        console.error("Failed to sync cart to Firestore:", err);
      });
    }
  },

  clearCart: () => {
    set({ cart: [] });
    localStorage.removeItem("lgf_cart");

    const user = get().user;
    if (user) {
      firestoreSync.saveDocument("carts", user.id, { items: [] }).catch(err => {
        console.error("Failed to sync cart to Firestore:", err);
      });
    }
  },

  toggleWishlist: (productId) => {
    let updatedWishlist = [...get().wishlist];
    if (updatedWishlist.includes(productId)) {
      updatedWishlist = updatedWishlist.filter((id) => id !== productId);
    } else {
      updatedWishlist.push(productId);
    }

    set({ wishlist: updatedWishlist });
    localStorage.setItem("lgf_wishlist", JSON.stringify(updatedWishlist));
  },

  clearWishlist: () => {
    set({ wishlist: [] });
    localStorage.removeItem("lgf_wishlist");
  },

  loadLocalCartAndWishlist: () => {
    try {
      const savedCart = localStorage.getItem("lgf_cart");
      const savedWishlist = localStorage.getItem("lgf_wishlist");
      if (savedCart) {
        set({ cart: JSON.parse(savedCart) });
      }
      if (savedWishlist) {
        set({ wishlist: JSON.parse(savedWishlist) });
      }
    } catch (e) {
      console.error("Error loading local cart or wishlist:", e);
    }
  },

  syncCartWithFirebase: async (userId: string) => {
    try {
      const remoteCart = await firestoreSync.getDocument("carts", userId);
      if (remoteCart && remoteCart.items) {
        const localCart = get().cart;
        const mergedCart = [...remoteCart.items];
        
        localCart.forEach((localItem) => {
          const exists = mergedCart.some((remoteItem) => remoteItem.id === localItem.id);
          if (!exists) {
            mergedCart.push(localItem);
          }
        });

        set({ cart: mergedCart });
        localStorage.setItem("lgf_cart", JSON.stringify(mergedCart));
        await firestoreSync.saveDocument("carts", userId, { items: mergedCart });
      } else if (get().cart.length > 0) {
        await firestoreSync.saveDocument("carts", userId, { items: get().cart });
      }
    } catch (e) {
      console.error("Error syncing cart with Firebase:", e);
    }
  },
}));
