import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Store, 
  Truck, 
  TrendingUp, 
  ShoppingBag, 
  ShieldCheck, 
  Wallet, 
  Package, 
  Clock, 
  HelpCircle,
  Award,
  Zap,
  MapPin,
  FileCheck
} from "lucide-react";
import { UserRole } from "../types";

export interface WorkspaceOnboardingTourProps {
  currentRole: UserRole;
  userId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlights: { label: string; detail: string }[];
  accentColor: string;
  badgeText: string;
}

const TOUR_DEFINITIONS: Record<UserRole, TourStep[]> = {
  VENDOR: [
    {
      title: "Bienvenue dans votre Espace Vendeur",
      subtitle: "Vendez en toute sérénité avec la garantie Séquestre LGF",
      description: "Votre boutique en ligne est connectée au plus grand réseau d'acheteurs au Togo et dans la sous-région. Tous les paiements des acheteurs sont consignés sur un compte séquestre sécurisé dès la commande.",
      icon: <Store className="w-8 h-8 text-amber-500" />,
      accentColor: "amber",
      badgeText: "Séquestre Garanti",
      highlights: [
        { label: "Paiements Sécurisés", detail: "Les fonds sont bloqués dès l'achat et débloqués automatiquement à la livraison." },
        { label: "Visibilité Maximale", detail: "Vos articles sont immédiatement indexés dans le catalogue public et l'application mobile." }
      ]
    },
    {
      title: "Gestion du Catalogue & Prix de Gros",
      subtitle: "Publiez vos produits et configurez des remises volume",
      description: "Ajoutez vos articles en quelques clics avec photos, descriptions complètes, gestion de stocks en temps réel et paliers de vente en gros (B2B).",
      icon: <Package className="w-8 h-8 text-emerald-500" />,
      accentColor: "emerald",
      badgeText: "Gestion Catalogue",
      highlights: [
        { label: "Paliers de Gros", detail: "Activez des prix réduits pour les commandes en volume." },
        { label: "Suivi des Stocks", detail: "Alertes automatiques en cas de rupture de stock imminente." }
      ]
    },
    {
      title: "Traitement des Commandes & Expédition",
      subtitle: "Collaborez avec les livreurs LGF Express",
      description: "Recevez instantanément les notifications de nouvelles commandes. Préparez vos colis et confiez-les au réseau de livreurs certifiés LGF.",
      icon: <Truck className="w-8 h-8 text-blue-500" />,
      accentColor: "blue",
      badgeText: "Logistique Intégrée",
      highlights: [
        { label: "Code de Validation OTP", detail: "Remise sécurisée des colis avec code de confirmation." },
        { label: "Bordereaux d'Envoi", detail: "Générez et imprimez vos factures et bordereaux d'expédition." }
      ]
    },
    {
      title: "Portefeuille & Retraits Mobile Money",
      subtitle: "Retirez vos gains instantanément vers TMoney ou Moov Flooz",
      description: "Dès que l'acheteur confirme la réception de son colis, vos fonds sont transférés dans votre solde retirable disponible sans frais cachés.",
      icon: <Wallet className="w-8 h-8 text-emerald-600" />,
      accentColor: "emerald",
      badgeText: "Retrait Instantané",
      highlights: [
        { label: "TMoney & Flooz", detail: "Virements mobiles rapides 7j/7." },
        { label: "Historique Comptable", detail: "Exportez vos relevés financiers et bilans de ventes." }
      ]
    }
  ],
  INVESTOR: [
    {
      title: "Bienvenue dans l'Espace Investisseur LGF",
      subtitle: "Participez au financement de projets rentables en Afrique de l'Ouest",
      description: "Investissez dans des projets à fort impact (Agro-business, transformation locale, logistique) rigoureusement audités par les experts LGF.",
      icon: <TrendingUp className="w-8 h-8 text-indigo-500" />,
      accentColor: "indigo",
      badgeText: "Projets Audités",
      highlights: [
        { label: "Rendements Compétitifs", detail: "Des taux d'intérêts attractifs de 10% à 25% par an." },
        { label: "Garantie Collaterale", detail: "Actifs et stocks gagés par la plateforme LGF." }
      ]
    },
    {
      title: "Sélection & Souscription en Séquestre",
      subtitle: "Investissez en toute transparence",
      description: "Consultez les fiches détaillées, prévisions de cash-flow, garanties associées et souscrivez à partir de 25 000 FCFA.",
      icon: <FileCheck className="w-8 h-8 text-emerald-500" />,
      accentColor: "emerald",
      badgeText: "Sécurité Juridique",
      highlights: [
        { label: "Contrats Numériques", detail: "Certificats d'investissement authentifiés et téléchargeables." },
        { label: "Séquestre Financier", detail: "Fonds débloqués par tranches selon l'avancement validé." }
      ]
    },
    {
      title: "Tableau de Bord & Dividendes",
      subtitle: "Suivez vos plus-values et versement des coupons",
      description: "Visualisez en temps réel l'évolution de votre portefeuille, les versements mensuels ou trimestriels et réinvestissez vos gains.",
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      accentColor: "amber",
      badgeText: "Rendement Actif",
      highlights: [
        { label: "Paiement Automatique", detail: "Crédit automatique sur votre portefeuille LGF." },
        { label: "Rapports Trimestriels", detail: "Suivi opérationnel des entreprises financées." }
      ]
    }
  ],
  DRIVER: [
    {
      title: "Espace Chauffeur & Livreur LGF Express",
      subtitle: "Monétisez vos trajets et livraisons à Lomé et ses environs",
      description: "Accédez au pool de missions de livraison en temps réel, optimisez vos itinéraires et recevez vos commissions après chaque course.",
      icon: <Truck className="w-8 h-8 text-blue-500" />,
      accentColor: "blue",
      badgeText: "LGF Express",
      highlights: [
        { label: "Missions en Temps Réel", detail: "Notification immédiate des colis prêts chez les vendeurs." },
        { label: "Paiement à la Course", detail: "Commissions transparentes créditées dès confirmation du client." }
      ]
    },
    {
      title: "Navigation & Remise Sécurisée",
      subtitle: "Géolocalisation et validation par code OTP",
      description: "Utilisez la carte intégrée pour localiser le vendeur et l'acheteur. Validez chaque étape avec un code sécurisé partagé par le client.",
      icon: <MapPin className="w-8 h-8 text-emerald-500" />,
      accentColor: "emerald",
      badgeText: "Preuve de Livraison",
      highlights: [
        { label: "Code OTP Client", detail: "Garantit la preuve irréfutable de livraison." },
        { label: "Support Dédié", detail: "Assistance téléphonique et WhatsApp en cas d'imprévu." }
      ]
    }
  ],
  ADMIN: [
    {
      title: "Console d'Administration Globale LGF",
      subtitle: "Supervisez l'intégralité de l'écosystème",
      description: "Accédez à la vue d'ensemble des utilisateurs, des marchands, des volumes de transactions et de la conformité réglementaire.",
      icon: <ShieldCheck className="w-8 h-8 text-purple-500" />,
      accentColor: "purple",
      badgeText: "Supervision 360°",
      highlights: [
        { label: "Validation KYC", detail: "Examinez les pièces d'identité et accordez les badges vérifiés." },
        { label: "Journal d'Audit", detail: "Consultez les logs d'activité et tentatives de connexion en temps réel." }
      ]
    },
    {
      title: "Modération & Séquestre Financier",
      subtitle: "Gérez les litiges et les flux de trésorerie",
      description: "Intervenez en toute impartialité sur les litiges entre acheteurs et vendeurs, et approuvez les demandes de retraits.",
      icon: <Award className="w-8 h-8 text-emerald-500" />,
      accentColor: "emerald",
      badgeText: "Gouvernance",
      highlights: [
        { label: "Arbitrage Séquestre", detail: "Déblocage ou remboursement des commandes contestées." },
        { label: "Campagnes Marketing", detail: "Gérez les Ventes Flash, coupons et bannières promotionnelles." }
      ]
    }
  ],
  BUYER: [
    {
      title: "Bienvenue sur LGF's Mall",
      subtitle: "Votre marché en ligne 100% sécurisé",
      description: "Achetez auprès des meilleurs commerçants locaux et internationaux avec la garantie satisfait ou remboursé grâce au Séquestre LGF.",
      icon: <ShoppingBag className="w-8 h-8 text-emerald-500" />,
      accentColor: "emerald",
      badgeText: "Achat Sécurisé",
      highlights: [
        { label: "Séquestre LGF", detail: "Le vendeur n'est payé que lorsque vous recevez et validez votre colis." },
        { label: "Suivi en Direct", detail: "Suivez la position de votre livreur jusqu'à votre porte." }
      ]
    }
  ]
};

