import React, { useState } from "react";
import { 
  X, ChevronRight, ChevronLeft, ShoppingBag, ShoppingCart, Heart, 
  ShieldCheck, Truck, MessageCircle, AlertTriangle, CheckCircle2, Sparkles, HelpCircle
} from "lucide-react";
import { SupportedLanguage } from "../types";
import { translations } from "../translations";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
}

const ONBOARDING_STEPS = [
  {
    icon: ShoppingBag,
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 text-emerald-800 border-emerald-200",
    title: {
      FR: "Découvrez nos Produits & Boutiques",
      EN: "Discover Products & Stores",
      EWE: "Kpɔ Asinuwo kple Fiasewo",
      KABYE: "Na Tʊma Wondu nɛ Kɩyakʊ"
    },
    desc: {
      FR: "Explorez des milliers d'articles locaux et importés de Lomé à Cinkassé. Utilisez la recherche avancée par région, prix et catégories pour trouver exactement ce dont vous avez besoin.",
      EN: "Explore thousands of local and imported items from Lomé to Cinkassé. Use advanced search by region, price, and category to find exactly what you need.",
      EWE: "Kpɔ asinu akpe geɖe tso Lomé vaseɖe Cinkassé. Zã nyabiase kaba kple asinu teƒewo xexlẽ.",
      KABYE: "Cɔna tʊma wondu kpayi kpaɣ Lomé nɛ Cinkassé. Zã kɩyakʊ hɩla masʊʊ kpaɣ nɛ lɔŋ."
    }
  },
  {
    icon: ShoppingCart,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 text-amber-800 border-amber-200",
    title: {
      FR: "Gestion Simple du Panier",
      EN: "Easy Cart Management",
      EWE: "Asinu Dzadzraɖo le Panier me",
      KABYE: "Kɩyakʊ Wondu Kpaɣʊ Panier"
    },
    desc: {
      FR: "Ajoutez facilement des articles à votre panier. Profitez de tarifs de gros automatiques dès que vous atteignez les quantités minimales fixées par les vendeurs.",
      EN: "Easily add items to your cart. Benefit from automatic wholesale prices as soon as you meet the minimum quantities set by sellers.",
      EWE: "Tsɔ asinuwo de wò panier me. Kpɔ viɖe le gros asinuwo me kaba.",
      KABYE: "Kpaɣ tʊma wondu wazʊʊ panier taa. Mʊ viɖe kɩyakʊ pɛdʊʊ taa."
    }
  },
  {
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50 text-rose-800 border-rose-200",
    title: {
      FR: "Liste de Souhaits & Favoris",
      EN: "Wishlist & Favorites",
      EWE: "Asinu Lɔlɔ̃wo / Favoris",
      KABYE: "Tʊma Wondu Kɩbanɖʊʊ"
    },
    desc: {
      FR: "Cliquez sur l'icône cœur pour sauvegarder vos articles préférés. Recevez des notifications en cas de baisse de prix, promotion ou retour en stock !",
      EN: "Click the heart icon to save your favorite items. Receive notifications for price drops, promotions, or restocks!",
      EWE: "Zi dzi-dzesi dzi be nàdzra asinu lɔlɔ̃wo ɖo. Xɔ gbeɖoɖo zi ale si asiasia ɖi le asime.",
      KABYE: "Sʊɔ lɔlɔ̃ʊ dzesi yɔɔ nɛ ŋpɛdɩ tʊma wondu. Mʊ tɔm lɔŋ kɩyakʊ lɔlɔ̃ʊ taa."
    }
  },
  {
    icon: ShieldCheck,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 text-blue-800 border-blue-200",
    title: {
      FR: "Paiement Sécurisé par Séquestre (Escrow)",
      EN: "Secured Escrow Payment",
      EWE: "Ga Xexe le Dzadzraɖo me (Escrow)",
      KABYE: "Liidiye Mʊʊ Kɩbanɖʊʊ (Escrow)"
    },
    desc: {
      FR: "Payez en toute sérénité par Mobile Money (TMoney, Flooz) ou Carte. Vos fonds sont retenus en toute sécurité jusqu'à ce que vous confirmiez la réception conforme du colis.",
      EN: "Pay with peace of mind via Mobile Money (TMoney, Flooz) or Card. Your funds are held securely until you confirm receipt of your order.",
      EWE: "Exe ga kple Mobile Money (TMoney, Flooz). Wò ga le dedienɔnɔ me vaseɖe eshi nàxɔ wò asinu.",
      KABYE: "Hɛɛ liidiye nɛ Mobile Money (TMoney, Flooz). Liidiye wɛ kɩbanɖʊʊ taa pʊcɔ ŋmʊ wondu."
    }
  },
  {
    icon: Truck,
    color: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50 text-purple-800 border-purple-200",
    title: {
      FR: "Suivi de Commande & Livraison GPS",
      EN: "Order Tracking & GPS Delivery",
      EWE: "Mɔzɔzɔ Kpɔkpɔ kple GPS Delivery",
      KABYE: "Tʊma Wondu Cɔna nɛ GPS"
    },
    desc: {
      FR: "Suivez votre colis en temps réel de la boutique du vendeur jusqu'à votre domicile avec nos livreurs certifiés LGF et le système de validation par code OTP.",
      EN: "Track your parcel in real-time from the seller's store to your doorstep with certified LGF drivers and OTP validation code.",
      EWE: "Kpɔ wò asinu ƒe mɔzɔzɔ le hã me kple code OTP kple lòɖodolawo.",
      KABYE: "Cɔna tʊma wondu nʊmɔʊ taa nɛ OTP nɛ kɔŋgʊʊ waa."
    }
  },
  {
    icon: MessageCircle,
    color: "from-emerald-600 to-green-700",
    bgLight: "bg-emerald-50 text-emerald-800 border-emerald-200",
    title: {
      FR: "Contact Direct avec les Vendeurs",
      EN: "Direct Contact with Vendors",
      EWE: "Kafoasitsatɔwo kple Direct Chat",
      KABYE: "Tɔm Yoyɔɔ nɛ Pɛdʊʊ Waa"
    },
    desc: {
      FR: "Discutez directement par WhatsApp ou appel téléphonique avec les boutiques pour négocier, poser des questions ou personnaliser vos commandes.",
      EN: "Chat directly via WhatsApp or phone call with shop owners to negotiate, ask questions, or customize your orders.",
      EWE: "Ɖo dze kple asitsalawo le WhatsApp alo kaƒomadzi dzi kaba.",
      KABYE: "Yoyɔ tɔm nɛ pɛdʊʊ waa WhatsApp yɔɔ yaa kaŋgalafʊ yɔɔ."
    }
  },
  {
    icon: AlertTriangle,
    color: "from-rose-600 to-red-700",
    bgLight: "bg-rose-50 text-rose-800 border-rose-200",
    title: {
      FR: "Assistance & Signalement de Litiges",
      EN: "Support & Issue Reporting",
      EWE: "Kpekpeɖeŋu kple Nuxoxo Signalement",
      KABYE: "Kpekpeɖeŋu nɛ Tɔm Kɩwɛɛkɩm Signalement"
    },
    desc: {
      FR: "Un problème avec un article ? Signalez un litige en un clic depuis votre espace acheteur. Notre équipe d'assistance LGF intervient 24/7 pour résoudre le problème.",
      EN: "Issue with an item? Open a dispute with one click from your buyer center. Our LGF support team intervenes 24/7 to resolve the issue.",
      EWE: "Kuxi aɖe dzɔa? Bia kpekpeɖeŋu kaba le LGF support center me.",
      KABYE: "Kɩwɛɛkɩm nakʊyʊ wɛɛ? Sʊɔ support center taa nɛ ŋmʊ kpekpeɖeŋu lɔŋ."
    }
  }
];

