import React, { useState } from "react";
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search, 
  User, 
  Store, 
  Truck, 
  TrendingUp, 
  Eye, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Shield, 
  BadgeCheck,
  AlertTriangle,
  Zap,
  Sparkles,
  Flame,
  Tag,
  Clock,
  Plus,
  Edit,
  Trash2,
  Check
} from "lucide-react";
import { User as UserType, Kyc, UserRole, InvestmentProject, Product } from "../types";
import AdminInvestmentProjects from "./AdminInvestmentProjects";

interface AdminPortalProps {
  allUsers: UserType[];
  pendingKycs: Kyc[];
  verifyKyc: (kycId: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) => Promise<boolean>;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
  rejectionReasons: Record<string, string>;
  setRejectionReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  investmentProjects?: InvestmentProject[];
  createInvestmentProject?: (data: Partial<InvestmentProject>) => Promise<boolean>;
  updateInvestmentProject?: (id: string, data: Partial<InvestmentProject>) => Promise<boolean>;
  deleteInvestmentProject?: (id: string) => Promise<boolean>;
  fetchInvestmentProjects?: (status?: string, search?: string) => Promise<void>;
  allProducts?: Product[];
  fetchProducts?: () => Promise<void>;
}

export default function AdminPortal({
  allUsers,
  pendingKycs,
  verifyKyc,
  formatCurrency,
  isLoading,
  rejectionReasons,
  setRejectionReasons,
  investmentProjects = [],
  createInvestmentProject = async () => false,
  updateInvestmentProject = async () => false,
  deleteInvestmentProject = async () => false,
  fetchInvestmentProjects = async () => {},
  allProducts = [],
  fetchProducts = async () => {}
}: AdminPortalProps) {
  const [adminTab, setAdminTab] = useState<"users" | "kyc" | "projects" | "marketing">("users");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserType | null>(null);

  // Marketing (Flash Deals & Featured) state
  const [marketingSubTab, setMarketingSubTab] = useState<"flash" | "featured">("flash");
  const [productSearch, setProductSearch] = useState("");
  const [selectedFlashProduct, setSelectedFlashProduct] = useState<Product | null>(null);
  const [flashPriceInput, setFlashPriceInput] = useState("");
  const [flashHoursInput, setFlashHoursInput] = useState("24");
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const flashProducts = allProducts.filter(p => p.isFlashDeal);
  const featuredProducts = allProducts.filter(p => p.isFeatured);

  const handleToggleFlashDeal = async (product: Product, enable: boolean) => {
    setIsUpdatingProduct(true);
    setActionSuccessMsg("");
    try {
      const token = localStorage.getItem("lgf_auth_token");
      let body: any = { isFlashDeal: enable };
      
      if (enable) {
        const customPrice = flashPriceInput ? parseFloat(flashPriceInput) : Math.round(product.price * 0.85); // 15% off default
        const hours = parseInt(flashHoursInput) || 24;
        const endTime = new Date(Date.now() + hours * 3600 * 1000).toISOString();
        body.flashPrice = customPrice;
        body.flashEndTime = endTime;
      }

      const res = await fetch(`/api/admin/products/${product.id}/flash-deal`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccessMsg(data.message || "Vente flash mise à jour !");
        setSelectedFlashProduct(null);
        setFlashPriceInput("");
        await fetchProducts();
        setTimeout(() => setActionSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Erreur lors de la mise à jour de la vente flash.");
      }
    } catch (err: any) {
      alert("Impossible de modifier la vente flash: " + err.message);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    setIsUpdatingProduct(true);
    setActionSuccessMsg("");
    try {
      const token = localStorage.getItem("lgf_auth_token");
      const nextState = !product.isFeatured;

      const res = await fetch(`/api/admin/products/${product.id}/featured`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: nextState })
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccessMsg(data.message || "Statut en vedette mis à jour !");
        await fetchProducts();
        setTimeout(() => setActionSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Erreur lors de la mise à jour.");
      }
    } catch (err: any) {
      alert("Impossible de modifier le statut vedette: " + err.message);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    const matchesRole = selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) || 
      (u.phone && u.phone.includes(q)) ||
      u.id.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  // Calculate statistics
  const buyersCount = allUsers.filter(u => u.role === "BUYER").length;
  const vendorsCount = allUsers.filter(u => u.role === "VENDOR").length;
  const driversCount = allUsers.filter(u => u.role === "DRIVER").length;
  const investorsCount = allUsers.filter(u => u.role === "INVESTOR").length;
  const adminsCount = allUsers.filter(u => u.role === "ADMIN").length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "BUYER":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">Acheteur</span>;
      case "VENDOR":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">Vendeur</span>;
      case "DRIVER":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">Transporteur</span>;
      case "INVESTOR":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">Investisseur</span>;
      case "ADMIN":
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">Admin</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ADMIN HEADER TABS */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-black text-emerald-950 font-display">Console d'Administration LGF's Mall</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion centralisée des comptes, de la conformité KYC et de la modération du marché.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setAdminTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              adminTab === "users" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setAdminTab("kyc")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 relative ${
              adminTab === "kyc" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Modération KYC</span>
            {pendingKycs.length > 0 && (
              <span className="bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                {pendingKycs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab("projects")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              adminTab === "projects" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Investissements ({investmentProjects.length})</span>
          </button>

          <button
            onClick={() => setAdminTab("marketing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              adminTab === "marketing" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Ventes Flash & Vedettes ({allProducts.length})</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => { setAdminTab("users"); setSelectedRoleFilter("BUYER"); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Acheteurs</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{buyersCount}</p>
        </div>

        <div 
          onClick={() => { setAdminTab("users"); setSelectedRoleFilter("VENDOR"); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Vendeurs</span>
            <Store className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{vendorsCount}</p>
        </div>

        <div 
          onClick={() => { setAdminTab("users"); setSelectedRoleFilter("DRIVER"); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-purple-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Chauffeurs</span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{driversCount}</p>
        </div>

        <div 
          onClick={() => { setAdminTab("users"); setSelectedRoleFilter("INVESTOR"); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Investisseurs</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{investorsCount}</p>
        </div>

        <div 
          onClick={() => { setAdminTab("users"); setSelectedRoleFilter("ADMIN"); }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-rose-400 transition-all col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Admins</span>
            <ShieldCheck className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{adminsCount}</p>
        </div>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {adminTab === "users" && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "BUYER", "VENDOR", "DRIVER", "INVESTOR", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedRoleFilter === r
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r === "ALL" ? "Tous" : r === "BUYER" ? "Acheteurs" : r === "VENDOR" ? "Vendeurs" : r === "DRIVER" ? "Chauffeurs" : r === "INVESTOR" ? "Investisseurs" : "Admins"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* USERS TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Utilisateur</th>
                  <th className="p-3.5">Rôle</th>
                  <th className="p-3.5">Téléphone</th>
                  <th className="p-3.5">Statut KYC</th>
                  <th className="p-3.5">Portefeuille</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      Aucun utilisateur ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const kycStatus = u.kyc?.status || "NOT_SUBMITTED";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                              {u.name ? u.name.charAt(0) : u.email.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                                <span>{u.name || "Inconnu"}</span>
                                {u.isEmailVerified && (
                                  <span title="Email Vérifié">
                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {getRoleBadge(u.role)}
                        </td>

                        <td className="p-3.5 font-mono text-slate-600">
                          {u.phone || "Non renseigné"}
                        </td>

                        <td className="p-3.5">
                          {kycStatus === "APPROVED" ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Vérifié</span>
                            </span>
                          ) : kycStatus === "PENDING" ? (
                            <span className="inline-flex items-center space-x-1 text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>En attente</span>
                            </span>
                          ) : kycStatus === "REJECTED" ? (
                            <span className="inline-flex items-center space-x-1 text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              <span>Rejeté</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Non soumis</span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {formatCurrency(u.escrowWallet?.balance || 0)}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedUserForDetail(u)}
                            className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] px-3 py-1.5 rounded-xl border border-emerald-200/60 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Détails</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KYC MODERATION WORKSPACE */}
      {adminTab === "kyc" && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-emerald-950 font-display flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
            Modération Réglementaire & Validation KYC ({pendingKycs.length})
          </h3>

          {pendingKycs.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-700">Aucun dossier KYC en attente de vérification.</p>
              <p className="text-[11px] text-slate-400 mt-1">Toutes les soumissions récentes ont été traitées.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingKycs.map((kyc) => (
                <div key={kyc.id} className="p-5 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">Dossier #{kyc.id.slice(0, 8)}</h4>
                      <span className="text-[10px] text-emerald-600 font-semibold block uppercase font-mono mt-0.5">
                        Utilisateur : {kyc.user?.name || kyc.user?.email} • Type : {kyc.documentType}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                      PENDING
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-emerald-100 font-mono">
                    <div>
                      <span className="text-emerald-500 block text-[9px] font-bold uppercase">Numéro de pièce :</span>
                      <span className="font-extrabold text-emerald-950">{kyc.idNumber}</span>
                    </div>
                    <div>
                      <span className="text-emerald-500 block text-[9px] font-bold uppercase">Création :</span>
                      <span className="font-semibold text-emerald-950">
                        {kyc.createdAt && !isNaN(new Date(kyc.createdAt).getTime())
                          ? new Date(kyc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                          : "Date non disponible"}
                      </span>
                    </div>
                  </div>

                  {kyc.documentUrl && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-emerald-600 text-[9px] font-extrabold uppercase">Scan / Document officiel soumis :</span>
                        <a
                          href={kyc.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-700 font-bold underline hover:text-emerald-900"
                        >
                          Agrandir / Télécharger ↗
                        </a>
                      </div>
                      {kyc.documentUrl.startsWith("data:application/pdf") ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-bold flex items-center justify-between">
                          <span>Document au format PDF</span>
                          <a
                            href={kyc.documentUrl}
                            download="KYC_Document.pdf"
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-md text-[10px]"
                          >
                            Télécharger PDF
                          </a>
                        </div>
                      ) : (
                        <img 
                          src={kyc.documentUrl} 
                          alt="KYC User Submission" 
                          referrerPolicy="no-referrer"
                          className="w-full max-h-56 object-contain rounded-lg border border-slate-200 bg-slate-900/5 shadow-inner" 
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-3 pt-3 border-t border-emerald-100">
                    <input
                      type="text"
                      placeholder="Motif en cas de rejet (ex: Photo floue, document expiré)..."
                      value={rejectionReasons[kyc.id] || ""}
                      onChange={(e) => setRejectionReasons({ ...rejectionReasons, [kyc.id]: e.target.value })}
                      className="w-full bg-white border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => verifyKyc(kyc.id, "APPROVED")}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => verifyKyc(kyc.id, "REJECTED", rejectionReasons[kyc.id])}
                        disabled={isLoading}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVESTMENT PROJECTS MANAGEMENT */}
      {adminTab === "projects" && (
        <AdminInvestmentProjects
          investmentProjects={investmentProjects}
          createInvestmentProject={createInvestmentProject}
          updateInvestmentProject={updateInvestmentProject}
          deleteInvestmentProject={deleteInvestmentProject}
          fetchInvestmentProjects={fetchInvestmentProjects}
          formatCurrency={formatCurrency}
          isLoading={isLoading}
        />
      )}

      {/* TAB 4: MARKETING, FLASH DEALS & FEATURED PRODUCTS */}
      {adminTab === "marketing" && (
        <div className="space-y-6">
          {actionSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in shadow-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button onClick={() => setActionSuccessMsg("")} className="text-emerald-500 hover:text-emerald-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sub-tabs header */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                  <h3 className="text-lg font-black text-slate-900 font-display">Gestion du Marketing & Mise en Avant</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sélectionnez les articles en Vente Flash temporaire ou placez vos meilleurs articles en Vedette sur l'accueil.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setMarketingSubTab("flash")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    marketingSubTab === "flash" ? "bg-amber-500 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Ventes Flash ({flashProducts.length})</span>
                </button>

                <button
                  onClick={() => setMarketingSubTab("featured")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    marketingSubTab === "featured" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Mis en Vedette ({featuredProducts.length})</span>
                </button>
              </div>
            </div>

            {/* Product search bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un article par titre, catégorie..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* VENTES FLASH VIEW */}
          {marketingSubTab === "flash" && (
            <div className="space-y-6">
              {/* Active Flash Deals Grid */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <h4 className="font-extrabold text-slate-900 text-sm">Articles Actuellement en Vente Flash</h4>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-mono">
                    {flashProducts.length} en promotion
                  </span>
                </div>

                {flashProducts.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Zap className="w-8 h-8 text-amber-400 mx-auto opacity-50" />
                    <p className="text-xs font-bold text-slate-600">Aucune vente flash active pour le moment.</p>
                    <p className="text-[11px] text-slate-400">Sélectionnez un article du catalogue ci-dessous pour lancer une vente flash.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flashProducts.map((prod) => {
                      const discountPct = prod.flashPrice 
                        ? Math.round(((prod.price - prod.flashPrice) / prod.price) * 100) 
                        : 15;
                      return (
                        <div key={prod.id} className="bg-slate-50 rounded-2xl p-4 border border-amber-200/80 space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-2 right-2 bg-amber-500 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            -{discountPct}% FLASH
                          </div>

                          <div className="flex space-x-3 items-center">
                            <img
                              src={prod.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"}
                              alt={prod.title}
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-slate-900 text-xs truncate">{prod.title}</h5>
                              <p className="text-[10px] text-slate-500 truncate">{prod.category}</p>
                              
                              <div className="flex items-baseline space-x-2 mt-1">
                                <span className="font-mono font-black text-amber-600 text-sm">
                                  {formatCurrency(prod.flashPrice || Math.round(prod.price * 0.85))}
                                </span>
                                <span className="font-mono text-slate-400 line-through text-[11px]">
                                  {formatCurrency(prod.price)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-mono flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Fin: {prod.flashEndTime ? new Date(prod.flashEndTime).toLocaleString() : "Dans 24h"}</span>
                            </span>

                            <button
                              disabled={isUpdatingProduct}
                              onClick={() => handleToggleFlashDeal(prod, false)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg border border-rose-200 text-[10px] cursor-pointer transition-colors"
                            >
                              Retirer Flash
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selector / Catalog List to Add Flash Deals */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">Catalogue Général — Ajouter une Vente Flash</h4>

                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                  {allProducts
                    .filter(p => !p.isFlashDeal)
                    .filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((prod) => (
                      <div key={prod.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={prod.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"}
                            alt={prod.title}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 text-xs truncate">{prod.title}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">{formatCurrency(prod.price)} • {prod.category}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedFlashProduct(prod);
                            setFlashPriceInput(String(Math.round(prod.price * 0.80))); // 20% discount default suggestion
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors shrink-0 shadow-xs"
                        >
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          <span>Configurer Vente Flash</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* MIS EN VEDETTE / FEATURED VIEW */}
          {marketingSubTab === "featured" && (
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">Gestion des Articles Mis en Avant sur l'Accueil</h4>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-mono">
                  {featuredProducts.length} articles en vedette
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Les articles avec l'étoile dorée apparaissent prioritairement dans les carrousels "Produits Mis en Avant" et la section héros de l'application.
              </p>

              <div className="divide-y divide-slate-100">
                {allProducts
                  .filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((prod) => (
                    <div key={prod.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={prod.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"}
                          alt={prod.title}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-bold text-slate-900 text-xs truncate">{prod.title}</h5>
                            {prod.isFeatured && (
                              <span className="bg-amber-100 text-amber-800 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center space-x-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                <span>EN VEDETTE</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{formatCurrency(prod.price)} • {prod.category}</span>
                        </div>
                      </div>

                      <button
                        disabled={isUpdatingProduct}
                        onClick={() => handleToggleFeatured(prod)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                          prod.isFeatured
                            ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                            : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200"
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${prod.isFeatured ? "text-amber-600 fill-amber-500" : "text-slate-400"}`} />
                        <span>{prod.isFeatured ? "En Vedette ✓" : "Mettre en Vedette"}</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* FLASH DEAL CONFIGURATION MODAL */}
          {selectedFlashProduct && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl space-y-4 p-6 animate-scale-in text-slate-800">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h3 className="font-extrabold text-slate-900 text-sm">Programmer une Vente Flash</h3>
                  </div>
                  <button onClick={() => setSelectedFlashProduct(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex space-x-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <img
                    src={selectedFlashProduct.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"}
                    alt={selectedFlashProduct.title}
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{selectedFlashProduct.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Prix d'origine: {formatCurrency(selectedFlashProduct.price)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Prix Spécial Vente Flash (FCFA)
                    </label>
                    <input
                      type="number"
                      value={flashPriceInput}
                      onChange={(e) => setFlashPriceInput(e.target.value)}
                      placeholder="Ex: 8000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {flashPriceInput && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">
                        Réduction accordée: -{Math.round(((selectedFlashProduct.price - parseFloat(flashPriceInput || "0")) / selectedFlashProduct.price) * 100)}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Durée de la Vente Flash
                    </label>
                    <select
                      value={flashHoursInput}
                      onChange={(e) => setFlashHoursInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="6">6 Heures Express</option>
                      <option value="12">12 Heures</option>
                      <option value="24">24 Heures (1 jour)</option>
                      <option value="48">48 Heures (2 jours)</option>
                      <option value="72">72 Heures (3 jours)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => setSelectedFlashProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={isUpdatingProduct}
                    onClick={() => handleToggleFlashDeal(selectedFlashProduct, true)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center space-x-1"
                  >
                    <Flame className="w-4 h-4 fill-white" />
                    <span>Lancer la Vente Flash</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedUserForDetail && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col my-8 animate-scale-in text-slate-800">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-sm uppercase font-mono">
                  {selectedUserForDetail.name ? selectedUserForDetail.name.charAt(0) : selectedUserForDetail.email.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base">{selectedUserForDetail.name || "Utilisateur"}</h3>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold block">{selectedUserForDetail.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="text-emerald-300 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase text-[10px] font-mono">Rôle plateforme</span>
                {getRoleBadge(selectedUserForDetail.role)}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">E-mail:</span>
                  <span className="font-mono text-slate-900">{selectedUserForDetail.email}</span>
                  {selectedUserForDetail.isEmailVerified ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">VÉRIFIÉ</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">NON VÉRIFIÉ</span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Téléphone:</span>
                  <span className="font-mono text-slate-900">{selectedUserForDetail.phone || "Non renseigné"}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Solde Séquestre:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">{formatCurrency(selectedUserForDetail.escrowWallet?.balance || 0)}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Inscrit le:</span>
                  <span className="font-mono text-slate-900">
                    {selectedUserForDetail.createdAt && !isNaN(new Date(selectedUserForDetail.createdAt).getTime())
                      ? new Date(selectedUserForDetail.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : "Date non disponible"}
                  </span>
                </div>
              </div>

              {/* KYC Status Section */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] font-mono block">Statut Réglementaire & KYC</span>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Statut:</span>
                    <span className="font-bold uppercase font-mono text-[11px] text-emerald-800">
                      {selectedUserForDetail.kyc?.status || "NOT_SUBMITTED"}
                    </span>
                  </div>
                  {selectedUserForDetail.kyc?.idNumber && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Numéro de pièce:</span>
                      <span className="font-mono font-extrabold text-slate-900">{selectedUserForDetail.kyc.idNumber}</span>
                    </div>
                  )}
                  {selectedUserForDetail.kyc?.documentType && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Type de pièce:</span>
                      <span className="font-mono text-slate-900">{selectedUserForDetail.kyc.documentType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
