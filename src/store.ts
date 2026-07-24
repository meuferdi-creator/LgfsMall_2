import { create } from "zustand";
import { User, PlatformStats, Kyc, SupportedLanguage, UserRole, Product, Order, Investment } from "./types";
import { firestoreSync } from "./lib/firebase";

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
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  cart: CartItem[];
  wishlist: string[];
  
  setLanguage: (lang: SupportedLanguage) => void;
  clearMessages: () => void;
  initSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (data: { email: string; name: string; uid: string; role?: UserRole; phone?: string }) => Promise<boolean>;
  register: (data: { email: string; name: string; password: string; phone: string; role: UserRole }) => Promise<boolean>;
  verifyEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  fetchStats: () => Promise<void>;
  submitKyc: (data: { documentType: string; idNumber: string; documentUrl?: string }) => Promise<boolean>;
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
  lang: "FR",
  stats: null,
  pendingKycs: [],
  allUsers: [],
  products: [],
  vendorProducts: [],
  buyerOrders: [],
  vendorOrders: [],
  investments: [],
  isLoading: false,
  error: null,
  successMessage: null,
  cart: [],
  wishlist: [],

  setLanguage: (lang: SupportedLanguage) => set({ lang }),
  
  clearMessages: () => set({ error: null, successMessage: null }),

  initSession: async () => {
    const savedToken = localStorage.getItem("lgf_token");
    if (!savedToken) {
      get().loadLocalCartAndWishlist();
      return;
    }

    set({ isLoading: true, token: savedToken });
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, error: null });
        get().loadLocalCartAndWishlist();
        if (data.user) {
          await get().syncCartWithFirebase(data.user.id);
        }
      } else {
        // Stale session
        localStorage.removeItem("lgf_token");
        set({ token: null, user: null });
        get().loadLocalCartAndWishlist();
      }
    } catch (err) {
      console.error("Session restoration error:", err);
      get().loadLocalCartAndWishlist();
    } finally {
      set({ isLoading: false });
    }
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
        set({ error: data.error || "Identifiants invalides." });
        return false;
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

  verifyEmail: async (email) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la vérification de l'adresse e-mail." });
        return false;
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
      set({ error: "Impossible de contacter le serveur pour vérifier l'adresse e-mail." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async ({ email, name, uid, role, phone }) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await fetch(`${API_BASE}/auth/firebase-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, uid, role, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de la synchronisation du compte Google." });
        return false;
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
      set({ error: "Impossible de se connecter via Google. Vérifiez votre connexion." });
      return false;
    } finally {
      set({ isLoading: false });
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
        const data = await res.json();
        set({ stats: data });
      }
    } catch (err) {
      console.error("Failed to load platform stats:", err);
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
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur de soumission KYC." });
        return false;
      }

      // Reload current user state to update kyc in UI
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        set({ user: userData.user });
      }

      set({ successMessage: data.message, error: null });
      return true;
    } catch (err) {
      set({ error: "Erreur réseau lors de la soumission du KYC." });
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
        const data = await res.json();
        set({ pendingKycs: data });
      }
    } catch (err) {
      console.error("Error fetching pending KYCs:", err);
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
        const data = await res.json();
        set({ allUsers: data });
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
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
      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || "Erreur lors de l'validation du KYC." });
        return false;
      }

      set({ successMessage: data.message, error: null });
      
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
        const data = await res.json();
        const parsed = data.map((p: any) => {
          let imgs = p.images;
          if (typeof imgs === "string") {
            try { imgs = JSON.parse(imgs); } catch (e) { imgs = [p.image].filter(Boolean); }
          }
          if (!Array.isArray(imgs) || imgs.length === 0) {
            imgs = [p.image].filter(Boolean);
          }
          return { ...p, images: imgs };
        });
        set({ products: parsed });

        // Save each product to Firestore for cloud persistence
        parsed.forEach((prod: any) => {
          firestoreSync.saveDocument("products", prod.id, prod);
        });
      }
    } catch (err) {
      console.error("Error fetching products:", err);
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
        const data = await res.json();
        const parsed = data.map((p: any) => {
          let imgs = p.images;
          if (typeof imgs === "string") {
            try { imgs = JSON.parse(imgs); } catch (e) { imgs = [p.image].filter(Boolean); }
          }
          if (!Array.isArray(imgs) || imgs.length === 0) {
            imgs = [p.image].filter(Boolean);
          }
          return { ...p, images: imgs };
        });
        set({ vendorProducts: parsed });
      }
    } catch (err) {
      console.error("Error fetching vendor products:", err);
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
        set({ error: data.error || "Erreur lors de la suppression." });
        return false;
      }

      set({ successMessage: data.message, error: null });
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
