import React, { useState, useEffect } from "react";
import { ShoppingBag, Plus, Clock, Search, CheckCircle2, Lock, AlertCircle, Heart } from "lucide-react";
import { Product, Order } from "../types";
import ProductCard from "./ProductCard";
import tmoneyQrImage from "../assets/images/tmoney_merchant_qr_1784541339901.jpg";
import { useAppStore } from "../store";
import ProductDetailModal from "./ProductDetailModal";
import CartDrawer from "./CartDrawer";
import FacetedSearchPanel, { FacetedFilterState } from "./FacetedSearchPanel";
import EcobankPaymentCard from "./EcobankPaymentCard";
import WishlistSection from "./WishlistSection";
import { motion, AnimatePresence } from "motion/react";

interface BuyerPortalProps {
  products: Product[];
  buyerOrders: Order[];
  placeOrder: (data: { productId: string; quantity: number; paymentMethod: string }) => Promise<boolean>;
  confirmOrderDelivery: (orderId: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
  initialProductId?: string;
  initialQuantity?: number;
  initialTab?: "catalog" | "favorites" | "order" | "history";
}

export default function BuyerPortal({
  products,
  buyerOrders,
  placeOrder,
  confirmOrderDelivery,
  fetchStats,
  formatCurrency,
  isLoading,
  initialProductId,
  initialQuantity,
  initialTab
}: BuyerPortalProps) {
  const { 
    cart, 
    wishlist, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    toggleWishlist 
  } = useAppStore();

  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isPlacingCartOrders, setIsPlacingCartOrders] = useState(false);

  const [buyerTab, setBuyerTab] = useState<"catalog" | "favorites" | "order" | "history">(initialTab || "catalog");

  // Max catalog price for range calculation
  const maxCatalogPrice = Math.max(...products.map((p) => p.price || 0), 500000);

