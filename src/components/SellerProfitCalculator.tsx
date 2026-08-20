import React, { useState } from "react";
import { Calculator, DollarSign, TrendingUp, ShieldAlert, Percent, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

interface SellerProfitCalculatorProps {
  formatCurrency: (val: number) => string;
}

export default function SellerProfitCalculator({ formatCurrency }: SellerProfitCalculatorProps) {
  const [purchaseCost, setPurchaseCost] = useState<number>(2500);
  const [sellingPrice, setSellingPrice] = useState<number>(5000);
  const [shippingCost, setShippingCost] = useState<number>(500);
  const [lgfCommissionPct, setLgfCommissionPct] = useState<number>(5.0);
  const [escrowFeePct, setEscrowFeePct] = useState<number>(1.5);
  const [promoCost, setPromoCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Calculations
  const grossProfit = Math.max(0, sellingPrice - purchaseCost);
  const lgfCommissionVal = (sellingPrice * lgfCommissionPct) / 100;
  const escrowFeeVal = (sellingPrice * escrowFeePct) / 100;
  const totalFees = lgfCommissionVal + escrowFeeVal + shippingCost + promoCost;
  const netProfit = sellingPrice - purchaseCost - totalFees - discount;
  const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const breakEvenPrice = purchaseCost + totalFees + discount;

  const isProfitable = netProfit > 0;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-xl space-y-6 text-emerald-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-100/80 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-emerald-950 font-display">Calculateur de Marge & Profit Vendeur</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulez vos bénéfices nets et le seuil de rentabilité avant de publier un nouvel article sur LGF's Mall.
          </p>
        </div>

        <button
          onClick={() => {
            setPurchaseCost(2500);
            setSellingPrice(5000);
            setShippingCost(500);
            setLgfCommissionPct(5.0);
            setEscrowFeePct(1.5);
            setPromoCost(0);
            setDiscount(0);
          }}
          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Réinitialiser</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Inputs */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-extrabold text-emerald-800 uppercase font-mono tracking-wider">
            1. Saisie des Paramètres de Vente (FCFA)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Prix d'Achat Unitaire (FCFA) :</label>
              <input
                type="number"
                min={0}
                value={purchaseCost || ""}
                onChange={(e) => setPurchaseCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Ex: 2500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Prix de Vente Client (FCFA) :</label>
              <input
                type="number"
                min={0}
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Ex: 5000"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Frais de Livraison Estimés (FCFA) :</label>
              <input
                type="number"
                min={0}
                value={shippingCost || ""}
                onChange={(e) => setShippingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Ex: 500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Remise Client Éventuelle (FCFA) :</label>
              <input
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Ex: 0"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Commission LGF's Mall (%) :</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={50}
                value={lgfCommissionPct || ""}
                onChange={(e) => setLgfCommissionPct(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="5.0"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Frais de Séquestre Escrow (%) :</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={20}
                value={escrowFeePct || ""}
                onChange={(e) => setEscrowFeePct(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Budget Publicité / Sponsorisé (Optionnel) :</label>
            <input
              type="number"
              min={0}
              value={promoCost || ""}
              onChange={(e) => setPromoCost(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Ex: 200"
            />
          </div>
        </div>

        {/* Right column: Results & Visual Progress Bar */}
        <div className="lg:col-span-5 bg-gradient-to-b from-emerald-950 to-teal-950 rounded-2xl p-6 text-white space-y-5 flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase font-mono tracking-wider block mb-2">
              2. Résultat de Rentabilité Estimé
            </span>

            {/* Main Net Profit Display */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase text-emerald-300 font-bold block">Bénéfice Net Reçu par Vente :</span>
              <p className={`text-2xl font-black font-mono ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
                {formatCurrency(netProfit)}
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-300">Marge Nette (%) :</span>
                <span className={`font-mono font-bold ${isProfitable ? "text-emerald-300" : "text-rose-300"}`}>
                  {profitMargin.toFixed(1)} %
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Prix de Vente Total :</span>
              <span className="font-mono font-bold text-white">{formatCurrency(sellingPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Coût d'Achat :</span>
              <span className="font-mono font-bold text-white">- {formatCurrency(purchaseCost)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Frais & Commissions Totaux :</span>
              <span className="font-mono font-bold text-amber-300">- {formatCurrency(totalFees)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Remise Accordée :</span>
                <span className="font-mono font-bold text-rose-300">- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-amber-400">
              <span>Prix de Seuil Rentable (Break-Even) :</span>
              <span className="font-mono">{formatCurrency(breakEvenPrice)}</span>
            </div>
          </div>

          {/* Profitability Indicator Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[10px] text-slate-300 font-bold">
              <span>Répartition de l'encaissement</span>
              <span>{isProfitable ? "Opération Rentable" : "Vente à Perte"}</span>
            </div>
            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (purchaseCost / Math.max(1, sellingPrice)) * 100)}%` }}
                className="bg-slate-400 h-full"
                title="Coût d'Achat"
              />
              <div
                style={{ width: `${Math.min(100, (totalFees / Math.max(1, sellingPrice)) * 100)}%` }}
                className="bg-amber-400 h-full"
                title="Frais & Commissions"
              />
              <div
                style={{ width: `${Math.max(0, Math.min(100, (netProfit / Math.max(1, sellingPrice)) * 100))}%` }}
                className="bg-emerald-400 h-full"
                title="Bénéfice Net"
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1">
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block"/> <span>Achat</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> <span>Frais ({formatCurrency(totalFees)})</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/> <span>Profit</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
