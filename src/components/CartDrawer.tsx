import React, { useState } from "react";
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Truck, 
  Percent, 
  HelpCircle,
  Tag,
  ArrowRight,
  ChevronRight,
  Check
} from "lucide-react";
import { Product } from "../types";

export interface CartItem {
  id: string; // unique cart item compound key
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  onClear: () => void;
  onCheckout: (address: any, promoCode: string, paymentMethod: string) => void;
  formatCurrency: (value: number) => string;
  products: Product[];
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
  formatCurrency,
  products
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0); // discount percent
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState<string | null>(null);

  // Delivery Address states
  const [useGps, setUseGps] = useState(false);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressQuarter, setAddressQuarter] = useState("");
  const [addressCity, setAddressCity] = useState("Lomé");
  const [addressLandmark, setAddressLandmark] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Checkout Step ("cart" | "address" | "payment")
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment">("cart");
  const [paymentMethod, setPaymentMethod] = useState("TMoney");
  const [paymentPhone, setPaymentPhone] = useState("");

  if (!isOpen) return null;

  // Group items by vendor
  const groupedCart: Record<string, CartItem[]> = {};
  cart.forEach((item) => {
    const vendorName = item.product.vendor?.name || "Boutique d'Assigamé";
    if (!groupedCart[vendorName]) {
      groupedCart[vendorName] = [];
    }
    groupedCart[vendorName].push(item);
  });

  // Calculate prices
  let totalProductCost = 0;
  const vendorSubtotals: Record<string, number> = {};

  Object.entries(groupedCart).forEach(([vendor, items]) => {
    let sub = 0;
    items.forEach((item) => {
      // Wholesale validation
      const hasWholesale = item.product.wholesalePrice && item.product.wholesaleMinQty;
      const unitPrice = (hasWholesale && item.quantity >= (item.product.wholesaleMinQty as number))
        ? (item.product.wholesalePrice as number)
        : item.product.price;
      sub += unitPrice * item.quantity;
    });
    vendorSubtotals[vendor] = sub;
    totalProductCost += sub;
  });

  // Promo Code Validation
  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();
    
    if (code === "LGF2026") {
      setPromoDiscount(15); // 15% discount
      setPromoApplied(code);
      setPromoError(null);
    } else if (code === "ASSIGAME") {
      setPromoDiscount(10); // 10% discount
      setPromoApplied(code);
      setPromoError(null);
    } else if (code === "TOGO") {
      setPromoDiscount(5); // 5% discount
      setPromoApplied(code);
      setPromoError(null);
    } else {
      setPromoError("Code promo invalide ou expiré.");
      setPromoDiscount(0);
      setPromoApplied(null);
    }
  };

  // Delivery fee: 1500 FCFA base fee per vendor + 500 per additional vendor
  const baseDeliveryFee = cart.length > 0 ? 1500 : 0;
  const vendorCount = Object.keys(groupedCart).length;
  const deliveryFee = vendorCount > 0 ? baseDeliveryFee + (vendorCount - 1) * 500 : 0;

  // Taxes: 5% (TVA / BCEAO Transaction safety levy)
  const taxFee = Math.round(totalProductCost * 0.05);

  // Discounts
  const discountAmount = Math.round(totalProductCost * (promoDiscount / 100));

  // Grand Total
  const grandTotal = Math.max(0, totalProductCost + deliveryFee + taxFee - discountAmount);

  // GPS Current Location Simulation
  const handleGetGps = () => {
    setIsLocating(true);
    setUseGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setAddressStreet("Coordonnées GPS capturées");
          setAddressQuarter("Ma Position Actuelle");
          setIsLocating(false);
        },
        (error) => {
          console.error("GPS location failed, simulating coordinates:", error);
          // Fallback simulation for Iframe
          setTimeout(() => {
            setGpsCoords({ lat: 6.1319, lng: 1.2231 }); // Lomé coordinates
            setAddressStreet("Boulevard de la Kara (Capturé par GPS)");
            setAddressQuarter("Assigamé Centre");
            setIsLocating(false);
          }, 1500);
        }
      );
    } else {
      setIsLocating(false);
      setUseGps(false);
    }
  };

  const handleFinalCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressObj = {
      gpsCoords,
      street: addressStreet,
      quarter: addressQuarter,
      city: addressCity,
      landmark: addressLandmark,
      notes: addressNotes,
      phone: paymentPhone
    };
    onCheckout(addressObj, promoApplied || "", paymentMethod);
    setCheckoutStep("cart");
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden text-emerald-950"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-emerald-950/75 backdrop-blur-sm transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-left rounded-l-3xl">
          
          {/* Drawer Header */}
          <div className="p-6 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-yellow-500 text-emerald-950 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <h3 id="cart-drawer-title" className="font-extrabold text-sm tracking-tight">Panier Séquestre LGF</h3>
                <span className="text-[10px] text-yellow-500 font-mono font-bold block leading-none">
                  Multi-Vendeurs d'Assigamé
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              aria-label="Fermer le panier"
              className="text-emerald-300 hover:text-white p-2.5 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Header (Checkout Workflow) */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 shrink-0">
            <span className={`${checkoutStep === "cart" ? "text-emerald-600 font-black" : ""}`}>1. MON PANIER</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className={`${checkoutStep === "address" ? "text-emerald-600 font-black" : ""}`}>2. LIVRAISON (GPS)</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className={`${checkoutStep === "payment" ? "text-emerald-600 font-black" : ""}`}>3. FINANCES & PAIEMENT</span>
          </div>

          {/* Drawer Body (Content area) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {checkoutStep === "cart" && (
              <>
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <ShoppingBag className="w-16 h-16 text-emerald-300 mx-auto" />
                    <p className="text-sm font-bold text-emerald-600">Votre panier LGF est actuellement vide.</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Parcourez le catalogue d'Assigamé et ajoutez des textiles, cosmétiques ou alimentation.</p>
                    <button
                      onClick={onClose}
                      className="bg-emerald-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow cursor-pointer"
                    >
                      Continuer les achats
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Items list grouped by vendor */}
                    {Object.entries(groupedCart).map(([vendor, items]) => (
                      <div key={vendor} className="p-4 bg-slate-50 rounded-2xl border border-emerald-100/30 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-xs font-black text-emerald-950 uppercase font-mono flex items-center">
                            🏪 Boutique : {vendor}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                            Sous-total : {formatCurrency(vendorSubtotals[vendor])}
                          </span>
                        </div>

                        <div className="space-y-3.5">
                          {items.map((item) => {
                            const hasWholesale = item.product.wholesalePrice && item.product.wholesaleMinQty;
                            const isWholesaleActive = hasWholesale && item.quantity >= (item.product.wholesaleMinQty as number);
                            const activePrice = isWholesaleActive ? (item.product.wholesalePrice as number) : item.product.price;
                            
                            return (
                              <div key={item.id} className="flex gap-3 items-start">
                                <img 
                                  src={item.product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"} 
                                  alt={item.product.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0" 
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-extrabold text-emerald-950 truncate">{item.product.title}</h4>
                                  <p className="text-[10px] text-slate-500 font-semibold">
                                    Option: {item.size || "Standard"} | {item.color || "Original"}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center space-x-1.5">
                                      <button
                                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                                        className="w-5 h-5 bg-white border border-slate-200 hover:border-emerald-500 rounded flex items-center justify-center font-bold text-xs"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                      <button
                                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                                        className="w-5 h-5 bg-white border border-slate-200 hover:border-emerald-500 rounded flex items-center justify-center font-bold text-xs"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-emerald-950 block">
                                        {formatCurrency(activePrice * item.quantity)}
                                      </span>
                                      {isWholesaleActive && (
                                        <span className="text-[8px] text-amber-600 font-extrabold font-mono uppercase block">Tarif gros</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => onRemove(item.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Promo Code area */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Appliquer un Code Promo :</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: LGF2026, ASSIGAME, TOGO"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs uppercase font-mono text-emerald-950"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                        >
                          Appliquer
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-[10px] text-rose-600 font-semibold">{promoError}</p>
                      )}
                      {promoApplied && (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1" /> Code {promoApplied} activé (-{promoDiscount}%) !
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {checkoutStep === "address" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-emerald-950 font-display">Adresse de Livraison Réelle</h4>
                </div>
                <p className="text-xs text-slate-500">Capturez vos coordonnées GPS ou spécifiez l'itinéraire pour le livreur LGF Couriers.</p>

                {/* GPS Capture Button */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-emerald-950 block">Capturer ma position GPS</span>
                    <span className="text-[10px] text-emerald-600 font-medium block">Intégration d'itinéraire en temps réel</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetGps}
                    disabled={isLocating}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] py-2 px-3.5 rounded-xl cursor-pointer"
                  >
                    {isLocating ? "Localisation..." : "Utiliser GPS"}
                  </button>
                </div>

                {gpsCoords && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-600 font-mono">
                    📍 Coordonnées acquises : Lat {gpsCoords.lat.toFixed(5)} • Lng {gpsCoords.lng.toFixed(5)}
                  </div>
                )}

                {/* Manual Address Form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono mb-1">Quartier :</label>
                    <input
                      type="text"
                      placeholder="Ex: Bè, Agoè, Adidogomé"
                      value={addressQuarter}
                      onChange={(e) => setAddressQuarter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono mb-1">Rue / Itinéraire :</label>
                    <input
                      type="text"
                      placeholder="Ex: Boulevard Circulaire, Face Pharmacie de l'Oasis"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono mb-1">Point de repère (Landmark) :</label>
                    <input
                      type="text"
                      placeholder="Ex: À côté du grand baobab, Église Saint Augustin"
                      value={addressLandmark}
                      onChange={(e) => setAddressLandmark(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono mb-1">Ville :</label>
                    <select
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="Lomé">Lomé (Maritime)</option>
                      <option value="Atakpamé">Atakpamé (Plateaux)</option>
                      <option value="Sokodé">Sokodé (Centrale)</option>
                      <option value="Kara">Kara (Kozah)</option>
                      <option value="Dapaong">Dapaong (Savanes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono mb-1">Notes complémentaires pour le livreur :</label>
                    <textarea
                      placeholder="Ex: Sonner au portail noir, appeler avant d'arriver"
                      value={addressNotes}
                      onChange={(e) => setAddressNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 h-16"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => setCheckoutStep("cart")}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (!addressQuarter || !addressStreet) {
                        alert("Veuillez renseigner le quartier et la rue de livraison.");
                        return;
                      }
                      setCheckoutStep("payment");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Suivant : Paiement
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === "payment" && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-emerald-950 font-display">Moyen de Consignation & Paiement</h4>
                </div>

                {/* Billing Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Total articles :</span>
                    <span className="font-bold">{formatCurrency(totalProductCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Frais de livraison :</span>
                    <span className="font-bold">{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Taxes de sécurité (TVA 5%) :</span>
                    <span className="font-bold">{formatCurrency(taxFee)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Remise code ({promoApplied}) :</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-emerald-950">
                    <span>Total Général :</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Option Buttons */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Sélectionnez votre mode de consignation :</label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {["TMoney", "Flooz", "Moov", "Card", "COD"].map((method) => {
                      let label = method;
                      if (method === "TMoney") label = "TMoney (Togo)";
                      if (method === "Flooz" || method === "Moov") label = "Flooz / Moov";
                      if (method === "Card") label = "Carte Bancaire";
                      if (method === "COD") label = "Cash on Delivery";

                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                            paymentMethod === method
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm font-extrabold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-bold"
                          }`}
                        >
                          <span className="text-xs block">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === "COD" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 leading-relaxed font-semibold">
                      ℹ️ <b>Cash on Delivery :</b> Only available through official LGF Couriers. Your order will be shipped securely, and payment is collected at the door.
                    </div>
                  )}

                  {paymentMethod !== "COD" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-700 uppercase block font-mono">Numéro Mobile Money (+228) :</label>
                      <input
                        type="text"
                        placeholder="Ex: 90 12 34 56"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 font-mono"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <form onSubmit={handleFinalCheckoutSubmit} className="pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("address")}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center flex items-center justify-center space-x-1.5"
                    >
                      <span>Consigner {formatCurrency(grandTotal)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Drawer Footer summary */}
          {checkoutStep === "cart" && cart.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Articles ({cart.length}) :</span>
                  <span className="font-extrabold">{formatCurrency(totalProductCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Livraison estimée :</span>
                  <span className="font-extrabold">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-emerald-950">
                  <span>Total :</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutStep("address")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-xs tracking-wide transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Procéder à la Livraison</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
