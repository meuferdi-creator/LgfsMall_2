import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart
} from "recharts";
import { Order } from "../types";
import { TrendingUp, ShoppingCart, DollarSign, Calendar, BarChart2 } from "lucide-react";

interface BuyerOrderVolumeChartProps {
  orders: Order[];
  formatCurrency: (amount: number) => string;
}

export default function BuyerOrderVolumeChart({
  orders,
  formatCurrency
}: BuyerOrderVolumeChartProps) {
  const [chartMode, setChartMode] = useState<"volume" | "spending" | "both">("both");

  // Calculate 30-day timeline data
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { [dateStr: string]: { date: string; displayDate: string; ordersCount: number; totalSpent: number } } = {};

    // Initialize 30 days buckets
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      days[isoDate] = {
        date: isoDate,
        displayDate,
        ordersCount: 0,
        totalSpent: 0
      };
    }

    // Populate with buyer orders
    orders.forEach((ord) => {
      if (!ord.createdAt) return;
      const orderDate = new Date(ord.createdAt);
      const isoDate = orderDate.toISOString().split("T")[0];
      if (days[isoDate]) {
        days[isoDate].ordersCount += 1;
        days[isoDate].totalSpent += ord.total || 0;
      }
    });

    return Object.values(days);
  }, [orders]);

  // Key KPI metrics for the 30-day period
  const stats = useMemo(() => {
    const total30dOrders = chartData.reduce((sum, d) => sum + d.ordersCount, 0);
    const total30dSpent = chartData.reduce((sum, d) => sum + d.totalSpent, 0);
    const averageOrderValue = total30dOrders > 0 ? Math.round(total30dSpent / total30dOrders) : 0;
    
    // Find peak activity day
    let peakDay = chartData[0];
    chartData.forEach((d) => {
      if (d.ordersCount > (peakDay?.ordersCount || 0)) {
        peakDay = d;
      }
    });

    return {
      total30dOrders,
      total30dSpent,
      averageOrderValue,
      peakDate: peakDay?.ordersCount > 0 ? peakDay.displayDate : "N/A",
      peakCount: peakDay?.ordersCount || 0
    };
  }, [chartData]);

  // Custom tooltip for crisp dark/light styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/30 text-xs backdrop-blur-md space-y-1.5 min-w-[160px]">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[10px] uppercase font-bold border-b border-slate-700/60 pb-1">
            <Calendar className="w-3 h-3" />
            <span>{dataPoint.displayDate} ({dataPoint.date})</span>
          </div>
          <div className="flex justify-between items-center text-slate-200">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Commandes :</span>
            </span>
            <span className="font-extrabold text-white font-mono">{dataPoint.ordersCount}</span>
          </div>
          <div className="flex justify-between items-center text-slate-200">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Montant :</span>
            </span>
            <span className="font-extrabold text-amber-300 font-mono">{formatCurrency(dataPoint.totalSpent)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950/5 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/20 rounded-3xl p-6 sm:p-7 border border-emerald-100 dark:border-emerald-800/60 shadow-lg space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-emerald-950 dark:text-white font-display">
                Volume d'Achats & Fréquence (30 Jours)
              </h3>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
                Visualisation de vos commandes et dépenses récentes sur LGF's Mall
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center bg-emerald-100/60 dark:bg-emerald-900/50 p-1 rounded-xl border border-emerald-200/50 dark:border-emerald-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setChartMode("both")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartMode === "both"
                ? "bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm"
                : "text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
            }`}
          >
            Vue Combinée
          </button>
          <button
            type="button"
            onClick={() => setChartMode("volume")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartMode === "volume"
                ? "bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm"
                : "text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
            }`}
          >
            Volume (Nb)
          </button>
          <button
            type="button"
            onClick={() => setChartMode("spending")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              chartMode === "spending"
                ? "bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm"
                : "text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
            }`}
          >
            Dépenses (FCFA)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Commandes 30j</span>
            <ShoppingCart className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-emerald-950 dark:text-white font-mono">
            {stats.total30dOrders}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {stats.total30dOrders > 0 ? "Activité enregistrée" : "Aucun achat récent"}
          </span>
        </div>

        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Dépenses 30j</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-300 font-mono truncate">
            {formatCurrency(stats.total30dSpent)}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            Paiements sécurisés Escrow
          </span>
        </div>

        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Panier Moyen</span>
            <BarChart2 className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-emerald-950 dark:text-white font-mono truncate">
            {formatCurrency(stats.averageOrderValue)}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            Moyenne par panier
          </span>
        </div>

        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Pic d'Activité</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-emerald-950 dark:text-white font-mono truncate">
            {stats.peakDate}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {stats.peakCount > 0 ? `${stats.peakCount} commande(s) ce jour` : "Pas de pic"}
          </span>
        </div>
      </div>

      {/* Recharts Interactive Line / Area Chart */}
      <div className="bg-white dark:bg-emerald-950/60 p-4 sm:p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-inner">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orderVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#10b98120" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 10, fill: "#059669" }}
                axisLine={{ stroke: "#10b98140" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "#059669" }}
                axisLine={{ stroke: "#10b98140" }}
                tickLine={false}
                allowDecimals={false}
              />
              {chartMode === "both" && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#d97706" }}
                  axisLine={{ stroke: "#f59e0b40" }}
                  tickLine={false}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: "11px", fontWeight: "bold", paddingBottom: "8px" }}
              />
              {(chartMode === "volume" || chartMode === "both") && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="ordersCount"
                  name="Nombre de Commandes"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#orderVolumeGrad)"
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}
              {(chartMode === "spending" || chartMode === "both") && (
                <Area
                  yAxisId={chartMode === "both" ? "right" : "left"}
                  type="monotone"
                  dataKey="totalSpent"
                  name="Dépenses (FCFA)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray={chartMode === "both" ? "4 4" : undefined}
                  fillOpacity={1}
                  fill="url(#spendingGrad)"
                  dot={{ r: 3, fill: "#f59e0b", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 6, fill: "#f59e0b", stroke: "#ffffff", strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