export default function OnboardingModal({ isOpen, onClose, lang }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const t = translations[lang] || translations.FR;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden text-slate-800">
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-900 text-white">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-sm font-bold tracking-wide font-display">
              {lang === "EN" ? "Welcome to LGF's Mall" : lang === "EWE" ? "Woezor ɖe LGF's Mall" : lang === "KABYE" ? "Lezʊʊ kɔɔ LGF's Mall" : "Bienvenue sur LGF's Mall"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            title="Fermer / Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Icon Badge */}
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-transform`}>
              <Icon className="w-10 h-10" />
            </div>
          </div>

          {/* Title & Desc */}
          <div className="text-center space-y-3">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider ${step.bgLight}`}>
              Étape {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
            <h3 className="text-xl font-black text-emerald-950 font-display">
              {step.title[lang] || step.title.FR}
            </h3>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {step.desc[lang] || step.desc.FR}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center items-center space-x-1.5 pt-2">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? "w-8 bg-emerald-600"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                title={`Étape ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {lang === "EN" ? "Skip" : lang === "EWE" ? "Togo" : lang === "KABYE" ? "Dɛ" : "Passer"}
          </button>

          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === "EN" ? "Previous" : "Précédent"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>
                {currentStep === ONBOARDING_STEPS.length - 1
                  ? (lang === "EN" ? "Finish" : "Terminer")
                  : (lang === "EN" ? "Next" : "Suivant")}
              </span>
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