  // Faceted Search State initialized from URL query parameters
  const [facetedFilters, setFacetedFilters] = useState<FacetedFilterState>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get("search") || params.get("q") || "",
      category: params.get("category") || params.get("cat") || "Tous",
      vendor: params.get("vendor") || "all",
      region: params.get("region") || "Toutes Régions",
      minPrice: parseInt(params.get("minPrice") || "0", 10),
      maxPrice: parseInt(params.get("maxPrice") || "500000", 10),
      availability: (params.get("avail") as any) || "all",
      minRating: parseInt(params.get("rating") || "0", 10),
      sortBy: (params.get("sort") as any) || "featured"
    };
  });

  // Extract unique vendor names
  const availableVendors = Array.from(
    new Set(products.map((p) => p.vendor?.name || "Boutique d'Assigamé").filter(Boolean))
  );

  // Sync state changes back to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (facetedFilters.search) params.set("search", facetedFilters.search);
    if (facetedFilters.category !== "Tous") params.set("category", facetedFilters.category);
    if (facetedFilters.vendor !== "all") params.set("vendor", facetedFilters.vendor);
    if (facetedFilters.region !== "Toutes Régions") params.set("region", facetedFilters.region);
    if (facetedFilters.minPrice > 0) params.set("minPrice", facetedFilters.minPrice.toString());
    if (facetedFilters.maxPrice < 500000) params.set("maxPrice", facetedFilters.maxPrice.toString());
    if (facetedFilters.availability !== "all") params.set("avail", facetedFilters.availability);
    if (facetedFilters.sortBy !== "featured") params.set("sort", facetedFilters.sortBy);

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [facetedFilters]);

  // Filter & Sort Products dynamically
  const filteredProducts = products
    .filter((p) => {
      const query = facetedFilters.search.toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);

      const matchesCategory =
        facetedFilters.category === "Tous" || p.category === facetedFilters.category;

      const vendorName = p.vendor?.name || "Boutique d'Assigamé";
      const matchesVendor =
        facetedFilters.vendor === "all" || vendorName === facetedFilters.vendor;

      const matchesPrice =
        p.price >= facetedFilters.minPrice && p.price <= facetedFilters.maxPrice;

      const matchesAvail =
        facetedFilters.availability === "all"
          ? true
          : facetedFilters.availability === "in_stock"
          ? p.stock > 0
          : facetedFilters.availability === "wholesale"
          ? !!(p.wholesalePrice && p.wholesaleMinQty)
          : true;

      return matchesSearch && matchesCategory && matchesVendor && matchesPrice && matchesAvail;
    })
    .sort((a, b) => {
      if (facetedFilters.sortBy === "newest") return b.id.localeCompare(a.id);
      if (facetedFilters.sortBy === "price_asc") return a.price - b.price;
      if (facetedFilters.sortBy === "price_desc") return b.price - a.price;
      if (facetedFilters.sortBy === "bestseller") return (b.stock || 0) - (a.stock || 0);
      return 0;
    });

  const handleResetFilters = () => {
    setFacetedFilters({
      search: "",
      category: "Tous",
      vendor: "all",
      region: "Toutes Régions",
      minPrice: 0,
      maxPrice: 500000,
      availability: "all",
      minRating: 0,
      sortBy: "featured"
    });
  };

  const [orderProductId, setOrderProductId] = useState(initialProductId || "");
  const [orderQty, setOrderQty] = useState(initialQuantity || 1);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState("TMoney");
  const [orderPhone, setOrderPhone] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);

  // Sync internal state if initial props change (e.g. after login)
  React.useEffect(() => {
    if (initialProductId) {
      setOrderProductId(initialProductId);
    }
    if (initialQuantity) {
      setOrderQty(initialQuantity);
    }
    if (initialTab) {
      setBuyerTab(initialTab);
    }
  }, [initialProductId, initialQuantity, initialTab]);

  const selectedProd = products.find((p) => p.id === orderProductId);
  const isWholesale = selectedProd && selectedProd.wholesalePrice && selectedProd.wholesaleMinQty && orderQty >= selectedProd.wholesaleMinQty;
  const unitPrice = selectedProd ? (isWholesale ? (selectedProd.wholesalePrice as number) : selectedProd.price) : 0;
  const totalPrice = unitPrice * orderQty;

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderProductId) return;
    setShowOrderModal(true);
  };

  const handleConfirmPayment = async () => {
    const ok = await placeOrder({
      productId: orderProductId,
      quantity: orderQty,
      paymentMethod: orderPaymentMethod
    });
    if (ok) {
      setShowOrderModal(false);
      setOrderProductId("");
      setOrderQty(1);
      setBuyerTab("history");
    }
  };

  const handleCartCheckout = async (address: any, promoCode: string, paymentMethod: string) => {
    setIsPlacingCartOrders(true);
    let successCount = 0;
    
    for (const item of cart) {
      try {
        const ok = await placeOrder({
          productId: item.product.id,
          quantity: item.quantity,
          paymentMethod: paymentMethod
        });
        if (ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Error placing cart order:", err);
      }
    }
    
    setIsPlacingCartOrders(false);
    
    if (successCount > 0) {
      clearCart();
      alert(`Félicitations ! ${successCount} commande(s) sécurisée(s) enregistrée(s) en Séquestre LGF.`);
      setBuyerTab("history");
    } else {
      alert("Une erreur est survenue lors de la passation de commande.");
    }
  };

  return (
    <div id="buyer-portal" className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm flex space-x-1">
        <button
          id="tab-catalog"
          onClick={() => setBuyerTab("catalog")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            buyerTab === "catalog"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Catalogue des Articles</span>
        </button>
        <button
          id="tab-favorites"
          onClick={() => setBuyerTab("favorites")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 relative ${
            buyerTab === "favorites"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlist.length > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
          <span>Mes Favoris ({wishlist.length})</span>
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {wishlist.length}
            </span>
          )}
        </button>
        <button
          id="tab-order"
          onClick={() => setBuyerTab("order")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            buyerTab === "order"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Passer Commande</span>
        </button>
        <button
          id="tab-history"
          onClick={() => setBuyerTab("history")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            buyerTab === "history"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mes Achats & Escrow ({buyerOrders.length})</span>
        </button>
      </div>

      {/* Catalog view */}
      {buyerTab === "catalog" && (
        <div id="catalog-section" className="space-y-6">
          {/* Faceted Search Panel */}
          <FacetedSearchPanel
            filters={facetedFilters}
            onFilterChange={(newF) => setFacetedFilters((prev) => ({ ...prev, ...newF }))}
            onResetFilters={handleResetFilters}
            availableVendors={availableVendors}
            totalResultsCount={filteredProducts.length}
            maxCatalogPrice={maxCatalogPrice}
            formatCurrency={formatCurrency}
          />

          {/* Cart Header Drawer Action */}
          <div className="flex justify-end">
            <button
              id="buyer-cart-trigger"
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Voir mon Panier</span>
              <span className="bg-emerald-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold font-mono">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>
          </div>

          {/* Products Grid with 4 columns on ultra-wide screens (≥1600px / 2xl) and Framer Motion transitions */}
          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-3xl border border-emerald-100/50 shadow-sm space-y-3"
            >
              <ShoppingBag className="w-12 h-12 text-emerald-300 mx-auto" />
              <p className="text-sm font-bold text-emerald-950">Aucun produit ne correspond à ces critères de recherche.</p>
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Réinitialiser les filtres pour tout voir
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1600px]:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ProductCard
                      product={p}
                      formatCurrency={formatCurrency}
                      onBuy={(productId, qty) => {
                        setOrderProductId(productId);
                        setOrderQty(qty);
                        setBuyerTab("order");
                      }}
                      onOpenDetail={(product) => setSelectedModalProduct(product)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* Favorites Wishlist Section */}
      {buyerTab === "favorites" && (
        <WishlistSection
          products={products}
          formatCurrency={formatCurrency}
          onOpenDetail={(product) => setSelectedModalProduct(product)}
          onGoToCatalog={() => setBuyerTab("catalog")}
        />
      )}

      {/* Order placement Form */}
      {buyerTab === "order" && (
        <div id="order-form-section" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-display">Achat sécurisé en Séquestre LGF</h3>
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block font-mono">
                Protection acheteur de Lomé à Kara
              </span>
            </div>
          </div>

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-2">Choisir un article :</label>
              <select
                value={orderProductId}
                onChange={(e) => {
                  setOrderProductId(e.target.value);
                  setOrderQty(1);
                }}
                className="w-full bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                required
              >
                <option value="">-- Sélectionnez un produit du catalogue --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.title} ({formatCurrency(p.price)} - Stock: {p.stock}) {p.stock === 0 ? "[RUPTURE]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedProd && (
              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                <div className="flex items-start space-x-3">
                  {selectedProd.image && (
                    <img src={selectedProd.image} alt={selectedProd.title} referrerPolicy="no-referrer" className="w-16 h-16 object-cover rounded-xl border border-slate-150" />
                  )}
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-emerald-950">{selectedProd.title}</h4>
                    <p className="text-[10px] text-emerald-600 font-mono">
                      Vendeur ID: {selectedProd.vendorId}
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-white border border-emerald-150 text-[9px] font-bold text-emerald-800 rounded-md">
                      Catégorie: {selectedProd.category}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-700 block">Quantité :</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProd.stock}
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none"
                      required
                    />
                    <span className="text-[9px] text-emerald-500 font-mono">Stock maximum : {selectedProd.stock}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-700 block font-mono uppercase">Moyen de Consignation :</label>
                    <select
                      value={orderPaymentMethod}
                      onChange={(e) => {
                        setOrderPaymentMethod(e.target.value);
                        setPaymentWarning(null);
                      }}
                      className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="TMoney">TMoney (Togo)</option>
                      <option value="Flooz">Moov Flooz (Togo)</option>
                      <option value="Ecobank">Ecobank PI-UEMOA QR / Carte Bancaire</option>
                    </select>
                  </div>
                </div>

                {(orderPaymentMethod === "Ecobank" || orderPaymentMethod === "Card") && (
                  <div className="pt-2">
                    <EcobankPaymentCard amount={totalPrice} formatCurrency={formatCurrency} />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 block">Numéro Mobile Money (+228) :</label>
                  <input
                    type="text"
                    placeholder="90 00 00 00"
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-emerald-100/60 flex justify-between items-center text-xs">
                  <div>
                    {isWholesale ? (
                      <span className="text-amber-600 font-extrabold block">Tarif de Gros appliqué 🎉</span>
                    ) : (
                      <span className="text-emerald-700 block font-mono">Tarif Détail Standard</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 block text-[10px] uppercase font-bold">Total à bloquer en Escrow :</span>
                    <span className="text-lg font-extrabold text-emerald-950 font-display">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!orderProductId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Passer à la Caisse (Sécurisation Escrow)
            </button>
          </form>
        </div>
      )}

      {/* History view */}
      {buyerTab === "history" && (
        <div id="buyer-history-section" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <h3 className="text-lg font-bold text-emerald-950 font-display flex items-center">
            <Clock className="w-5 h-5 mr-2 text-emerald-600" />
            Historique des Achats & Escrow
          </h3>

          {buyerOrders.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-100">
              <ShoppingBag className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-600">Aucun achat enregistré sur ce compte.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyerOrders.map((ord) => (
                <div key={ord.id} className="p-5 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-emerald-950">Commande #{ord.id.slice(0, 8)}</h4>
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block font-mono">
                        Date : {new Date(ord.createdAt).toLocaleDateString()} • Paiement : {ord.paymentMethod || "Mobile Money"}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      ord.status === "ESCROW_HELD"
                        ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                        : ord.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      {ord.status === "ESCROW_HELD" ? "Séquestre Activé" : ord.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-white p-3 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-emerald-500 block text-[9px] font-bold uppercase font-mono">Montant bloqué :</span>
                      <span className="font-extrabold text-emerald-950">{formatCurrency(ord.total)}</span>
                    </div>
                    <div>
                      <span className="text-emerald-500 block text-[9px] font-bold uppercase font-mono">Statut Escrow :</span>
                      <span className="font-semibold text-emerald-950 flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${ord.status === "ESCROW_HELD" ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                        <span>{ord.status === "ESCROW_HELD" ? "Séquestré" : "Libéré"}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-500 block text-[9px] font-bold uppercase font-mono">Support Litiges :</span>
                      <a href="mailto:lgfmall.lmdg11@gmail.com" className="text-[10px] font-semibold text-emerald-950 underline hover:text-emerald-600 block font-mono">
                        lgfmall.lmdg11@gmail.com
                      </a>
                    </div>
                  </div>

                  {ord.status === "ESCROW_HELD" && (
                    <div className="space-y-2 pt-2 border-t border-emerald-100/50">
                      <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                        💡 <b>Important :</b> Ne cliquez sur le bouton de déblocage ci-dessous que si vous avez effectivement réceptionné et vérifié vos marchandises. Cette opération transfère instantanément l'argent au vendeur de manière irréversible.
                      </p>
                      <button
                        onClick={async () => {
                          if (confirm("Confirmez-vous la réception conforme de votre marchandise ? Les fonds séquestrés seront instantanément transférés au vendeur.")) {
                            const ok = await confirmOrderDelivery(ord.id);
                            if (ok) {
                              await fetchStats();
                            }
                          }
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmer la Livraison & Libérer l'Escrow</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showOrderModal && selectedProd && (
        <div className="fixed inset-0 bg-emerald-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-emerald-100 shadow-2xl text-emerald-950 space-y-5 my-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display">Paiement & Séquestre Sécurisé</h3>
              <p className="text-xs text-emerald-800">
                LGF's Mall garantit la sécurité de vos fonds jusqu'à livraison de votre commande.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2 text-xs leading-relaxed">
              <div className="flex justify-between border-b border-emerald-100/50 pb-1.5">
                <span className="text-emerald-700">Article sélectionné :</span>
                <span className="font-bold text-emerald-950">{selectedProd.title}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-100/50 pb-1.5">
                <span className="text-emerald-700">Quantité :</span>
                <span className="font-bold text-emerald-950">{orderQty} pièces</span>
              </div>
              <div className="flex justify-between border-b border-emerald-100/50 pb-1.5">
                <span className="text-emerald-700">Moyen de Paiement :</span>
                <span className="font-bold text-emerald-950">{orderPaymentMethod === "Ecobank" ? "Ecobank PI-UEMOA QR / Carte" : `${orderPaymentMethod} (Togo)`}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-emerald-900">
                <span>Montant à bloquer :</span>
                <span className="font-extrabold text-emerald-950 text-sm">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Ecobank Payment Card or TMoney Merchant Section */}
            {orderPaymentMethod === "Ecobank" || orderPaymentMethod === "Card" ? (
              <EcobankPaymentCard amount={totalPrice} formatCurrency={formatCurrency} onSuccess={handleConfirmPayment} />
            ) : (
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-4 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono block">Instructions de Paiement {orderPaymentMethod}</span>
                  <p className="text-[11px] text-emerald-950 font-semibold leading-normal">
                    Veuillez scanner le code ci-dessous depuis votre application {orderPaymentMethod} ou composer le code USSD ci-dessous.
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-3 rounded-2xl border border-amber-200 inline-block mx-auto shadow-sm">
                  <img
                    src={tmoneyQrImage}
                    alt="TMoney Merchant QR Code Lgf's Shop"
                    referrerPolicy="no-referrer"
                    className="w-48 h-auto mx-auto object-contain rounded-lg"
                  />
                  <div className="text-[10px] font-mono text-emerald-800 mt-2 font-bold tracking-wider">
                    Numéro Marchand : 1355124 (Lgf's Shop)
                  </div>
                </div>

                {/* USSD Box */}
                <div className="bg-white px-3 py-2 rounded-xl border border-amber-200 flex flex-col items-center justify-center font-mono">
                  <span className="text-[8px] text-amber-600 font-bold uppercase tracking-wider">Dialer Code USSD ({orderPaymentMethod}) :</span>
                  <span className="text-xs font-black text-amber-800 tracking-wider select-all mt-0.5">
                    *145*5*{totalPrice}*1355124#
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 leading-normal">
              🛡️ <b>Fonctionnement du séquestre :</b> En cliquant sur "Confirmer et Payer", vous déclarez avoir envoyé le montant. Les fonds seront conservés en toute sécurité par la LGF jusqu'à ce que vous validiez la réception conforme de votre commande.
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Confirmer et Payer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart FAB */}
      {cart.length > 0 && !isCartDrawerOpen && (
        <button
          id="floating-cart-fab"
          onClick={() => setIsCartDrawerOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 cursor-pointer border border-emerald-500/30"
          title="Afficher mon panier"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2.5 -right-2.5 bg-amber-500 text-emerald-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </button>
      )}

      {/* Product Detail Modal */}
      {selectedModalProduct && (
        <ProductDetailModal
          product={selectedModalProduct}
          products={products}
          onClose={() => setSelectedModalProduct(null)}
          formatCurrency={formatCurrency}
          onAddToCart={(product, qty, size, color) => {
            addToCart(product, qty, size, color);
            setSelectedModalProduct(null);
            setIsCartDrawerOpen(true);
          }}
          onBuyNow={(productId, qty) => {
            setSelectedModalProduct(null);
            setOrderProductId(productId);
            setOrderQty(qty);
            setBuyerTab("order");
          }}
          isInWishlist={wishlist.includes(selectedModalProduct.id)}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {/* Multi-Vendor Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
        onCheckout={handleCartCheckout}
        formatCurrency={formatCurrency}
        products={products}
      />
    </div>
  );
}
