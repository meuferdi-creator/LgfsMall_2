import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { TrendingUp, PieChart as PieIcon, BarChart3, LineChart as LineIcon, DollarSign, Calendar } from "lucide-react";

interface InvestorAnalyticsChartsProps {
  formatCurrency: (val: number) => string;
  isLoading?: boolean;
}

// Sample realistic datasets for LGF Togo Crowdfunding & Investor Portfolio
const portfolioEvolutionData = [
  { month: "Jan 2026", capital: 1000000, value: 1000000, benchmark: 1000000 },
  { month: "Fév 2026", capital: 1500000, value: 1530000, benchmark: 1510000 },
  { month: "Mar 2026", capital: 2200000, value: 2280000, benchmark: 2220000 },
  { month: "Avr 2026", capital: 3500000, value: 3670000, benchmark: 3550000 },
  { month: "Mai 2026", capital: 4500000, value: 4770000, benchmark: 4580000 },
  { month: "Juin 2026", capital: 6000000, value: 6420000, benchmark: 6120000 },
  { month: "Juil 2026", capital: 7500000, value: 8137500, benchmark: 7680000 }
];

const dividendHistoryData = [
  { quarter: "Q1 2025", dividend: 125000, payoutStatus: "Versé" },
  { quarter: "Q2 2025", dividend: 185000, payoutStatus: "Versé" },
  { quarter: "Q3 2025", dividend: 240000, payoutStatus: "Versé" },
  { quarter: "Q4 2025", dividend: 310000, payoutStatus: "Versé" },
  { quarter: "Q1 2026", dividend: 420000, payoutStatus: "Versé" },
  { quarter: "Q2 2026", dividend: 637500, payoutStatus: "En cours" }
];

const monthlyRevenueData = [
  { month: "Jan", grossRevenue: 4500000, netYield: 562500, expenses: 350000 },
  { month: "Fév", grossRevenue: 5800000, netYield: 725000, expenses: 410000 },
  { month: "Mar", grossRevenue: 7200000, netYield: 900000, expenses: 480000 },
  { month: "Avr", grossRevenue: 8900000, netYield: 1112500, expenses: 520000 },
  { month: "Mai", grossRevenue: 10500000, netYield: 1312500, expenses: 600000 },
  { month: "Juin", grossRevenue: 12800000, netYield: 1600000, expenses: 680000 },
  { month: "Juil", grossRevenue: 15000000, netYield: 1875000, expenses: 750000 }
];

const allocationData = [
  { name: "Agriculture & Export (Karité/Cacao)", value: 45, color: "#10b981", amount: 3375000 },
  { name: "Immobilier Séquestre Assigamé", value: 35, color: "#f59e0b", amount: 2625000 },
  { name: "Textiles Wax En Gros", value: 12, color: "#06b6d4", amount: 900000 },
  { name: "Logistique Couriers Lomé", value: 8, color: "#6366f1", amount: 600000 }
];

const performanceComparisonData = [
  { date: "M1", portfolioRoi: 2.1, marketBenchmark: 0.8 },
  { date: "M2", portfolioRoi: 4.3, marketBenchmark: 1.5 },
  { date: "M3", portfolioRoi: 6.8, marketBenchmark: 2.2 },
  { date: "M4", portfolioRoi: 9.2, marketBenchmark: 3.1 },
  { date: "M5", portfolioRoi: 11.5, marketBenchmark: 3.8 },
  { date: "M6", portfolioRoi: 14.2, marketBenchmark: 4.5 }
];

