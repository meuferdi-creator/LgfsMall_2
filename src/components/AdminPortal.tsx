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
  AlertTriangle
} from "lucide-react";
import { User as UserType, Kyc, UserRole } from "../types";

interface AdminPortalProps {
  allUsers: UserType[];
  pendingKycs: Kyc[];
  verifyKyc: (kycId: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) => Promise<boolean>;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
  rejectionReasons: Record<string, string>;
  setRejectionReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function AdminPortal({
  allUsers,
  pendingKycs,
  verifyKyc,
  formatCurrency,
  isLoading,
  rejectionReasons,
  setRejectionReasons
}: AdminPortalProps) {
  const [adminTab, setAdminTab] = useState<"users" | "kyc" | "stats">("users");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserType | null>(null);

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
                      <span className="font-semibold text-emerald-950">{new Date(kyc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {kyc.documentUrl && (
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-emerald-500 text-[9px] block font-bold uppercase mb-1 font-mono">Photo / Document officiel :</span>
                      <img 
                        src={kyc.documentUrl} 
                        alt="KYC User Submission" 
                        referrerPolicy="no-referrer"
                        className="w-full max-h-40 object-contain rounded-lg border border-slate-200 bg-slate-50" 
                      />
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

      {/* USER DETAIL INSPECTION MODAL */}
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
                  <span className="font-mono text-slate-900">{new Date(selectedUserForDetail.createdAt).toLocaleDateString()}</span>
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
