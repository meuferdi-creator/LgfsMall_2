import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { User, UserRole } from "../types";
import { 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  ShoppingBag, 
  LayoutDashboard, 
  Moon, 
  Sun, 
  ChevronRight, 
  Check, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar,
  Lock,
  Plus,
  Store,
  Truck,
  TrendingUp
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { checkWorkspaceAccess, getWorkspaceTooltipText } from "../lib/workspaceAuth";

interface MobileProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  activePortalRole: UserRole;
  onChangePortalRole: (role: UserRole) => void;
  onNavigateToDashboard: () => void;
  onNavigateToOrders: () => void;
  onWorkspaceAccessDenied?: (role: UserRole, reason?: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CREATED") => void;
}

export default function MobileProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
  theme,
  setTheme,
  activePortalRole,
  onChangePortalRole,
  onNavigateToDashboard,
  onNavigateToOrders,
  onWorkspaceAccessDenied
}: MobileProfileModalProps) {
  const { t } = useTranslation();
  if (!user) return null;

  const roleLabels: Record<UserRole, string> = {
    BUYER: t.buyerPortal || "Acheteur Client",
    VENDOR: t.vendorPortal || "Vendeur Marchand",
    DRIVER: t.driverPortal || "Livreur / Transporteur",
    INVESTOR: t.investorPortal || "Investisseur LGF",
    ADMIN: t.adminPortal || "Administrateur"
  };

  const handleLogoutClick = () => {
    onClose();
    onLogout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-emerald-950 text-slate-900 dark:text-white rounded-3xl p-5 border border-slate-200 dark:border-emerald-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-3 border-b border-slate-100 dark:border-emerald-900">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-md border-2 border-amber-400">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-extrabold font-display text-emerald-950 dark:text-white truncate">
                {user.name || "Utilisateur LGF"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-emerald-300 truncate">
                {user.email}
              </DialogDescription>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="text-[10px] bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full font-black font-mono">
                  {roleLabels[user.role] || user.role}
                </span>
                {user.kyc?.status === "APPROVED" && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mr-0.5" />
                    <span>Vérifié</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Menu List */}
        <div className="space-y-3 py-2 text-xs">
          
          {/* Navigation Items */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToDashboard();
              }}
              className="w-full bg-slate-50 dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-800/60 p-3 rounded-2xl flex items-center justify-between text-slate-800 dark:text-white font-bold transition-all cursor-pointer border border-slate-100 dark:border-emerald-800/60"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span>{t.dashboard} & {t.profile}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToOrders();
              }}
              className="w-full bg-slate-50 dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-800/60 p-3 rounded-2xl flex items-center justify-between text-slate-800 dark:text-white font-bold transition-all cursor-pointer border border-slate-100 dark:border-emerald-800/60"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span>{t.myOrders} & {t.escrowProtected}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-emerald-400" />
            </button>
          </div>

          {/* Role Switching */}
          <div className="pt-2 border-t border-slate-100 dark:border-emerald-900">
            <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400 uppercase tracking-wider mb-2 font-mono">
              {t.portals}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { 
                  role: "BUYER" as UserRole, 
                  label: roleLabels["BUYER"], 
                  icon: ShoppingBag,
                  iconColor: "text-emerald-500"
                },
                { 
                  role: "VENDOR" as UserRole, 
                  label: roleLabels["VENDOR"], 
                  icon: Store,
                  iconColor: "text-amber-500"
                },
                { 
                  role: "DRIVER" as UserRole, 
                  label: roleLabels["DRIVER"], 
                  icon: Truck,
                  iconColor: "text-blue-500"
                },
                { 
                  role: "INVESTOR" as UserRole, 
                  label: roleLabels["INVESTOR"], 
                  icon: TrendingUp,
                  iconColor: "text-indigo-500"
                },
                { 
                  role: "ADMIN" as UserRole, 
                  label: roleLabels["ADMIN"], 
                  icon: ShieldCheck,
                  iconColor: "text-purple-500"
                }
              ].map((item) => {
                const accessCheck = checkWorkspaceAccess(user, item.role);
                const isCurrentActive = activePortalRole === item.role;
                const tooltipText = getWorkspaceTooltipText(user, item.role);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.role}
                    type="button"
                    title={tooltipText}
                    onClick={() => {
                      onClose();
                      if (accessCheck.hasAccess) {
                        onChangePortalRole(item.role);
                      } else {
                        onWorkspaceAccessDenied?.(item.role, accessCheck.reason);
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isCurrentActive
                        ? "bg-emerald-600 text-white shadow-sm font-black"
                        : "bg-slate-50 dark:bg-emerald-900/30 text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-800/40"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${
                        isCurrentActive ? "text-white" : item.iconColor
                      }`} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{item.label}</span>
                        {!accessCheck.hasAccess && (
                          <span className="text-[10px] text-slate-400 dark:text-emerald-400/80 font-normal truncate">
                            {tooltipText}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {isCurrentActive ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : !accessCheck.hasAccess ? (
                        item.role === "ADMIN" ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-emerald-600" />
                        ) : (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                            + Activer
                          </span>
                        )
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme & Display Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-emerald-900 flex items-center justify-between px-1">
            <span className="text-slate-600 dark:text-emerald-300 font-bold">{t.theme}</span>
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-emerald-800 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-emerald-900/50 cursor-pointer text-xs font-bold transition-all"
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t.darkMode}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.lightMode}</span>
                </>
              )}
            </button>
          </div>

          {/* PROMINENT LOGOUT BUTTON */}
          <div className="pt-3 border-t border-slate-100 dark:border-emerald-900">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 font-extrabold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
