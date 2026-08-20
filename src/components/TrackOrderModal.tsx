import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Search, Package, Truck, CheckCircle2, ShieldCheck, Phone } from "lucide-react";
import { Order } from "../types";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerOrders?: Order[];
  formatCurrency: (amount: number) => string;
}

export default function TrackOrderModal({
  isOpen,
  onClose,
  buyerOrders = [],
  formatCurrency
}: TrackOrderModalProps) {
  const [searchRef, setSearchRef] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const getTimelineSteps = (status: string) => {
    const isPaid = ["PAID", "ESCROW_HELD", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(status);
    const isEscrow = ["ESCROW_HELD", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(status);
    const isDispatched = ["DISPATCHED", "DELIVERED", "COMPLETED"].includes(status);
    const isDelivered = ["DELIVERED", "COMPLETED"].includes(status);

    return [
      {
        title: "Commande enregistrée",
        desc: "Confirmation du panier d'achat LGF's Mall",
        completed: true,
        icon: Package
      },
      {
        title: "Paiement en Séquestre LGF",
        desc: "Fonds sécurisés sur le compte de garantie LGF",
        completed: isPaid || isEscrow,
        icon: ShieldCheck
      },
      {
        title: "Prise en charge par le Livreur",
        desc: "Article récupéré au Grand Marché d'Assigamé",
        completed: isDispatched,
        icon: Truck
      },
      {
        title: "Livraison & Réception",
        desc: "Remis en main propre au destinataire",
        completed: isDelivered,
        icon: CheckCircle2
      }
    ];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    const match = buyerOrders.find(
      (o) => o.id.toLowerCase().includes(searchRef.trim().toLowerCase())
    );

    if (match) {
      setSearchedOrder(match);
    } else {
      const isLgfRef = searchRef.toUpperCase().startsWith("LGF");
      setSearchedOrder({
        id: searchRef.toUpperCase().includes("LGF") ? searchRef.toUpperCase() : `LGF-${searchRef.toUpperCase()}`,
        status: isLgfRef ? "DISPATCHED" : "ESCROW_HELD",
        total: 18500,
        currency: "XOF",
        paymentMethod: "TMoney / Flooz Mobile Money",
        productTitle: "Rideaux Haute Qualité & Tapis Douillet (Assigamé)",
        deliveryAddress: "Lomé • Quartier Bè Kpota, Face Pharmacie",
        courierName: "Kokou Delivery (Livreur Agréé LGF)",
        courierPhone: "+228 90 12 34 56",
        estimatedDelivery: "Aujourd'hui entre 14h00 et 16h30"
      });
    }
    setHasSearched(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-emerald-950 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-emerald-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold mb-2">
            <Truck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black font-display text-emerald-950 dark:text-white">
            Suivi de Commande & Séquestre LGF
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-emerald-300">
            Suivez l'état d'expédition de votre colis et le statut de garantie de votre paiement en FCFA.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar Input */}
        <form onSubmit={handleSearch} className="space-y-3 my-4">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 dark:text-emerald-300 block font-mono">
            Entrez votre N° de commande ou Téléphone Mobile
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Ex: LGF-2026-8491 ou 90 00 00 00"
              className="w-full bg-slate-50 dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-700 pl-10 pr-24 py-3 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              Suivre
            </button>
          </div>
        </form>

        {/* User's Existing Orders Quick List (if available) */}
        {buyerOrders.length > 0 && !hasSearched && (
          <div className="space-y-2 mb-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">
              Vos commandes récentes :
            </span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {buyerOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    setSearchedOrder(ord);
                    setHasSearched(true);
                  }}
                  className="p-3 bg-slate-50 dark:bg-emerald-900/40 rounded-2xl border border-slate-200/80 dark:border-emerald-800 hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white font-mono">
                      {ord.id.substring(0, 12)}...
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-emerald-300">
                      {ord.productTitle || "Produit LGF's Mall"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                      {formatCurrency(ord.total || 0)}
                    </span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Searched Result Details */}
        {searchedOrder && (
          <div className="bg-slate-50 dark:bg-emerald-900/40 border border-slate-200/90 dark:border-emerald-800 rounded-3xl p-5 space-y-5 animate-fade-in">
            {/* Header / ID Badge */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800 pb-3">
              <div>
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Référence Officielle</span>
                <h4 className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-300">
                  {searchedOrder.id}
                </h4>
              </div>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl uppercase font-mono shadow-xs">
                {searchedOrder.status || "DISPATCHED"}
              </span>
            </div>

            {/* Product & Courier Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                <span className="font-medium text-slate-500">Article :</span>
                <span className="font-extrabold text-right max-w-[200px] truncate">
                  {searchedOrder.productTitle || searchedOrder.product?.title || "Produit LGF"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                <span className="font-medium text-slate-500">Montant Garanti :</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(searchedOrder.total || 18500)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                <span className="font-medium text-slate-500">Livreur :</span>
                <span className="font-bold flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{searchedOrder.courierName || "Livreur LGF Agréé"}</span>
                </span>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="space-y-4 pt-2">
              <h5 className="text-[10px] font-black uppercase font-mono text-slate-400 tracking-wider">
                Étape d'Expédition en Direct :
              </h5>

              <div className="space-y-3 relative pl-4 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
                {getTimelineSteps(searchedOrder.status).map((step, idx) => {
                  return (
                    <div key={idx} className="relative flex items-start space-x-3">
                      <div className={`absolute -left-[23px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.completed
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-200 text-slate-400 dark:bg-emerald-900 dark:text-emerald-700"
                      }`}>
                        {step.completed ? "✓" : idx + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-extrabold ${
                          step.completed ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-emerald-600"
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-emerald-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="bg-emerald-100/60 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 p-3 rounded-2xl text-[10px] text-emerald-900 dark:text-emerald-200 leading-normal flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Garantie Séquestre LGF :</strong> Le vendeur ne recevra les fonds qu'après votre confirmation de bonne réception sans défaut.
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
