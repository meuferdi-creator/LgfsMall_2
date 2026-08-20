import React, { useState, useEffect, useRef } from "react";
import { Wallet, ShoppingBag, Plus, Clock, Coins, Edit, Trash, Trash2, Loader2, AlertCircle, MapPin, Navigation, Save, ShieldCheck, CheckCircle2, BarChart3, Star, Sparkles, Upload, Download, Calculator, Volume2, VolumeX, Bell, X, KeyRound, Lock, Tag, Copy, Check, Calendar, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { User, Product, Order, Coupon } from "../types";
import { getGoogleMaps, TOGO_HUBS, calculateRoute } from "../lib/maps";
import { firestoreSync, auth } from "../lib/firebase";
import ProductImageUploader from "./ProductImageUploader";
import SellerProfitCalculator from "./SellerProfitCalculator";
import { PasswordInput } from "./PasswordInput";
import { useTranslation } from "../hooks/useTranslation";

interface VendorPortalProps {
  user: User;
  vendorProducts: Product[];
  vendorOrders: Order[];
  createProduct: (data: { title: string; description: string; price: number; wholesalePrice?: number; wholesaleMinQty?: number; image?: string; images?: string[]; variants?: any; category: string; stock: number }) => Promise<boolean>;
  updateProduct: (id: string, data: { title?: string; description?: string; price?: number; wholesalePrice?: number; wholesaleMinQty?: number; image?: string; images?: string[]; variants?: any; category?: string; stock?: number }) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  withdrawEscrowFunds: (data: { method: string; accountNumber: string }) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
  fetchVendorOrders?: () => Promise<void>;
}

export default function VendorPortal({
  user,
  vendorProducts,
  vendorOrders,
  createProduct,
  updateProduct,
  deleteProduct,
  withdrawEscrowFunds,
  fetchStats,
  formatCurrency,
  isLoading,
  fetchVendorOrders
}: VendorPortalProps) {
  const { t } = useTranslation();
  const [vendorTab, setVendorTab] = useState<"articles" | "form" | "sales" | "escrow" | "profil" | "analytics" | "reviews" | "calculator" | "promos">("articles");
  const [dispatchOtp, setDispatchOtp] = useState<{ [orderId: string]: string }>({});

  // Sound and Toast Notifications State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("lgf_seller_sound_enabled") !== "false";
  });
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: "order" | "payment" | "stock" | "delivery"; orderId?: string } | null>(null);
  const prevOrdersCountRef = useRef<number>(vendorOrders.length);

  const playNotificationChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("lgf_seller_sound_enabled", next ? "true" : "false");
  };

  // Detect incoming new orders in real-time
  useEffect(() => {
    if (vendorOrders.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
      const newest = vendorOrders[0];
      playNotificationChime();
      setActiveToast({
        id: newest.id || Date.now().toString(),
        title: "🛒 Nouvelle commande reçue !",
        message: `Commande de ${newest.product?.title || "votre article"} (${formatCurrency(newest.total)}).`,
        type: "order",
        orderId: newest.id
      });
    }
    prevOrdersCountRef.current = vendorOrders.length;
  }, [vendorOrders.length]);

  // CSV Import States
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  // AI Description Generator State
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Delivery Maps states
  const [activeOrderMapId, setActiveOrderMapId] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any | null>(null);

  // Reviews & Notifications system states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState<"daily" | "weekly" | "monthly">("daily");

  // Dynamic Boutique States
  const [shopName, setShopName] = useState(user.name || "");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState(user.phone || "");
  const [location, setLocation] = useState("Lomé (Grand Marché, Assigamé)");
  const [latitude, setLatitude] = useState(6.1375);
  const [longitude, setLongitude] = useState(1.2125);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwdChangeSuccess, setPwdChangeSuccess] = useState("");
  const [pwdChangeError, setPwdChangeError] = useState("");

  // Product Deletion State & Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    setDeleteError(null);
    try {
      const ok = await deleteProduct(productToDelete.id);
      if (ok) {
        setProductToDelete(null);
      } else {
        setDeleteError("Impossible de supprimer cet article. Veuillez réessayer.");
      }
    } catch (err: any) {
      setDeleteError(err?.message || "Erreur réseau lors de la suppression.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeError("");
    setPwdChangeSuccess("");

    if (newPassword.length < 6) {
      setPwdChangeError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdChangeError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setIsChangingPassword(true);
    try {
      if (auth?.currentUser) {
        const { updatePassword } = await import("firebase/auth");
        await updatePassword(auth.currentUser, newPassword);
        console.log("🔥 [Firebase Auth] Password successfully updated!");
      } else {
        await new Promise((res) => setTimeout(res, 600));
      }
      setPwdChangeSuccess("Votre mot de passe a été modifié avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdChangeSuccess(""), 4000);
    } catch (err: any) {
      console.error("❌ Error changing password:", err);
      if (err?.code === "auth/requires-recent-login") {
        setPwdChangeError("Par mesure de sécurité, veuillez vous déconnecter puis vous reconnected avant de modifier votre mot de passe.");
      } else {
        setPwdChangeError("Impossible de modifier le mot de passe: " + (err?.message || "Erreur inconnue"));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load boutique profile from Firestore vendors collection
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await firestoreSync.getDocument("vendors", user.id);
        if (data) {
          if (data.shopName) setShopName(data.shopName);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.whatsapp) setWhatsapp(data.whatsapp);
          if (data.location) setLocation(data.location);
          if (data.latitude) setLatitude(data.latitude);
          if (data.longitude) setLongitude(data.longitude);
        }
      } catch (e) {
        console.error("Error loading boutique profile:", e);
      }
    };
    loadProfile();
  }, [user.id]);

  // Subscribe to Reviews and Notifications for this vendor
  useEffect(() => {
    // 1. Subscribe to Reviews
    const unsubReviews = firestoreSync.subscribeCollection("reviews", (allReviews) => {
      const filtered = allReviews.filter((r) => r.vendorId === user.id);
      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(filtered);
    });

    // 2. Subscribe to Notifications
    const unsubNotifs = firestoreSync.subscribeCollection("notifications", (allNotifs) => {
      const filtered = allNotifs.filter((n) => n.vendorId === user.id);
      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(filtered);
    });

    return () => {
      unsubReviews();
      unsubNotifs();
    };
  }, [user.id]);

  const handleMarkAllNotificationsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      for (const n of unread) {
        await firestoreSync.saveDocument("notifications", n.id, { ...n, read: true });
      }
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  // Google Maps Autocomplete
  useEffect(() => {
    let active = true;
    const initAutocomplete = async () => {
      try {
        const google = await getGoogleMaps();
        if (google && google.maps && inputRef.current && active) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ["geocode", "establishment"],
            componentRestrictions: { country: "tg" }
          });

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              setLatitude(lat);
              setLongitude(lng);
              if (place.formatted_address) {
                setLocation(place.formatted_address);
              } else if (place.name) {
                setLocation(place.name);
              }
            }
          });
          autocompleteRef.current = autocomplete;
        }
      } catch (err) {
        console.warn("Failed to load places autocomplete:", err);
      }
    };
    initAutocomplete();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      const boutiqueData = {
        vendorId: user.id,
        shopName,
        logoUrl: logoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=200&auto=format&fit=crop",
        whatsapp,
        location,
        latitude,
        longitude,
        updatedAt: new Date().toISOString()
      };
      await firestoreSync.saveDocument("vendors", user.id, boutiqueData);
      setProfileSuccessMsg("Profil de la boutique enregistré avec succès dans Firestore !");
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (e) {
      alert("Erreur lors de l'enregistrement du profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleTogoMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click % to coordinates
    const pctX = x / rect.width;
    const pctY = y / rect.height;
    
    // Togo Lat range: 6.1 (Lomé) to 11.1 (Dapaong). Lng range: 0.1 to 1.7.
    const newLat = parseFloat((6.1 + (1 - pctY) * 5.0).toFixed(5));
    const newLng = parseFloat((0.1 + pctX * 1.6).toFixed(5));
    
    setLatitude(newLat);
    setLongitude(newLng);

    // Closest Hub Name
    let closestHubName = "Position personnalisée";
    let minDistance = 99999;
    Object.values(TOGO_HUBS).forEach((hub) => {
      const dist = Math.sqrt(Math.pow(hub.lat - newLat, 2) + Math.pow(hub.lng - newLng, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestHubName = hub.name;
      }
    });
    setLocation(`Boutique près de ${closestHubName} (GPS: ${newLat}, ${newLng})`);
  };

  const filteredVendorOrders = vendorOrders.filter((ord) => {
    if (!ord) return false;
    // Filter to show only orders containing items from this vendor (matched via escrowWallet vendor ID)
    if (ord.escrowWallet && ord.escrowWallet.vendorId) {
      return ord.escrowWallet.vendorId === user.id;
    }
    return true;
  });

  const handleDispatch = async (orderId: string) => {
    try {
      const token = localStorage.getItem("lgf_token");
      const res = await fetch(`/api/orders/${orderId}/dispatch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setDispatchOtp({ ...dispatchOtp, [orderId]: data.otp });
        alert(`Commande expédiée avec succès ! Le code OTP transporteur généré est : ${data.otp}`);
        if (fetchVendorOrders) await fetchVendorOrders();
        await fetchStats();
      } else {
        alert(data.error || "Erreur d'expédition.");
      }
    } catch (e) {
      alert("Erreur réseau.");
    }
  };

  // Form states
  const [prodTitle, setProdTitle] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodWholesalePrice, setProdWholesalePrice] = useState("");
  const [prodWholesaleMinQty, setProdWholesaleMinQty] = useState("");
  const [prodStock, setProdStock] = useState("10");
  const [prodCategory, setProdCategory] = useState("Mode & Textiles");
  const [prodImage, setProdImage] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Colors & Variants states
  const [hasVariants, setHasVariants] = useState(false);
  const [priceType, setPriceType] = useState<"SAME" | "DIFFERENT">("SAME");
  const [prodVariants, setProdVariants] = useState<{ color: string; price: string }[]>([
    { color: "", price: "" }
  ]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Withdrawal states
  const [withdrawMethod, setWithdrawMethod] = useState("TMoney");
  const [withdrawAccount, setWithdrawAccount] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingProduct) return;

    setIsSubmittingProduct(true);
    try {
      const primaryImg = prodImages.length > 0
        ? prodImages[0]
        : (prodImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop");

      let variantsToSave: { color: string; price?: number }[] | undefined = undefined;
      if (hasVariants) {
        const validVariants = prodVariants.filter((v) => v.color.trim() !== "");
        if (validVariants.length > 0) {
          variantsToSave = validVariants.map((v) => ({
            color: v.color.trim(),
            price: priceType === "DIFFERENT" && v.price ? parseFloat(v.price) : parseFloat(prodPrice)
          }));
        }
      }

      const payload = {
        title: prodTitle,
        description: prodDesc,
        price: parseFloat(prodPrice),
        wholesalePrice: prodWholesalePrice ? parseFloat(prodWholesalePrice) : undefined,
        wholesaleMinQty: prodWholesaleMinQty ? parseInt(prodWholesaleMinQty) : undefined,
        stock: parseInt(prodStock),
        category: prodCategory,
        image: primaryImg,
        images: prodImages,
        variants: variantsToSave
      };

      let ok;
      if (editingProductId) {
        ok = await updateProduct(editingProductId, payload);
      } else {
        ok = await createProduct(payload);
      }

      if (ok) {
        setVendorTab("articles");
      }
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = user.escrowWallet?.balance || 0;
    if (balance <= 0) {
      alert("Aucun fonds retirable disponible pour le moment.");
      return;
    }

    const ok = await withdrawEscrowFunds({
      method: withdrawMethod,
      accountNumber: withdrawAccount
    });

    if (ok) {
      setWithdrawAccount("");
      setVendorTab("articles");
    }
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvError("Le fichier est vide.");
        return;
      }

      const rows = text.split(/\r?\n/).map(row => {
        return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
      }).filter(row => row.length > 0 && row.some(col => col !== ""));

      if (rows.length < 2) {
        setCsvError("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données.");
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const titleIdx = headers.indexOf("title");
      const descIdx = headers.indexOf("description");
      const priceIdx = headers.indexOf("price");
      const stockIdx = headers.indexOf("stock");
      const catIdx = headers.indexOf("category");
      const imgIdx = headers.indexOf("image");
      const wholesalePriceIdx = headers.indexOf("wholesaleprice");
      const wholesaleMinQtyIdx = headers.indexOf("wholesaleminqty");

      if (titleIdx === -1 || descIdx === -1 || priceIdx === -1 || stockIdx === -1) {
        setCsvError("Colonnes requises manquantes. Le CSV doit contenir : 'title', 'description', 'price', 'stock'.");
        return;
      }

      const productsToCreate = [];
      const validationErrors = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const lineNum = i + 1;

        if (row.length < 4) continue;

        const title = row[titleIdx] || "";
        const description = row[descIdx] || "";
        const priceRaw = row[priceIdx] || "";
        const stockRaw = row[stockIdx] || "";
        const category = catIdx !== -1 && row[catIdx] ? row[catIdx] : "Mode & Textiles";
        const image = imgIdx !== -1 ? row[imgIdx] : "";
        const wholesalePriceRaw = wholesalePriceIdx !== -1 ? row[wholesalePriceIdx] : "";
        const wholesaleMinQtyRaw = wholesaleMinQtyIdx !== -1 ? row[wholesaleMinQtyIdx] : "";

        if (!title.trim()) {
          validationErrors.push(`Ligne ${lineNum} : Le titre est requis.`);
          continue;
        }
        if (!description.trim()) {
          validationErrors.push(`Ligne ${lineNum} : La description est requise.`);
          continue;
        }

        const price = parseFloat(priceRaw);
        if (isNaN(price) || price <= 0) {
          validationErrors.push(`Ligne ${lineNum} : Le prix "${priceRaw}" est invalide (doit être > 0).`);
          continue;
        }

        const stock = parseInt(stockRaw, 10);
        if (isNaN(stock) || stock < 0) {
          validationErrors.push(`Ligne ${lineNum} : Le stock "${stockRaw}" est invalide (doit être >= 0).`);
          continue;
        }

        let wholesalePrice = undefined;
        if (wholesalePriceRaw) {
          const wPrice = parseFloat(wholesalePriceRaw);
          if (!isNaN(wPrice) && wPrice > 0) {
            wholesalePrice = wPrice;
          }
        }

        let wholesaleMinQty = undefined;
        if (wholesaleMinQtyRaw) {
          const wQty = parseInt(wholesaleMinQtyRaw, 10);
          if (!isNaN(wQty) && wQty > 0) {
            wholesaleMinQty = wQty;
          }
        }

        productsToCreate.push({
          title,
          description,
          price,
          stock,
          category,
          image: image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
          wholesalePrice,
          wholesaleMinQty
        });
      }

      if (productsToCreate.length === 0) {
        setCsvError(`Aucun produit valide trouvé dans le fichier. Erreurs :\n${validationErrors.join("\n")}`);
        return;
      }

      if (validationErrors.length > 0) {
        setCsvError(`Certaines lignes contiennent des erreurs et ont été ignorées :\n${validationErrors.slice(0, 3).join("\n")}${validationErrors.length > 3 ? `\n...et ${validationErrors.length - 3} autres.` : ""}`);
      }

      // Batch create sequentially
      setIsImporting(true);
      setImportProgress(0);
      setImportTotal(productsToCreate.length);

      let successCount = 0;
      for (let i = 0; i < productsToCreate.length; i++) {
        const prod = productsToCreate[i];
        const ok = await createProduct(prod);
        if (ok) {
          successCount++;
        }
        setImportProgress(i + 1);
      }

      setIsImporting(false);
      setCsvSuccess(`${successCount} articles ont été importés avec succès !`);
      setShowCsvImport(false);
      setTimeout(() => setCsvSuccess(null), 6000);
    };

    reader.readAsText(file);
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,title,description,price,stock,category,image,wholesalePrice,wholesaleMinQty\n"
      + "Pagne Wax de Qualité,Tissu africain de premier choix 100% coton importé,15000,24,Mode & Textiles,,13000,5\n"
      + "Crème de Karité Bio,Hydratant corporel pur fait main au Togo,4500,50,Cosmétiques & Beauté,,4000,10\n"
      + "Bananes Plantain,Régime frais récolté localement au Togo,2500,100,Alimentation,,2000,20\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lgf_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateDescription = async () => {
    if (!prodTitle.trim()) {
      alert("Veuillez d'abord saisir la désignation (le titre) de l'article pour que l'IA puisse générer une fiche produit.");
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const token = localStorage.getItem("lgf_token");
      const res = await fetch("/api/gemini/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: prodTitle, category: prodCategory })
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setProdDesc(data.description);
      } else {
        alert(data.error || "Erreur de génération par l'IA.");
      }
    } catch (err) {
      alert("Erreur réseau. Impossible de contacter le service de génération IA.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProductId(p.id);
    setProdTitle(p.title);
    setProdDesc(p.description);
    setProdPrice(p.price.toString());
    setProdWholesalePrice(p.wholesalePrice ? p.wholesalePrice.toString() : "");
    setProdWholesaleMinQty(p.wholesaleMinQty ? p.wholesaleMinQty.toString() : "");
    setProdStock(p.stock.toString());
    setProdCategory(p.category);
    setProdImage(p.image || "");
    const initialImgs = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    setProdImages(initialImgs);

    let existingVariants: { color: string; price: string }[] = [];
    if (p.variants) {
      let parsed = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setHasVariants(true);
        existingVariants = parsed.map((v: any) => ({
          color: v.color || v.name || "",
          price: v.price ? v.price.toString() : ""
        }));
        const hasDiff = existingVariants.some((v) => v.price && v.price !== p.price.toString());
        setPriceType(hasDiff ? "DIFFERENT" : "SAME");
      } else {
        setHasVariants(false);
        setPriceType("SAME");
        existingVariants = [{ color: "", price: "" }];
      }
    } else {
      setHasVariants(false);
      setPriceType("SAME");
      existingVariants = [{ color: "", price: "" }];
    }
    setProdVariants(existingVariants);

    setVendorTab("form");
  };

  const handleNewClick = () => {
    setEditingProductId(null);
    setProdTitle("");
    setProdDesc("");
    setProdPrice("");
    setProdWholesalePrice("");
    setProdWholesaleMinQty("");
    setProdStock("10");
    setProdCategory("Mode & Textiles");
    setProdImage("");
    setProdImages([]);
    setHasVariants(false);
    setPriceType("SAME");
    setProdVariants([{ color: "", price: "" }]);
    setVendorTab("form");
  };

  return (
    <div id="vendor-portal" className="space-y-6 relative">
      {/* Real-time Toast Notification Banner */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-emerald-950 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 animate-bounce flex items-start space-x-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 text-xs space-y-1">
            <h4 className="font-extrabold text-amber-400 font-display">{activeToast.title}</h4>
            <p className="text-slate-200 leading-snug">{activeToast.message}</p>
            {activeToast.orderId && (
              <button
                onClick={() => {
                  setVendorTab("sales");
                  setActiveToast(null);
                }}
                className="mt-1 text-[10px] font-bold text-emerald-400 underline hover:text-emerald-300 cursor-pointer block"
              >
                Voir les détails de la commande →
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Controls Bar & Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm flex items-center space-x-1 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          id="tab-vendor-articles"
          onClick={() => setVendorTab("articles")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "articles"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t.products}</span>
        </button>
        <button
          id="tab-vendor-new"
          onClick={handleNewClick}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "form"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{t.addProduct}</span>
        </button>
        <button
          id="tab-vendor-sales"
          onClick={() => setVendorTab("sales")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "sales"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.myOrders} ({filteredVendorOrders.length})</span>
        </button>
        <button
          id="tab-vendor-calculator"
          onClick={() => setVendorTab("calculator")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "calculator"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Calculateur</span>
        </button>
        <button
          id="tab-vendor-analytics"
          onClick={() => setVendorTab("analytics")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "analytics"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.analytics}</span>
        </button>
        <button
          id="tab-vendor-reviews"
          onClick={() => {
            setVendorTab("reviews");
            handleMarkAllNotificationsRead();
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 relative ${
            vendorTab === "reviews"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>{t.reviews}</span>
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>
        <button
          id="tab-vendor-escrow"
          onClick={() => setVendorTab("escrow")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "escrow"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>{t.escrowWallet}</span>
        </button>
        <button
          id="tab-vendor-profile"
          onClick={() => setVendorTab("profil")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 ${
            vendorTab === "profil"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t.profile}</span>
        </button>

        {/* Audio Sound Toggle Button */}
        <button
          type="button"
          onClick={toggleSound}
          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0 ${
            soundEnabled
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
          }`}
          title={soundEnabled ? "Alerte sonore activée" : "Alerte sonore désactivée"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Articles list */}
      {vendorTab === "articles" && (
        <div id="vendor-articles-list" className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-lg font-bold text-emerald-950 font-display">Mon Catalogue Boutique</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCsvImport(!showCsvImport)}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer CSV</span>
                </button>
                <button
                  onClick={handleNewClick}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau</span>
                </button>
              </div>
            </div>

            {csvSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{csvSuccess}</span>
              </div>
            )}

            {csvError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-800 text-xs font-semibold whitespace-pre-line">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{csvError}</span>
              </div>
            )}

            {showCsvImport && (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider font-mono">Module d'importation CSV</span>
                  <button
                    onClick={downloadCsvTemplate}
                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Télécharger Modèle CSV</span>
                  </button>
                </div>

                <div 
                  className="relative border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                  onClick={() => document.getElementById("csv-file-input")?.click()}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvFileSelect}
                  />
                  <Upload className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-xs font-bold text-emerald-950 block">Sélectionnez ou Glissez-déposez votre fichier CSV</span>
                  <span className="text-[10px] text-emerald-500 block mt-1">Colonnes: title, description, price, stock, category (facultatif), image (facultatif), wholesalePrice (facultatif), wholesaleMinQty (facultatif)</span>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-emerald-900">
                      <span>Importation en cours...</span>
                      <span>{importProgress} / {importTotal}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${(importProgress / importTotal) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {vendorProducts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-emerald-100 rounded-3xl">
                <ShoppingBag className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-emerald-600">Vous n'avez pas encore d'article publié.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendorProducts.map((p) => (
                  <div key={p.id} className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex space-x-4 relative group">
                    {p.image && (
                      <img src={p.image} alt={p.title} referrerPolicy="no-referrer" className="w-20 h-20 object-cover rounded-xl shrink-0 border border-slate-150" />
                    )}
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-[8px] font-mono font-bold bg-white border border-emerald-150 text-emerald-800 px-1.5 py-0.5 rounded-md uppercase">
                        {p.category}
                      </span>
                      <h4 className="font-extrabold text-xs text-emerald-950 truncate pt-1">{p.title}</h4>
                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="text-emerald-700">Détail: {formatCurrency(p.price)}</span>
                        <span className="font-bold text-emerald-950">Stock: {p.stock}</span>
                      </div>

                      {/* Dynamic Stock & Availability quick adjustments */}
                      <div className="flex items-center justify-between gap-1 mt-2 p-1.5 bg-white border border-emerald-50 rounded-xl">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              const newStock = Math.max(0, p.stock - 1);
                              updateProduct(p.id, { stock: newStock });
                            }}
                            className="w-5 h-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded flex items-center justify-center font-bold text-[10px] text-emerald-950 cursor-pointer"
                            title="Réduire le stock de 1"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-bold text-emerald-950 font-mono min-w-[20px] text-center">{p.stock}</span>
                          <button
                            onClick={() => {
                              const newStock = p.stock + 1;
                              updateProduct(p.id, { stock: newStock });
                            }}
                            className="w-5 h-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded flex items-center justify-center font-bold text-[10px] text-emerald-950 cursor-pointer"
                            title="Augmenter le stock de 1"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            const newStock = p.stock > 0 ? 0 : 10;
                            updateProduct(p.id, { stock: newStock });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                            p.stock > 0
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {p.stock > 0 ? "🟢 En stock" : "🔴 Rupture"}
                        </button>
                      </div>
                      {p.wholesalePrice && (
                        <p className="text-[10px] text-amber-700 font-medium font-mono">
                          Gros: {formatCurrency(p.wholesalePrice)} dès {p.wholesaleMinQty}p.
                        </p>
                      )}
                      <div className="flex space-x-2 pt-2 justify-end border-t border-emerald-100/50 mt-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setProductToDelete(p);
                          }}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Form view */}
      {vendorTab === "form" && (
        <div id="vendor-article-form" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-display">
                {editingProductId ? "Modifier l'Article" : "Ajouter un Article au Catalogue"}
              </h3>
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block font-mono">
                Configuration de vente (gros et détails)
              </span>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Désignation de l'Article :</label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="ex: Wax Hollandais"
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Catégorie :</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  <option value="Mode & Textiles">Mode & Textiles</option>
                  <option value="Cosmétiques & Beauté">Cosmétiques & Beauté</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Électronique">Électronique</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-emerald-700 uppercase block">Description / Fiche technique :</label>
                <button
                  type="button"
                  disabled={isGeneratingDesc}
                  onClick={handleGenerateDescription}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-extrabold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>{isGeneratingDesc ? "Génération..." : "Générer par l'IA"}</span>
                </button>
              </div>
              <textarea
                required
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Spécifications, origine, tailles, etc."
                rows={4}
                className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Prix Détail (XOF) :</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="12500"
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Prix Gros (XOF) :</label>
                <input
                  type="number"
                  value={prodWholesalePrice}
                  onChange={(e) => setProdWholesalePrice(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-amber-50/50 border border-amber-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Seuil Gros (Min Qty) :</label>
                <input
                  type="number"
                  value={prodWholesaleMinQty}
                  onChange={(e) => setProdWholesaleMinQty(e.target.value)}
                  placeholder="5"
                  className="w-full bg-amber-50/50 border border-amber-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Stock Initial :</label>
                <input
                  type="number"
                  required
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  placeholder="50"
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Colors & Variants Section */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasVariantsToggle"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="hasVariantsToggle" className="text-xs font-bold text-emerald-950 cursor-pointer">
                    Cet article est disponible en plusieurs couleurs / modèles
                  </label>
                </div>
              </div>

              {hasVariants && (
                <div className="space-y-3 pt-2 border-t border-emerald-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Structure de prix :</label>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-900">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="priceType"
                          value="SAME"
                          checked={priceType === "SAME"}
                          onChange={() => setPriceType("SAME")}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Même prix pour toutes les couleurs ({prodPrice || "0"} FCFA)</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="priceType"
                          value="DIFFERENT"
                          checked={priceType === "DIFFERENT"}
                          onChange={() => setPriceType("DIFFERENT")}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Prix différent selon la couleur</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Couleurs / Variantes disponibles :</label>
                    {prodVariants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => {
                            const updated = [...prodVariants];
                            updated[idx].color = e.target.value;
                            setProdVariants(updated);
                          }}
                          placeholder="ex: Blanc, Bleu, Rose, Gris..."
                          className="flex-1 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-950 focus:outline-none font-medium"
                        />
                        {priceType === "DIFFERENT" && (
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...prodVariants];
                              updated[idx].price = e.target.value;
                              setProdVariants(updated);
                            }}
                            placeholder={`Prix (ex: ${prodPrice || "4900"})`}
                            className="w-32 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                          />
                        )}
                        {prodVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setProdVariants(prodVariants.filter((_, i) => i !== idx))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Supprimer cette couleur"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setProdVariants([...prodVariants, { color: "", price: prodPrice }])}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ajouter une couleur</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <ProductImageUploader
                images={prodImages}
                onChange={(newImgs) => {
                  setProdImages(newImgs);
                  if (newImgs.length > 0) {
                    setProdImage(newImgs[0]);
                  } else {
                    setProdImage("");
                  }
                }}
              />
            </div>

            <div className="flex space-x-3 pt-3 border-t border-emerald-50">
              <button
                type="button"
                onClick={() => setVendorTab("articles")}
                disabled={isSubmittingProduct}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSubmittingProduct && <Clock className="w-4 h-4 animate-spin" />}
                <span>{editingProductId ? "Enregistrer les modifications" : "Publier l'Article"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Orders Tracking */}
      {vendorTab === "sales" && (
        <div id="vendor-sales-orders" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <h3 className="text-lg font-bold text-emerald-950 font-display flex items-center">
            <Coins className="w-5 h-5 mr-2 text-emerald-600" />
            Suivi des Ventes Clients
          </h3>

          {filteredVendorOrders.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-100">
              <ShoppingBag className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-600">Aucune commande client reçue pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVendorOrders.map((ord) => (
                <div key={ord.id} className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-emerald-500 font-bold block uppercase font-mono">Commande #{ord.id.slice(0, 8)}</span>
                      <p className="text-xs font-semibold text-emerald-950 pt-0.5">Acheteur : {ord.buyer?.name || "Client"}</p>
                      <p className="text-[10px] text-emerald-700 font-mono">Mail/Tel: {ord.buyer?.email} / {ord.buyer?.phone || "N/A"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      ord.status === "ESCROW_HELD"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : ord.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      {ord.status === "ESCROW_HELD" ? "Séquestré (En attente)" : "Libéré"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-emerald-50 font-mono">
                    <span className="text-emerald-700">Total payé:</span>
                    <span className="font-extrabold text-emerald-950">{formatCurrency(ord.total)}</span>
                  </div>

                  {ord.status === "ESCROW_HELD" && (
                    <div className="pt-2 border-t border-dashed border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                      <span className="text-[10px] text-amber-600 font-semibold">🔒 Séquestre activé. Prêt pour expédition.</span>
                      <button
                        onClick={() => handleDispatch(ord.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-[10px] uppercase shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        Expédier (Générer OTP) 📦
                      </button>
                    </div>
                  )}

                  {ord.status === "DISPATCHED" && (
                    <div className="pt-2 border-t border-dashed border-emerald-100 flex justify-between items-center text-[10px]">
                      <span className="text-blue-600 font-bold uppercase font-mono">🚚 En cours de livraison</span>
                      {dispatchOtp[ord.id] ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-bold font-mono">
                          OTP Chauffeur: {dispatchOtp[ord.id]}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-semibold">OTP déjà communiqué au transporteur</span>
                      )}
                    </div>
                  )}

                  {ord.status === "DELIVERED" && (
                    <div className="pt-2 border-t border-dashed border-emerald-100 text-[10px] text-emerald-600 font-bold uppercase font-mono">
                      ✅ Colis Livré (En attente de libération du séquestre par l'acheteur)
                    </div>
                  )}

                  {/* Google Maps Delivery Route Tracker Integration */}
                  <div className="pt-2 border-t border-dashed border-emerald-100 flex justify-between items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      <span>Livraison vers : {ord.buyer?.phone ? ord.buyer.phone : "Lomé Hub"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (activeOrderMapId === ord.id) {
                          setActiveOrderMapId(null);
                          setRouteInfo(null);
                        } else {
                          setActiveOrderMapId(ord.id);
                          setMapLoading(true);
                          const destNode = ord.buyer?.phone || "Kpalime";
                          const route = await calculateRoute(location, destNode);
                          setRouteInfo(route);
                          setMapLoading(false);
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                    >
                      {activeOrderMapId === ord.id ? "Masquer la Carte 🗺️" : "Itinéraire Livraison 📍"}
                    </button>
                  </div>

                  {activeOrderMapId === ord.id && (
                    <div className="mt-3 p-4 bg-white border border-emerald-100 rounded-2xl space-y-3">
                      {mapLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-2">
                          <Navigation className="w-6 h-6 text-emerald-600 animate-spin" />
                          <span className="text-[10px] font-mono text-emerald-600 uppercase">Génération de l'itinéraire Togo...</span>
                        </div>
                      ) : routeInfo ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                            <div>
                              <span className="text-[8px] text-emerald-600 font-bold block uppercase font-mono">Départ (Boutique)</span>
                              <span className="text-[10px] font-extrabold text-emerald-950 block truncate">{routeInfo.origin}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-emerald-600 font-bold block uppercase font-mono">Arrivée (Client)</span>
                              <span className="text-[10px] font-extrabold text-emerald-950 block truncate">{routeInfo.destination}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-emerald-600 font-bold block uppercase font-mono">Distance</span>
                              <span className="text-xs font-mono font-black text-emerald-950 block">{routeInfo.distanceKm} km</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-emerald-600 font-bold block uppercase font-mono">Transit Est.</span>
                              <span className="text-xs font-mono font-black text-emerald-950 block">{routeInfo.durationMinutes} min</span>
                            </div>
                          </div>

                          <div className="relative border border-emerald-100 bg-slate-50 rounded-2xl overflow-hidden h-[240px] shadow-inner select-none flex items-center justify-center">
                            <svg className="w-full h-full text-emerald-900" viewBox="0 0 400 240">
                              <g stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3,3">
                                <line x1="50" y1="0" x2="50" y2="240" />
                                <line x1="100" y1="0" x2="100" y2="240" />
                                <line x1="150" y1="0" x2="150" y2="240" />
                                <line x1="200" y1="0" x2="200" y2="240" />
                                <line x1="250" y1="0" x2="250" y2="240" />
                                <line x1="300" y1="0" x2="300" y2="240" />
                                <line x1="350" y1="0" x2="350" y2="240" />
                                
                                <line x1="0" y1="40" x2="400" y2="40" />
                                <line x1="0" y1="80" x2="400" y2="80" />
                                <line x1="0" y1="120" x2="400" y2="120" />
                                <line x1="0" y1="160" x2="400" y2="160" />
                                <line x1="0" y1="200" x2="400" y2="200" />
                              </g>

                              <rect x="0" y="210" width="400" height="30" fill="#e0f2fe" opacity="0.6" />
                              <text x="180" y="228" className="text-[10px] font-mono fill-sky-500 font-bold uppercase tracking-wider">Golfe de Guinée</text>

                              <path
                                d="M 140,10 L 170,10 L 190,50 L 180,90 L 190,130 L 160,170 L 175,200 L 170,210 L 130,210 L 130,180 L 145,150 L 135,110 L 150,70 L 140,10 Z"
                                fill="#f0fdf4"
                                stroke="#86efac"
                                strokeWidth="1.5"
                                opacity="0.95"
                              />

                              {(() => {
                                const points = routeInfo.polylinePath.map((p: any) => {
                                  const y = 210 - ((p.lat - 6.1) / 5.0) * 200;
                                  const x = 130 + ((p.lng - 0.1) / 1.6) * 40;
                                  return `${x},${y}`;
                                }).join(" ");

                                return (
                                  <>
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="#cbd5e1"
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      opacity="0.8"
                                    />
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeDasharray="4,4"
                                    />
                                  </>
                                );
                              })()}

                              {(() => {
                                const y = 210 - ((routeInfo.startCoords.lat - 6.1) / 5.0) * 200;
                                const x = 130 + ((routeInfo.startCoords.lng - 0.1) / 1.6) * 40;
                                return (
                                  <g>
                                    <circle cx={x} cy={y} r="5" className="fill-emerald-600 animate-pulse" />
                                    <circle cx={x} cy={y} r="8" className="stroke-emerald-600 fill-none" />
                                    <text x={x + 7} y={y + 3} className="text-[7px] font-black fill-emerald-950 font-mono bg-white/60 rounded">BOUTIQUE</text>
                                  </g>
                                );
                              })()}

                              {(() => {
                                const y = 210 - ((routeInfo.endCoords.lat - 6.1) / 5.0) * 200;
                                const x = 130 + ((routeInfo.endCoords.lng - 0.1) / 1.6) * 40;
                                return (
                                  <g>
                                    <circle cx={x} cy={y} r="5" className="fill-rose-600 animate-pulse" />
                                    <circle cx={x} cy={y} r="8" className="stroke-rose-600 fill-none" />
                                    <text x={x + 7} y={y + 3} className="text-[7px] font-black fill-rose-950 font-mono bg-white/60 rounded">CLIENT</text>
                                  </g>
                                );
                              })()}
                            </svg>
                            <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded text-white text-[8px] font-mono flex items-center space-x-1 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>SUIVI COMMANDE DISPATCH LIVE</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs font-semibold text-rose-600">
                          Impossible de charger l'itinéraire. Veuillez réessayer.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {vendorTab === "escrow" && (
        <div id="vendor-wallet-section" className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200/50">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950 font-display">Mon Portefeuille Séquestre</h3>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider block font-mono">
                  Gains et conformité BCEAO / Lomé
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block font-mono">Solde Libéré (Retirable)</span>
                <p className="text-2xl font-extrabold text-emerald-950 font-display font-mono">
                  {formatCurrency(user.escrowWallet?.balance || 0)}
                </p>
                <span className="text-[8px] text-emerald-700 font-medium block">
                  Disponible immédiatement pour retrait Mobile Money
                </span>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1">
                <span className="text-[9px] uppercase font-bold text-amber-800 block font-mono">Bloqué Séquestre (Client)</span>
                <p className="text-2xl font-extrabold text-amber-950 font-display font-mono">
                  {formatCurrency(user.escrowWallet?.pendingBalance || 0)}
                </p>
                <span className="text-[8px] text-amber-700 font-medium block">
                  Libéré dès que les clients confirment la livraison
                </span>
              </div>
            </div>

            {/* Withdrawal form */}
            <form onSubmit={handleWithdrawSubmit} className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-4">
              <h4 className="text-xs font-bold text-emerald-800 uppercase">Faire une Demande de Retrait Mobile Money :</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 block">Opérateur de retrait :</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none cursor-pointer"
                  >
                    <option value="TMoney">TMoney (Togo)</option>
                    <option value="Flooz">Moov Flooz (Togo)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 block">N° de téléphone destinataire :</label>
                  <input
                    type="text"
                    required
                    placeholder="+228 90 00 00 00"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!(user.escrowWallet?.balance && user.escrowWallet.balance > 0)}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-emerald-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Transférer mon Solde Libéré vers mon Compte Mobile Money 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profil Boutique / settings with Google Maps Address lookup & WhatsApp */}
      {vendorTab === "profil" && (
        <div id="vendor-profile-section" className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950 font-display">Paramètres de ma Boutique</h3>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider block font-mono">
                  Identité de boutique & Localisation de ramassage livreur
                </span>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase block">Nom de la Boutique :</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="ex: Boutique de l'Assigamé"
                    className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase block">Téléphone / WhatsApp (+228...) :</label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+228 90 90 90 90"
                    className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[9px] text-emerald-500">Saisissez l'indicatif international complet sans espaces pour le bouton WhatsApp direct.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-700 uppercase block">Image de couverture / Logo de Boutique (URL) :</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1441986300917-64674bd600d8"
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                />
              </div>

              {/* Address lookup */}
              <div className="space-y-3 pt-3 border-t border-emerald-50">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase block flex items-center justify-between">
                    <span>Recherche Adresse Physique (Google Maps) :</span>
                    <span className="text-[8px] text-emerald-500 font-mono lowercase">Recherche assistée auto-complétée</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Tapez un quartier ou marché au Togo (ex: Assigamé, Lomé, Kara...)"
                      className="w-full bg-emerald-50 border border-emerald-100 pl-10 pr-4 py-2.5 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                {/* Vector Map click-to-pin coordinate simulator */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Placer un Repère sur la Carte du Togo :</span>
                    
                    <div className="relative border border-emerald-100 bg-slate-50 rounded-2xl overflow-hidden h-[240px] shadow-inner select-none flex items-center justify-center">
                      {/* Togo interactive Vector grid */}
                      <svg
                        onClick={handleTogoMapClick}
                        className="w-full h-full text-emerald-900 cursor-crosshair hover:bg-emerald-50/20 transition-all"
                        viewBox="0 0 400 240"
                      >
                        {/* Grid gridlines to make it look like a technical navigation dashboard */}
                        <g stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3,3">
                          <line x1="50" y1="0" x2="50" y2="240" />
                          <line x1="100" y1="0" x2="100" y2="240" />
                          <line x1="150" y1="0" x2="150" y2="240" />
                          <line x1="200" y1="0" x2="200" y2="240" />
                          <line x1="250" y1="0" x2="250" y2="240" />
                          <line x1="300" y1="0" x2="300" y2="240" />
                          <line x1="350" y1="0" x2="350" y2="240" />
                          
                          <line x1="0" y1="40" x2="400" y2="40" />
                          <line x1="0" y1="80" x2="400" y2="80" />
                          <line x1="0" y1="120" x2="400" y2="120" />
                          <line x1="0" y1="160" x2="400" y2="160" />
                          <line x1="0" y1="200" x2="400" y2="200" />
                        </g>

                        {/* Beautiful stylized coast outline representation */}
                        <rect x="0" y="210" width="400" height="30" fill="#e0f2fe" opacity="0.6" />
                        <text x="180" y="228" className="text-[10px] font-mono fill-sky-500 font-bold uppercase tracking-wider">Golfe de Guinée</text>

                        {/* Togo border outline simplified */}
                        <path
                          d="M 140,10 L 170,10 L 190,50 L 180,90 L 190,130 L 160,170 L 175,200 L 170,210 L 130,210 L 130,180 L 145,150 L 135,110 L 150,70 L 140,10 Z"
                          fill="#f0fdf4"
                          stroke="#86efac"
                          strokeWidth="2"
                          opacity="0.9"
                        />

                        {/* Labels for Regions */}
                        <text x="155" y="35" className="text-[8px] font-sans fill-emerald-800 font-bold opacity-60">Savanes</text>
                        <text x="165" y="75" className="text-[8px] font-sans fill-emerald-800 font-bold opacity-60">Kara</text>
                        <text x="160" y="115" className="text-[8px] font-sans fill-emerald-800 font-bold opacity-60">Centrale</text>
                        <text x="155" y="155" className="text-[8px] font-sans fill-emerald-800 font-bold opacity-60">Plateaux</text>
                        <text x="145" y="195" className="text-[8px] font-sans fill-emerald-800 font-bold opacity-60">Maritime (Lomé)</text>

                        {/* Hot spots / Hubs dots */}
                        {Object.values(TOGO_HUBS).map((h: any, i) => {
                          const normY = 210 - ((h.lat - 6.1) / 5.0) * 200;
                          const normX = 130 + ((h.lng - 0.1) / 1.6) * 40;
                          return (
                            <g key={i}>
                              <circle cx={normX} cy={normY} r="3" className="fill-emerald-600 animate-pulse" />
                              <text x={normX + 6} y={normY + 3} className="text-[7px] font-mono font-black fill-emerald-950 bg-white/50">{h.name}</text>
                            </g>
                          );
                        })}

                        {/* Pinned Marker representing Vendor store location */}
                        {(() => {
                          const markerY = 210 - ((latitude - 6.1) / 5.0) * 200;
                          const markerX = 130 + ((longitude - 0.1) / 1.6) * 40;
                          return (
                            <g className="animate-bounce">
                              <circle cx={markerX} cy={markerY} r="7" className="fill-rose-500/30" />
                              <circle cx={markerX} cy={markerY} r="4" className="fill-rose-600" />
                              <path d={`M ${markerX},${markerY} L ${markerX - 4},${markerY - 12} L ${markerX + 4},${markerY - 12} Z`} className="fill-rose-600" />
                              <circle cx={markerX} cy={markerY - 12} r="3.5" className="fill-rose-600" />
                              <circle cx={markerX} cy={markerY - 12} r="1.5" className="fill-white" />
                            </g>
                          );
                        })()}
                      </svg>

                      {/* Map info bar */}
                      <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[9px] font-mono flex items-center space-x-1 border border-slate-700">
                        <Navigation className="w-3 h-3 text-rose-400 animate-spin" />
                        <span>GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hub selector and GPS coordinates */}
                  <div className="space-y-4">
                    <div className="space-y-1.5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                      <span className="text-[9px] font-extrabold text-emerald-800 uppercase block font-mono">Position Actuelle</span>
                      <div className="text-xs leading-normal">
                        <p className="font-bold text-emerald-950">Adresse active :</p>
                        <p className="text-emerald-800 text-[11px] font-medium italic mt-0.5">{location}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-emerald-100 text-[10px] font-mono text-emerald-950">
                        <div>
                          <span className="text-[8px] text-emerald-600 block">Latitude :</span>
                          <span className="font-bold">{latitude}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-emerald-600 block">Longitude :</span>
                          <span className="font-bold">{longitude}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-extrabold text-emerald-700 uppercase block font-mono">Centrer sur un Hub de Commerce :</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.values(TOGO_HUBS).map((h: any, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setLatitude(h.lat);
                              setLongitude(h.lng);
                              setLocation(`${h.name} (Boutique LGF Mall)`);
                            }}
                            className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-800 transition-colors cursor-pointer text-left truncate"
                          >
                            📍 {h.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md shadow-emerald-600/15 cursor-pointer flex items-center justify-center space-x-2 transition-all uppercase tracking-wider"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? "Enregistrement en cours..." : "Enregistrer le Profil de la Boutique"}</span>
              </button>
            </form>

            {/* Sécurité et Changement de mot de passe */}
            <div className="mt-8 pt-8 border-t border-emerald-100/80">
              <div className="flex items-center space-x-2 mb-4">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-bold font-display text-emerald-950">Sécurité du Compte & Mot de passe</h4>
              </div>

              {pwdChangeSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center space-x-2 mb-4 text-xs font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pwdChangeSuccess}</span>
                </div>
              )}

              {pwdChangeError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-center space-x-2 mb-4 text-xs font-semibold animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{pwdChangeError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <PasswordInput
                  label="Nouveau mot de passe"
                  requiredStar
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimim 6 caractères"
                  autoComplete="new-password"
                />

                <PasswordInput
                  label="Confirmer le nouveau mot de passe"
                  requiredStar
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-5 rounded-xl text-xs cursor-pointer flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isChangingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Profit Calculator Tab */}
      {vendorTab === "calculator" && (
        <SellerProfitCalculator formatCurrency={formatCurrency} />
      )}

      {/* Sales Analytics Tab */}
      {vendorTab === "analytics" && (
        <div id="vendor-analytics" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-emerald-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <BarChart3 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950 font-display">Analyses de Ventes</h3>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider block font-mono">
                  Suivi des revenus réels et cumulés de votre boutique
                </span>
              </div>
            </div>

            {/* Range Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 font-mono text-[10px] font-bold">
              {(["daily", "weekly", "monthly"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setAnalyticsRange(range)}
                  className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                    analyticsRange === range
                      ? "bg-white text-emerald-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {range === "daily" ? "Quotidien" : range === "weekly" ? "Hebdomadaire" : "Mensuel"}
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[9px] uppercase font-bold text-emerald-700 block font-mono">Chiffre d'Affaires</span>
              <span className="text-xl font-extrabold font-mono text-emerald-950 mt-1 block">
                {formatCurrency(filteredVendorOrders.reduce((sum, o) => sum + o.total, 0))}
              </span>
            </div>
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-center">
              <span className="text-[9px] uppercase font-bold text-amber-700 block font-mono">En Séquestre Actif</span>
              <span className="text-xl font-extrabold font-mono text-amber-950 mt-1 block">
                {formatCurrency(filteredVendorOrders.filter(o => o.status === "ESCROW_HELD" || o.status === "DISPATCHED").reduce((sum, o) => sum + o.total, 0))}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-500 block font-mono">Volume Commandes</span>
              <span className="text-xl font-extrabold font-mono text-emerald-950 mt-1 block">
                {filteredVendorOrders.length}
              </span>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <h4 className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider font-mono mb-4">Revenus de vente (XOF) :</h4>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    analyticsRange === "daily"
                      ? (() => {
                          const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                          const data = [];
                          const now = new Date();
                          for (let i = 6; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(now.getDate() - i);
                            const dayName = days[d.getDay()];
                            const dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                            const total = filteredVendorOrders
                              .filter((ord) => new Date(ord.createdAt).toDateString() === d.toDateString())
                              .reduce((sum, ord) => sum + ord.total, 0);
                            data.push({ name: `${dayName} ${dateStr}`, revenue: total });
                          }
                          return data;
                        })()
                      : analyticsRange === "weekly"
                      ? (() => {
                          const data = [];
                          const now = new Date();
                          for (let i = 3; i >= 0; i--) {
                            const start = new Date();
                            start.setDate(now.getDate() - (i * 7 + 6));
                            start.setHours(0, 0, 0, 0);
                            const end = new Date();
                            end.setDate(now.getDate() - i * 7);
                            end.setHours(23, 59, 59, 999);
                            const total = filteredVendorOrders
                              .filter((ord) => {
                                const ordDate = new Date(ord.createdAt);
                                return ordDate >= start && ordDate <= end;
                              })
                              .reduce((sum, ord) => sum + ord.total, 0);
                            data.push({ name: `Sem. -${i}`, revenue: total });
                          }
                          return data;
                        })()
                      : (() => {
                          const months = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
                          const data = [];
                          const now = new Date();
                          for (let i = 5; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            const total = filteredVendorOrders
                              .filter((ord) => {
                                const ordDate = new Date(ord.createdAt);
                                return ordDate.getMonth() === d.getMonth() && ordDate.getFullYear() === d.getFullYear();
                              })
                              .reduce((sum, ord) => sum + ord.total, 0);
                            data.push({ name: months[d.getMonth()], revenue: total });
                          }
                          return data;
                        })()
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#047857", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#334155" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                    formatter={(val: any) => [`${val.toLocaleString()} XOF`, "Revenu"]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reviews and Ratings Tab */}
      {vendorTab === "reviews" && (
        <div id="vendor-reviews" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-emerald-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-200/50">
                <Star className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950 font-display">Avis & Retours Clients</h3>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider block font-mono">
                  Évaluations, commentaires et alertes de satisfaction acheteurs
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall stats */}
            <div className="md:col-span-1 p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Moyenne Générale :</span>
              <span className="text-4xl font-extrabold text-emerald-950">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)).toFixed(1)} / 5
              </span>
              <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1))
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] text-emerald-600 font-bold font-mono uppercase">{reviews.length} Évaluations Reçues</span>
            </div>

            {/* List of reviews */}
            <div className="md:col-span-2 space-y-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono block">Derniers avis publiés :</span>
              
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Aucun avis client n'a été publié sur vos articles pour l'instant.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl space-y-2 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-emerald-950 font-sans block">{r.buyerName || "Acheteur Anonyme"}</span>
                          <span className="text-[8px] text-slate-500 block font-mono uppercase">{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <div className="flex space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${star <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-700 italic">« {r.comment} »</p>
                      {r.productTitle && (
                        <div className="text-[8px] text-emerald-600 font-bold uppercase font-mono bg-white border border-emerald-100 px-2 py-0.5 rounded w-max">
                          Article : {r.productTitle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div 
          id="delete-product-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            if (!isDeletingProduct) {
              setProductToDelete(null);
              setDeleteError(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-150 space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-black text-slate-900 font-display">Supprimer cet article ?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cette action supprimera définitivement cet article du catalogue de votre boutique LGF.
                </p>
              </div>
            </div>

            {/* Product summary card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3">
              {productToDelete.image && (
                <img 
                  src={productToDelete.image} 
                  alt={productToDelete.title} 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-white" 
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold font-mono text-emerald-800 bg-white border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                  {productToDelete.category}
                </span>
                <h4 className="text-xs font-bold text-slate-900 truncate mt-1">{productToDelete.title}</h4>
                <div className="flex items-center space-x-3 text-[11px] mt-0.5">
                  <span className="text-emerald-700 font-bold">{formatCurrency(productToDelete.price)}</span>
                  <span className="text-slate-500 font-medium">Stock: {productToDelete.stock}</span>
                </div>
              </div>
            </div>

            {deleteError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={handleConfirmDeleteProduct}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
