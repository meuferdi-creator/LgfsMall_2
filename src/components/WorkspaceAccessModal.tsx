import React, { useState } from "react";
import { 
  ShieldAlert, 
  Store, 
  Truck, 
  TrendingUp, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Lock, 
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { UserRole } from "../types";
import { useAppStore } from "../store";

interface WorkspaceAccessModalProps {
  isOpen: boolean;
  targetRole: UserRole | null;
  reason?: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CREATED";
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
  onOpenAuthModal?: () => void;
}

export const WorkspaceAccessModal: React.FC<WorkspaceAccessModalProps> = ({
  isOpen,
  targetRole,
  reason = "NOT_CREATED",
  onClose,
  onSuccess,
  onOpenAuthModal
}) => {
  const { user, activateWorkspaceAccount, isLoading } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetRole) return null;

  const handleCreateAccount = async () => {
    if (!user) {
      onClose();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (targetRole === "VENDOR" || targetRole === "DRIVER" || targetRole === "INVESTOR") {
      setIsSubmitting(true);
      try {
        const success = await activateWorkspaceAccount(targetRole);
        if (success) {
          onSuccess(targetRole);
          onClose();
        }
      } catch (e) {
        console.error("Workspace activation error:", e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 1. FORBIDDEN (ADMIN AREA FOR NON-ADMIN USERS)
  if (reason === "FORBIDDEN" || targetRole === "ADMIN") {
    return (
      <div 
        id="workspace-forbidden-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 dark:border-rose-900/40 relative space-y-6 text-slate-900 dark:text-slate-100">
          
          {/* Close Button */}
          <button
            id="close-forbidden-modal-btn"
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header & Icon */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-mono">
                Accès non autorisé
              </span>
              <h3 className="text-lg font-extrabold font-display leading-tight text-slate-900 dark:text-white">
                Espace Administration
              </h3>
            </div>
          </div>

          {/* Description */}
          <div className="bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-xs sm:text-sm text-slate-700 dark:text-rose-200/90 leading-relaxed font-medium">
            Vous n'avez pas les autorisations nécessaires pour accéder à l'espace d'Administration. Cette zone est strictement réservée aux administrateurs de la plateforme.
          </div>

          {/* User Account context reminder */}
          {user && (
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 px-1 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Connecté en tant que <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong> ({user.role})</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="return-to-buyer-btn"
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Retour à l'E-Boutique</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED (USER NOT LOGGED IN AT ALL)
  if (reason === "UNAUTHENTICATED" || !user) {
    return (
      <div 
        id="workspace-unauth-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-6 text-slate-900 dark:text-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
                Connexion requise
              </span>
              <h3 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                Identifiez-vous pour continuer
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Pour accéder à cet espace et gérer vos activités, veuillez vous connecter à votre compte utilisateur ou créer un compte gratuitement.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Se connecter / S'inscrire</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. WORKSPACE ACCOUNT ONBOARDING (VENDOR, DRIVER, INVESTOR)
  const roleConfig = {
    VENDOR: {
      badge: "Espace Vendeur",
      icon: Store,
      title: "Vous n'avez pas encore de compte vendeur",
      subtitle: "Créez votre boutique et commencez à vendre",
      description: "Vous êtes actuellement connecté avec votre compte utilisateur, mais vous n'avez pas encore créé ou activé votre compte vendeur. Le compte vendeur vous permet de créer votre boutique, ajouter vos produits/services, gérer vos commandes et développer votre activité sur LGF's Mall.",
      actionLabel: "Créer mon compte vendeur",
      benefits: [
        "Création & personnalisation de votre boutique en ligne",
        "Gestion autonome de votre catalogue et fiches produits",
        "Portefeuille séquestre sécurisé et retraits Mobile Money / Virement"
      ]
    },
    DRIVER: {
      badge: "Espace Chauffeur",
      icon: Truck,
      title: "Vous n'avez pas encore de compte chauffeur",
      subtitle: "Rejoignez la flotte de livraison LGF",
      description: "Le compte chauffeur vous permet d'effectuer des livraisons de colis de la marketplace, de suivre les courses en temps réel et de percevoir vos commissions de transport sécurisées.",
      actionLabel: "Créer mon compte chauffeur",
      benefits: [
        "Réception des courses et commandes de livraison géolocalisées",
        "Validation sécurisée par code OTP client",
        "Encaissement instantané de vos commissions de transport"
      ]
    },
    INVESTOR: {
      badge: "Espace Investisseur",
      icon: TrendingUp,
      title: "Vous n'avez pas encore de compte investisseur",
      subtitle: "Financez des projets à fort impact et suivez vos rendements",
      description: "L'Espace Investisseur vous permet de financer des projets d'approvisionnement et de commerce à fort impact, de suivre vos rendements et de gérer vos contrats d'investissement LGF.",
      actionLabel: "Créer mon compte investisseur",
      benefits: [
        "Catalogue exclusif de projets d'approvisionnement rentables",
        "Fonds et contrats protégés par séquestre réglementaire BCEAO",
        "Tableau de bord de suivi en temps réel de vos dividendes et retours"
      ]
    }
  };

  const currentConfig = roleConfig[targetRole as "VENDOR" | "DRIVER" | "INVESTOR"] || roleConfig.VENDOR;
  const IconComponent = currentConfig.icon;

  return (
    <div 
      id="workspace-onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 dark:border-emerald-900/40 relative space-y-6 text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          id="close-workspace-onboarding-btn"
          type="button"
          onClick={onClose}
          disabled={isSubmitting || isLoading}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Role Icon */}
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 shadow-xs">
            <IconComponent className="w-7 h-7" />
          </div>
          <div className="space-y-1 pr-6">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
              <Sparkles className="w-3 h-3 mr-1" />
              {currentConfig.badge}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold font-display leading-tight text-slate-900 dark:text-white">
              {currentConfig.title}
            </h3>
          </div>
        </div>

        {/* Explanation Message */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-slate-700 dark:text-emerald-200/90 leading-relaxed font-medium">
          {currentConfig.description}
        </div>

        {/* Key Advantages / Features */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Avantages de cet espace :
          </p>
          <div className="space-y-2">
            {currentConfig.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Status Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 py-1 border-t border-slate-100 dark:border-slate-800">
          <span>Compte actif : <strong className="text-slate-700 dark:text-slate-300">{user.name}</strong></span>
          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
            {user.email}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            id="activate-workspace-btn"
            type="button"
            onClick={handleCreateAccount}
            disabled={isSubmitting || isLoading}
            className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Activation en cours...</span>
              </>
            ) : (
              <>
                <span>{currentConfig.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            id="cancel-workspace-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
