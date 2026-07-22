import React, { useState, useEffect } from "react";
import { Truck, MapPin, Wallet, CheckCircle2, AlertCircle, Phone, FileText, Lock, ShieldCheck, Navigation, Clock } from "lucide-react";
import { Order } from "../types";
import { calculateRoute } from "../lib/maps";
import { firestoreSync } from "../lib/firebase";

interface DriverPortalProps {
  user: any;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
}

export default function DriverPortal({ user, formatCurrency, isLoading }: DriverPortalProps) {
  const [dispatchedOrders, setDispatchedOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "my-deliveries" | "earnings">("available");
  const [otps, setOtps] = useState<{ [orderId: string]: string }>({});
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [computedRoutes, setComputedRoutes] = useState<Record<string, any>>({});

  useEffect(() => {
    const calculateAllRoutes = async () => {
      const routesMap: Record<string, any> = {};
      for (const ord of dispatchedOrders) {
        try {
          let originAddr = ord.escrowWallet?.vendor?.address || "Lomé";
          const vendorId = ord.escrowWallet?.vendorId;
          if (vendorId) {
            try {
              const vendorProfile = await firestoreSync.getDocument("vendors", vendorId);
              if (vendorProfile && vendorProfile.location) {
                originAddr = vendorProfile.location;
              }
            } catch (err) {
              console.error("Error loading vendor location:", err);
            }
          }
          const destAddr = ord.buyer?.address || "Lomé Local";
          const res = await calculateRoute(originAddr, destAddr);
          routesMap[ord.id] = res;
        } catch (e) {
          console.error("Failed to compute route for order", ord.id, e);
        }
      }
      setComputedRoutes(routesMap);
    };
    if (dispatchedOrders.length > 0) {
      calculateAllRoutes();
    }
  }, [dispatchedOrders]);

  const fetchDispatched = async () => {
    setLocalLoading(true);
    try {
      const token = localStorage.getItem("lgf_mall_token");
      const res = await fetch("/api/orders/dispatched", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchedOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatched();
  }, []);

  const handleClaim = async (orderId: string) => {
    try {
      const token = localStorage.getItem("lgf_mall_token");
      const res = await fetch(`/api/orders/${orderId}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Livraison acceptée !", type: "success" });
        fetchDispatched();
      } else {
        setMessage({ text: data.error || "Erreur lors de la prise en charge.", type: "error" });
      }
    } catch (e) {
      setMessage({ text: "Erreur réseau.", type: "error" });
    }
  };

  const handleVerifyOtp = async (orderId: string) => {
    const otp = otps[orderId];
    if (!otp || otp.length !== 4) {
      setMessage({ text: "Veuillez entrer un code OTP à 4 chiffres.", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("lgf_mall_token");
      const res = await fetch(`/api/orders/${orderId}/mark-delivered`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Livraison validée !", type: "success" });
        fetchDispatched();
      } else {
        setMessage({ text: data.error || "Code OTP invalide.", type: "error" });
      }
    } catch (e) {
      setMessage({ text: "Erreur réseau.", type: "error" });
    }
  };

  const availableDeliveries = dispatchedOrders.filter((o) => !o.driverId && o.status === "DISPATCHED");
  const myDeliveries = dispatchedOrders.filter((o) => o.driverId === user.id);
  const completedDeliveries = myDeliveries.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED");
  const activeDeliveries = myDeliveries.filter((o) => o.status === "DISPATCHED");

  // Local dispatch fee of Lomé (e.g., 1500 XOF flat fee per delivery)
  const deliveryFee = 1500;
  const totalEarnings = completedDeliveries.length * deliveryFee;

  return (
    <div id="driver-portal" className="space-y-6">
      {/* Driver Header */}
      <div className="bg-emerald-900 rounded-3xl p-6 text-white border border-emerald-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 z-10">
          <span className="px-2.5 py-1 text-[9px] font-extrabold bg-emerald-800 border border-emerald-700 text-yellow-400 rounded-full uppercase tracking-wider font-mono">
            Logistique & Transporteur Agréé LGF
          </span>
          <h2 className="text-xl font-black font-display tracking-tight">
            Espace Livreur • {user.name}
          </h2>
          <p className="text-xs text-emerald-300 leading-normal max-w-lg">
            Livrez des marchandises de manière sécurisée de Grand Marché d'Assigamé, Hedzranawoé, ou Agoè, et validez par code secret Mobile Money client.
          </p>
        </div>
        
        <div className="bg-emerald-800/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-700/50 flex items-center space-x-3 self-start md:self-auto font-mono">
          <div className="w-10 h-10 bg-yellow-400 text-emerald-950 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
            💰
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-emerald-400 block">Mes Gains Réels</span>
            <span className="text-sm font-black text-white block">
              {formatCurrency(totalEarnings)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-sm flex space-x-1">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === "available"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Courses Disponibles ({availableDeliveries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("my-deliveries")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === "my-deliveries"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mes Livraisons ({activeDeliveries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === "earnings"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Historique & Tarifs</span>
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <div className="flex-1 font-medium">{message.text}</div>
          <button onClick={() => setMessage(null)} className="text-emerald-950 font-bold hover:underline cursor-pointer">OK</button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === "available" && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-emerald-950">Courses de Lomé à récupérer</h3>
              <p className="text-xs text-emerald-600">Disponibles immédiatement pour les chauffeurs agréés LGF.</p>
            </div>
            <button 
              onClick={fetchDispatched}
              disabled={localLoading}
              className="text-xs font-extrabold text-emerald-700 hover:underline cursor-pointer disabled:opacity-50"
            >
              🔄 Actualiser
            </button>
          </div>

          {availableDeliveries.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50/20 rounded-2xl border border-dashed border-emerald-100">
              <Truck className="w-10 h-10 text-emerald-300 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-emerald-600">Aucune expédition en attente de chauffeur.</p>
              <p className="text-[10px] text-emerald-500">Les vendeurs d'Assigamé doivent d'abord expédier des commandes séquestrées.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableDeliveries.map((ord) => (
                <div key={ord.id} className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold font-mono uppercase border border-emerald-200">
                        Lomé Locale
                      </span>
                      <span className="text-xs font-bold text-emerald-950 font-mono">Course #{ord.id.slice(0, 8)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[11px] font-medium text-emerald-800">
                      <div>
                        <span className="block text-[9px] text-emerald-500 font-bold uppercase font-mono">Collecte (Boutique) :</span>
                        <span className="font-semibold text-emerald-950">{ord.escrowWallet?.vendor?.name || "Vendeur Agréé"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-emerald-500 font-bold uppercase font-mono">Destination (Client) :</span>
                        <span className="font-semibold text-emerald-950">{ord.buyer?.name || "Client LGF"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-emerald-100/55 pt-3 md:pt-0 md:pl-5">
                    <div className="text-right">
                      <span className="text-[9px] block text-emerald-500 uppercase font-bold font-mono">Tarif Livraison :</span>
                      <span className="text-sm font-black text-emerald-950 font-mono">{formatCurrency(deliveryFee)}</span>
                    </div>
                    <button
                      onClick={() => handleClaim(ord.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-colors cursor-pointer"
                    >
                      Prendre la Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "my-deliveries" && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <h3 className="text-base font-bold text-emerald-950">Mes Courses Actives</h3>

          {activeDeliveries.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50/20 rounded-2xl border border-dashed border-emerald-100">
              <MapPin className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-600">Aucune livraison en cours.</p>
              <p className="text-[10px] text-emerald-500">Allez dans "Courses Disponibles" pour accepter un colis.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeDeliveries.map((ord) => (
                <div key={ord.id} className="p-5 bg-amber-50/20 border border-amber-200/60 rounded-3xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                        EN ROUTE
                      </span>
                      <h4 className="text-sm font-extrabold text-emerald-950 mt-1.5 font-mono">Livraison #{ord.id.slice(0, 8)}</h4>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-emerald-600 block text-[9px] uppercase font-bold">Frais Course :</span>
                      <span className="font-extrabold text-emerald-950">{formatCurrency(deliveryFee)}</span>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-emerald-50 text-xs">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block font-mono">📍 Étape 1 : Collecte en Boutique</span>
                      <p className="font-bold text-emerald-950">{ord.escrowWallet?.vendor?.name || "Vendeur"}</p>
                      <p className="text-emerald-700">Tél: <span className="font-mono">{ord.escrowWallet?.vendor?.phone || "+228 90-XX-XX-XX"}</span></p>
                    </div>

                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-emerald-50 pt-3 md:pt-0 md:pl-4">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block font-mono">🏁 Étape 2 : Livraison au Client</span>
                      <p className="font-bold text-emerald-950">{ord.buyer?.name || "Acheteur"}</p>
                      <p className="text-emerald-700">Tél: <span className="font-mono">{ord.buyer?.phone || "+228 90-XX-XX-XX"}</span></p>
                    </div>
                  </div>

                  {/* Real-time Google Maps Routing / Delivery Assistant */}
                  {computedRoutes[ord.id] && (
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex items-center space-x-2 text-emerald-950">
                          <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span className="font-bold text-xs font-display">Itinéraire & Estimation GPS</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] font-mono font-bold text-emerald-800">
                          <span className="flex items-center space-x-1 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <span>📏</span>
                            <span>{computedRoutes[ord.id].distanceKm} km</span>
                          </span>
                          <span className="flex items-center space-x-1 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{computedRoutes[ord.id].durationMinutes} mins (ETA)</span>
                          </span>
                        </div>
                      </div>

                      {/* Address detail lines */}
                      <div className="text-[10px] text-emerald-800 space-y-1 font-medium bg-white/40 p-2.5 rounded-xl border border-emerald-100/50">
                        <p>🏳️ <b>Origine :</b> {ord.escrowWallet?.vendor?.address || "Lomé Boutique (Marché Assigamé)"}</p>
                        <p>🏁 <b>Destination :</b> {ord.buyer?.address || "Adresse Client"}</p>
                        <p className="text-[8px] font-mono text-emerald-500 mt-1 uppercase tracking-widest font-bold">
                          {computedRoutes[ord.id].isSimulated 
                            ? "📡 MODE SYNCHRONISATION FIRESTORE - COORDONNÉES GPS DU BAC À SABLE"
                            : "🌐 ROUTE SÉCURISÉE PAR GOOGLE MAPS API"
                          }
                        </p>
                      </div>

                      {/* Visual vector route path representation */}
                      <div className="bg-emerald-950 rounded-xl h-24 relative overflow-hidden flex items-center justify-center border border-emerald-900 shadow-inner group">
                        <div className="absolute inset-0 bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:12px_12px] opacity-30"></div>
                        
                        {/* Interactive SVG path line */}
                        <svg className="w-full h-full absolute inset-0" viewBox="0 0 400 100" preserveAspectRatio="none">
                          {/* Route line */}
                          <path
                            d="M 40,50 Q 120,20 200,50 T 360,50"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray="6 4"
                          />
                          
                          {/* Animated driver bike */}
                          <circle r="6" fill="#fbbf24" className="shadow">
                            <animateMotion
                              path="M 40,50 Q 120,20 200,50 T 360,50"
                              dur="6s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </svg>

                        {/* Starting Pin marker */}
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
                          <span className="w-5 h-5 bg-white text-emerald-950 rounded-full flex items-center justify-center text-[10px] font-black border border-emerald-500 shadow-lg font-mono">1</span>
                          <span className="text-[8px] font-bold text-white mt-1 bg-emerald-900/80 px-1 py-0.5 rounded uppercase font-mono">COLLECTE</span>
                        </div>

                        {/* Delivery Destination Pin marker */}
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
                          <span className="w-5 h-5 bg-yellow-400 text-emerald-950 rounded-full flex items-center justify-center text-[10px] font-black border border-yellow-300 shadow-lg font-mono font-bold">2</span>
                          <span className="text-[8px] font-bold text-yellow-300 mt-1 bg-emerald-900/80 px-1 py-0.5 rounded uppercase font-mono">LIVREUR</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OTP validation */}
                  <div className="bg-emerald-950 rounded-2xl p-5 text-white border border-emerald-900 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <h5 className="text-xs font-bold text-white font-display">Clé de Sécurisation Livraison (OTP)</h5>
                    </div>
                    <p className="text-[11px] text-emerald-300 leading-normal font-medium">
                      🔒 <b>Instructions BCEAO :</b> Demandez au client le code de sécurité secret à 4 chiffres (fourni sur son écran de confirmation d'achat) avant de lui remettre son colis.
                    </p>

                    <div className="flex gap-2 max-w-xs">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Code OTP (ex: 4321)"
                        value={otps[ord.id] || ""}
                        onChange={(e) => setOtps({ ...otps, [ord.id]: e.target.value })}
                        className="bg-emerald-900/60 border border-emerald-700 rounded-xl px-4 py-2.5 text-sm font-black tracking-widest text-white text-center w-36 focus:outline-none focus:border-yellow-400 font-mono"
                      />
                      <button
                        onClick={() => handleVerifyOtp(ord.id)}
                        className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-emerald-950 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Valider la Livraison
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <h3 className="text-base font-bold text-emerald-950">Historique des Livraisons & Tarification</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <span className="text-[9px] uppercase font-bold text-emerald-500 block font-mono">Frais Standard Lomé</span>
              <p className="text-lg font-black text-emerald-950 font-mono">1,500 XOF</p>
              <span className="text-[8px] text-emerald-600">Par course validée</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <span className="text-[9px] uppercase font-bold text-emerald-500 block font-mono">Courses Validées</span>
              <p className="text-lg font-black text-emerald-950 font-mono">{completedDeliveries.length}</p>
              <span className="text-[8px] text-emerald-600">Transférées en gains</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <span className="text-[9px] uppercase font-bold text-emerald-500 block font-mono">Couverture Régionale</span>
              <p className="text-lg font-black text-emerald-950 font-mono">100% Togo</p>
              <span className="text-[8px] text-emerald-600">Lomé • Kara • Atakpamé</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 uppercase font-mono tracking-wider">Courses Archivées</h4>
            {completedDeliveries.length === 0 ? (
              <p className="text-xs text-emerald-600 italic">Aucune livraison validée dans l'historique.</p>
            ) : (
              <div className="divide-y divide-emerald-50">
                {completedDeliveries.map((o) => (
                  <div key={o.id} className="py-3 flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-950 block font-mono">Course #{o.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-emerald-500">
                        Destinataire : {o.buyer?.name} • Statut : <span className="font-extrabold text-emerald-600">{o.status}</span>
                      </span>
                    </div>
                    <span className="font-bold text-emerald-950 font-mono">{formatCurrency(deliveryFee)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
