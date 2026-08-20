import React, { useState } from "react";
import { 
  TrendingUp, 
  Plus, 
  FileText, 
  AlertCircle, 
  Calendar, 
  Building, 
  Sprout, 
  ArrowUpRight, 
  Percent, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Wallet 
} from "lucide-react";
import { Investment } from "../types";
import InvestorAnalyticsCharts from "./InvestorAnalyticsCharts";
import { useTranslation } from "../hooks/useTranslation";

interface InvestorPortalProps {
  investments: Investment[];
  createInvestment: (amount: number) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
}

export default function InvestorPortal({
  investments,
  createInvestment,
  fetchStats,
  formatCurrency,
  isLoading
}: InvestorPortalProps) {
  const { t } = useTranslation();
  const [investorTab, setInvestorTab] = useState<"portfolio" | "projects" | "fund" | "ledger">("portfolio");
  const [investAmount, setInvestAmount] = useState("750000");
  const [investCampaign, setInvestCampaign] = useState("agriculture");

  const simulatedAmount = parseFloat(investAmount) || 0;
  // Agriculture has 12.5% ROI, Real Estate has 14.5% ROI
  const activeRoiPercent = investCampaign === "agriculture" ? 12.5 : investCampaign === "realestate" ? 14.5 : 12.5;
  const simulatedRoi = simulatedAmount * (activeRoiPercent / 100);
  const simulatedTotal = simulatedAmount + simulatedRoi;

  const crowdfundingProjects = [
    {
      id: "agriculture",
      title: "Coopérative Kloto Bio (Karité & Cacao)",
      category: "Agriculture & Exportation",
      icon: Sprout,
      color: "emerald",
      roi: "12.5% p.a.",
      roiRaw: 12.5,
      duration: "6 mois",
      target: 15000000,
      raised: 11250000,
      description: "Financement des équipements de pressage à froid de beurre de karité bio pour l'exportation équitable vers l'Europe.",
      risk: "Faible - Garanti par stock de matières premières en séquestre physique à Lomé.",
      location: "Kpalimé, Togo",
    },
    {
      id: "realestate",
      title: "Entrepôts Séquestres Assigamé",
      category: "Immobilier Commercial & Logistique",
      icon: Building,
      color: "amber",
      roi: "14.5% p.a.",
      roiRaw: 14.5,
      duration: "12 mois",
      target: 25000000,
      raised: 10000000,
      description: "Construction de l'extension de la zone d'entreposage sécurisée pour les stocks de pagnes Wax de grossistes d'Assigamé.",
      risk: "Très Faible - Garanti par hypothèque de premier rang sur le bien immobilier.",
      location: "Lomé, Port Autonome",
    }
  ];

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(investAmount);
    if (isNaN(amt) || amt < 50000) {
      alert("Le montant minimum d'investissement est de 50 000 FCFA.");
      return;
    }
    const ok = await createInvestment(amt);
    if (ok) {
      setInvestorTab("portfolio");
    }
  };

  const handleQuickInvest = (campaignId: string) => {
    setInvestCampaign(campaignId);
    setInvestAmount(campaignId === "agriculture" ? "1000000" : "1500000");
    setInvestorTab("fund");
  };

  // Helper to generate dynamic distribution dates based on real investment dates
  const getYieldCalendar = () => {
    const calendarItems = [];

    // Add real investments as calendar items
    investments.forEach((inv, index) => {
      const date = new Date(inv.createdAt);
      // Payout is 6 months later for agriculture (default) or 12 for real estate
      const monthsToAdd = 6;
      date.setMonth(date.getMonth() + monthsToAdd);

      calendarItems.push({
        id: `real-${inv.id}`,
        project: "Financement de Stock Séquestre (Votre Contrat)",
        type: "Personnel",
        amount: inv.amount,
        roi: inv.roi,
        yieldAmount: inv.amount * (inv.roi / 100),
        payoutDate: date,
        status: inv.status === "ACTIVE" ? "En attente de maturation" : "Distribué",
      });
    });

    // Add standard upcoming platform yield distributions for realism
    const now = new Date();
    const dateAgri = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days later
    const dateReal = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days later

    calendarItems.push({
      id: "mock-agri",
      project: "Coopérative Kloto Bio (Échéance Tranche A)",
      type: "Campagne Globale",
      amount: 15000000,
      roi: 12.5,
      yieldAmount: 1875000,
      payoutDate: dateAgri,
      status: "Validé (Prochain versement)",
    });

    calendarItems.push({
      id: "mock-real",
      project: "Entrepôts Assigamé (Versement Intérêts Q1)",
      type: "Campagne Globale",
      amount: 25000000,
      roi: 14.5,
      yieldAmount: 3625000,
      payoutDate: dateReal,
      status: "En attente de rapports d'étapes",
    });

    // Sort by date ascending
    return calendarItems.sort((a, b) => a.payoutDate.getTime() - b.payoutDate.getTime());
  };

  const calendar = getYieldCalendar();

  return (
    <div id="investor-portal" className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm flex flex-wrap gap-1">
        <button
          id="tab-investor-portfolio"
          onClick={() => setInvestorTab("portfolio")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            investorTab === "portfolio"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t.investorPortal}</span>
        </button>

        <button
          id="tab-investor-projects"
          onClick={() => setInvestorTab("projects")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            investorTab === "projects"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Projets Crowdfunding</span>
        </button>

        <button
          id="tab-investor-fund"
          onClick={() => setInvestorTab("fund")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            investorTab === "fund"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Calculateur & Prêt</span>
        </button>

        <button
          id="tab-investor-ledger"
          onClick={() => setInvestorTab("ledger")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            investorTab === "ledger"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Contrats Signés ({investments.length})</span>
        </button>
      </div>

      {/* PORTFOLIO TAB */}
      {investorTab === "portfolio" && (
        <div id="portfolio-tab" className="space-y-6">
          {/* Key Metrics cards */}
          <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950 font-display">Mes Financements Sécurisés</h3>
                <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block font-mono">
                  Rendements garantis par séquestre et stocks physiques • LGF Togo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block font-mono">Total Capital Actif</span>
                <p className="text-2xl font-extrabold text-emerald-950 font-display font-mono">
                  {formatCurrency(investments.reduce((sum, inv) => sum + inv.amount, 0))}
                </p>
                <span className="text-[9px] text-emerald-700 font-medium block">
                  Fonds alloués à l'achat de stocks vérifiés d'Assigamé
                </span>
              </div>

              <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-700 block font-mono">Intérêts Accumulés (12.5% - 14.5%)</span>
                <p className="text-2xl font-extrabold text-amber-600 font-display font-mono">
                  {formatCurrency(investments.reduce((sum, inv) => sum + inv.amount * (inv.roi / 100), 0))}
                </p>
                <span className="text-[9px] text-amber-700 font-medium block">
                  Plus-values contractuelles calculées
                </span>
              </div>

              <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-700 block font-mono">Prochaine Distribution</span>
                <p className="text-xl font-extrabold text-blue-950 font-display font-mono">
                  {calendar.length > 0 ? calendar[0].payoutDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "Aucune"}
                </p>
                <span className="text-[9px] text-blue-700 font-medium block">
                  Échéance du versement le plus proche
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-xs text-emerald-800 leading-relaxed flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>
                Toutes les opérations d'investissement sont sécurisées par un compte séquestre de réserve au Togo. Les bénéfices proviennent des marges sur l'achat et la revente en gros de stocks de textile (Wax) et de matières premières agricoles.
              </p>
            </div>
          </div>

          {/* Recharts Analytics Charts Section */}
          <InvestorAnalyticsCharts formatCurrency={formatCurrency} isLoading={isLoading} />

          {/* YIELD DISTRIBUTION CALENDAR SECTION */}
          <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950 font-display">Calendrier de Distribution des Rendements</h3>
                <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block font-mono">
                  Dates d'échéances des versements d'intérêts et capitaux
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-emerald-100 text-[10px] uppercase text-emerald-600 font-mono font-extrabold">
                    <th className="py-3 px-4">Date de Versement</th>
                    <th className="py-3 px-4">Projet / Contrat</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Capital Associé</th>
                    <th className="py-3 px-4 text-right">Rendement Attendu</th>
                    <th className="py-3 px-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50 text-xs">
                  {calendar.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-all">
                      <td className="py-4 px-4 font-mono font-semibold text-emerald-950 flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {item.payoutDate.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-emerald-950">{item.project}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          item.type === "Personnel" 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}>
                          {item.type || "Personnel"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-medium text-emerald-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-amber-600">
                        +{formatCurrency(item.yieldAmount)} <span className="text-[10px] text-emerald-500 font-semibold">({item.roi}%)</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                          item.status.includes("Validé") || item.status === "Distribué"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CROWDFUNDING PROJECTS TAB */}
      {investorTab === "projects" && (
        <div id="projects-tab" className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-display flex items-center">
                <Sprout className="w-5 h-5 mr-2 text-emerald-600" />
                Projets Participatifs Lomé LGF
              </h3>
              <p className="text-xs text-emerald-600">
                Financer des stocks de marchandises réelles à forte rotation commerciale pour obtenir un rendement contractuel fixe garanti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {crowdfundingProjects.map((proj) => {
                const IconComp = proj.icon;
                const percentFunded = Math.round((proj.raised / proj.target) * 100);

                return (
                  <div key={proj.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                    {/* Header bar of the project card */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            proj.color === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          }`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold font-mono text-emerald-600 uppercase block">{proj.category}</span>
                            <h4 className="text-sm font-extrabold text-emerald-950">{proj.title}</h4>
                          </div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-black font-mono px-2.5 py-1 rounded-lg border border-emerald-200">
                          {proj.roi}
                        </span>
                      </div>

                      <p className="text-xs text-emerald-800 leading-relaxed">
                        {proj.description}
                      </p>

                      {/* Funding Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-emerald-600">Objectif: {formatCurrency(proj.target)}</span>
                          <span className="text-emerald-950">{percentFunded}% Financé</span>
                        </div>
                        <div className="w-full bg-emerald-50 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${proj.color === "emerald" ? "bg-emerald-600" : "bg-amber-500"}`} 
                            style={{ width: `${percentFunded}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] text-emerald-500 block">
                          Fonds déjà collectés : {formatCurrency(proj.raised)}
                        </span>
                      </div>

                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-emerald-50/40 p-3 rounded-xl border border-emerald-50">
                        <div>
                          <span className="text-emerald-600 font-semibold block">Période de blocage :</span>
                          <span className="font-bold text-emerald-950 font-mono">{proj.duration}</span>
                        </div>
                        <div>
                          <span className="text-emerald-600 font-semibold block">Garantie associée :</span>
                          <span className="font-bold text-emerald-950">{proj.risk.split("-")[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-emerald-50/50 border-t border-emerald-50 flex items-center justify-between gap-3">
                      <div className="text-[10px]">
                        <span className="text-emerald-500 block">Emplacement</span>
                        <strong className="text-emerald-950 font-semibold">{proj.location}</strong>
                      </div>

                      <button
                        onClick={() => handleQuickInvest(proj.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>Investir maintenant</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR & FUNDING FORM TAB */}
      {investorTab === "fund" && (
        <div id="fund-tab" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 font-display">Initier un Financement participatif</h3>
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider block font-mono">
                Soutenir l'entreprenariat togolais avec garantie séquestre réglementaire
              </span>
            </div>
          </div>

          <form onSubmit={handleFundSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Sélectionner un projet :</label>
                <select
                  value={investCampaign}
                  onChange={(e) => setInvestCampaign(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none cursor-pointer"
                >
                  <option value="agriculture">Kloto Bio - Karité & Cacao d'exportation (+12.5% ROI • 6 mois)</option>
                  <option value="realestate">Assigamé entrepôt - Construction d'extension (+14.5% ROI • 12 mois)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Capital à prêter (FCFA) :</label>
                <input
                  type="number"
                  min="50000"
                  step="25000"
                  required
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Simulated Return display */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/60 space-y-3">
              <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Indicateurs ROI & Plus-values attendus :</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[9px] text-emerald-500 block">Capital de départ</span>
                  <span className="font-extrabold text-emerald-950 font-mono">{formatCurrency(simulatedAmount)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[9px] text-amber-600 block">Gains (+{activeRoiPercent}%)</span>
                  <span className="font-extrabold text-amber-600 font-mono">+{formatCurrency(simulatedRoi)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[9px] text-emerald-500 block">Somme remboursée</span>
                  <span className="font-black text-emerald-950 font-mono">{formatCurrency(simulatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-900 leading-normal flex items-start space-x-2">
              <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Contrat légal signé électroniquement</strong>
                <p className="text-[11px] pt-0.5">
                  En investissant, vous acceptez les termes du contrat séquestre de réserve de Lomé. Votre capital est couvert à 100% par des garanties physiques de marchandises ou hypothèques immobilières.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4 text-emerald-200" />
              <span>Signer l'acte de financement et allouer les fonds</span>
            </button>
          </form>
        </div>
      )}

      {/* INVESTMENT LEDGER TAB */}
      {investorTab === "ledger" && (
        <div id="ledger-tab" className="bg-white rounded-3xl p-8 border border-emerald-100/50 shadow-xl text-emerald-950 space-y-6">
          <h3 className="text-lg font-bold text-emerald-950 font-display flex items-center">
            <FileText className="w-5 h-5 mr-2 text-emerald-600" />
            Grand Livre des Engagements de Financement Actifs
          </h3>

          {investments.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-100">
              <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-600">Aucun engagement enregistré.</p>
              <button 
                onClick={() => setInvestorTab("fund")}
                className="mt-3 text-xs bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                Soutenir un projet maintenant
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((inv) => {
                const date = new Date(inv.createdAt);
                const matureDate = new Date(date);
                matureDate.setMonth(matureDate.getMonth() + 6); // standard 6 months maturity

                return (
                  <div key={inv.id} className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[9px] text-emerald-500 font-bold block uppercase font-mono">
                          Numéro Contrat #{inv.id.toUpperCase().slice(0, 10)}
                        </span>
                        <p className="text-xs font-bold text-emerald-950 pt-0.5">Financement Participatif Certifié LGF</p>
                        <span className="text-[10px] text-emerald-600 block">
                          Date du contrat : {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase border bg-emerald-100 text-emerald-800 border-emerald-200">
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-emerald-100/50 bg-white p-4 rounded-xl border border-emerald-100">
                      <div>
                        <span className="text-emerald-500 text-[9px] block uppercase font-mono font-bold">Capital Alloué :</span>
                        <span className="font-extrabold text-emerald-950 text-sm font-mono">{formatCurrency(inv.amount)}</span>
                      </div>
                      <div>
                        <span className="text-emerald-500 text-[9px] block uppercase font-mono font-bold">Rendement attendu ({inv.roi}%) :</span>
                        <span className="font-bold text-emerald-600 text-sm font-mono">+{formatCurrency(inv.amount * (inv.roi / 100))}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-emerald-600 pt-1">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Date d'échéance estimée : {matureDate.toLocaleDateString("fr-FR")}
                      </span>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Téléchargement du reçu de certificat légal visé séquestre LGF.");
                        }}
                        className="text-emerald-700 underline font-bold hover:text-emerald-900"
                      >
                        Télécharger le Certificat de Dépôt Actif (PDF)
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