export default function WorkspaceOnboardingTour({
  currentRole,
  userId = "guest",
  isOpen: controlledIsOpen,
  onClose,
  forceOpen = false
}: WorkspaceOnboardingTourProps) {
  const storageKey = `lgf_tour_completed_${currentRole}_${userId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = TOUR_DEFINITIONS[currentRole] || TOUR_DEFINITIONS.BUYER;
  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }

    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      return;
    }

    // Check if user has already seen this tour
    const completed = localStorage.getItem(storageKey);
    if (!completed && currentRole !== "BUYER") {
      // Auto-trigger tour on first visit to specialized workspace
      setIsOpen(true);
      setCurrentStepIndex(0);
    }
  }, [currentRole, userId, forceOpen, controlledIsOpen, storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden transition-all transform animate-in zoom-in-95 duration-200">
        
        {/* Top Header Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-emerald-900 transition-all cursor-pointer"
          title="Fermer le guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Badge & Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{currentStep.badgeText}</span>
          </span>

          <span className="text-xs font-mono font-bold text-slate-400 dark:text-emerald-400">
            Étape {currentStepIndex + 1} / {steps.length}
          </span>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="p-3.5 bg-slate-50 dark:bg-emerald-900/50 border border-slate-200 dark:border-emerald-700 rounded-2xl shrink-0 shadow-xs">
            {currentStep.icon}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-display leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>
        </div>

        {/* Description Body */}
        <p className="text-xs text-slate-600 dark:text-emerald-100/90 leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Highlights Cards */}
        {currentStep.highlights && currentStep.highlights.length > 0 && (
          <div className="space-y-2 mb-6">
            {currentStep.highlights.map((h, i) => (
              <div 
                key={i} 
                className="bg-slate-50/80 dark:bg-emerald-900/40 border border-slate-200/80 dark:border-emerald-800/80 rounded-2xl p-3 flex items-start space-x-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{h.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-emerald-300 leading-snug mt-0.5">{h.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stepper Dots & Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-emerald-900/60">
          {/* Stepper Dots */}
          <div className="flex space-x-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex 
                    ? "w-6 bg-emerald-600 dark:bg-emerald-400" 
                    : "w-2 bg-slate-200 dark:bg-emerald-800 hover:bg-slate-300"
                }`}
                title={`Aller à l'étape ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-900 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{currentStepIndex === steps.length - 1 ? "Compris & Commencer" : "Suivant"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