export default function InvestorAnalyticsCharts({
  formatCurrency,
  isLoading = false
}: InvestorAnalyticsChartsProps) {
  const [activeChartTab, setActiveChartTab] = useState<"overview" | "dividends" | "allocation" | "revenue">("overview");

  // Custom Tooltip for currency values
  const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl border border-emerald-500/30 shadow-xl text-xs space-y-1 font-mono backdrop-blur-md">
          <p className="font-bold text-amber-400 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex justify-between gap-4 text-[11px]" style={{ color: entry.color || "#34d399" }}>
              <span>{entry.name} :</span>
              <span className="font-bold">
                {typeof entry.value === "number" && entry.value > 1000
                  ? formatCurrency(entry.value)
                  : `${entry.value}${entry.unit || ""}`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl space-y-6 animate-pulse">
        <div className="h-6 bg-emerald-100 rounded-lg w-1/3"></div>
        <div className="h-64 bg-emerald-50/50 rounded-2xl border border-emerald-100"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
      {/* Header with selector tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100/60 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-emerald-950 font-display">Analytique & Performance du Portefeuille</h3>
          </div>
          <p className="text-xs text-emerald-600">Rendements réels, suivi des dividendes et métriques financières interactives</p>
        </div>

        {/* Chart View Switcher */}
        <div className="bg-emerald-50/80 p-1 rounded-2xl border border-emerald-100 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveChartTab("overview")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeChartTab === "overview" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Évolution Valo</span>
          </button>
          <button
            onClick={() => setActiveChartTab("dividends")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeChartTab === "dividends" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dividendes</span>
          </button>
          <button
            onClick={() => setActiveChartTab("allocation")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeChartTab === "allocation" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Allocation</span>
          </button>
          <button
            onClick={() => setActiveChartTab("revenue")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeChartTab === "revenue" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Revenus Mensuels</span>
          </button>
        </div>
      </div>

      {/* CHART 1: Portfolio Value Evolution */}
      {activeChartTab === "overview" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-900">Évolution de la Valeur du Portefeuille vs Indice Référence (BCEAO)</span>
            <span className="text-emerald-600 font-mono font-bold">+12.5% à 14.5% ROI annuel</span>
          </div>

          <div className="h-72 w-full bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioEvolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip content={<CustomCurrencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area type="monotone" dataKey="value" name="Valeur Totale Portefeuille" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                <Area type="monotone" dataKey="capital" name="Capital Investi" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorCapital)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block font-mono">Gain Net Généré</span>
              <span className="text-base font-extrabold text-emerald-950 font-mono">+637 500 FCFA</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-700 font-bold uppercase block font-mono">Taux de Rendement Moyen</span>
              <span className="text-base font-extrabold text-amber-800 font-mono">13.5% p.a.</span>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-700 font-bold uppercase block font-mono">Outperformance Indice</span>
              <span className="text-base font-extrabold text-sky-900 font-mono">+457 500 FCFA vs BCEAO</span>
            </div>
          </div>
        </div>
      )}

      {/* CHART 2: Dividend History */}
      {activeChartTab === "dividends" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-900">Historique Trimestriel des Distributions de Dividendes</span>
            <span className="text-amber-600 font-mono font-bold">100% Honorés à date</span>
          </div>

          <div className="h-72 w-full bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="quarter" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip content={<CustomCurrencyTooltip />} />
                <Bar dataKey="dividend" name="Dividende Versé (FCFA)" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Portfolio Allocation */}
      {activeChartTab === "allocation" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-900">Répartition du Capital par Secteur d'Activité</span>
            <span className="text-emerald-600 font-mono font-bold">4 Projets Sécurisés</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomCurrencyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {allocationData.map((item) => (
                <div key={item.name} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="font-bold text-emerald-950">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-emerald-950 block">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-emerald-600 font-mono">{item.value}% du portefeuille</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHART 4: Monthly Revenue & Net Yield */}
      {activeChartTab === "revenue" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-900">Volume des Ventes Marchandises vs Rendement Net Séquestre</span>
            <span className="text-emerald-600 font-mono font-bold">Marge Moyenne : 12.5%</span>
          </div>

          <div className="h-72 w-full bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip content={<CustomCurrencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="grossRevenue" name="Chiffre d'Affaires Brut" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="netYield" name="Plus-value Nette Investisseurs" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
