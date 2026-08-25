import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  CreditCard,
  Store,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFaqDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelpCenter?: () => void;
}

interface FaqEntry {
  id: string;
  category: "buyers" | "escrow" | "delivery" | "vendor" | "payments";
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    id: "f1",
    category: "buyers",
    question: "Comment commander sur LGF's Mall ?",
    answer: "Parcourez les articles, ajoutez vos produits au panier ou cliquez sur 'Acheter avec Escrow'. Choisissez votre mode de livraison et réglez en toute sécurité par T-Money, Flooz ou Carte bancaire."
  },
  {
    id: "f2",
    category: "escrow",
    question: "Comment fonctionne la protection Escrow (Séquestre) ?",
    answer: "Vos fonds sont bloqués sur un compte sécurisé neutre jusqu'à ce que vous receviez votre colis au Togo. Le vendeur n'est payé que lorsque vous confirmez la livraison."
  },
  {
    id: "f3",
    category: "delivery",
    question: "Quels sont les délais et zones de livraison ?",
    answer: "Nous livrons partout au Togo : Grand Lomé en 2h à 24h, et les régions (Kara, Sokodé, Atakpamé, Kpalimé, Dapaong) en 24h à 48h via nos transporteurs partenaires agréés."
  },
  {
    id: "f4",
    category: "payments",
    question: "Quels moyens de paiement sont acceptés ?",
    answer: "Nous acceptons T-Money (Togocom), Flooz (Moov Africa), Wave Togo, les cartes bancaires Visa/Mastercard ainsi que le virement direct Ecobank."
  },
  {
    id: "f5",
    category: "vendor",
    question: "Comment ouvrir ma boutique et vendre ?",
    answer: "Cliquez sur 'Devenir Vendeur' dans le menu. L'inscription est 100% gratuite. Dès validation de vos informations, publiez vos produits et recevez vos paiements directement par Mobile Money."
  },
  {
    id: "f6",
    category: "escrow",
    question: "Que faire en cas d'article non conforme ou défectueux ?",
    answer: "Ne confirmez pas la livraison. Ouvrez un litige dans l'onglet 'Historique' ou contactez le support LGF immédiat par WhatsApp. Vos fonds restent protégés et remboursables."
  }
];

const CATEGORIES = [
  { id: "all", label: "Toutes les questions" },
  { id: "buyers", label: "Achats & Commandes" },
  { id: "escrow", label: "Escrow & Séquestre" },
  { id: "delivery", label: "Livraison Togo" },
  { id: "payments", label: "Paiements" },
  { id: "vendor", label: "Vendeurs" }
];

export default function MobileFaqDrawer({
  isOpen,
  onClose,
  onOpenHelpCenter
}: MobileFaqDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("f2");

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80"
      />

      {/* Slide-in Bottom Sheet Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-h-[85vh] bg-white dark:bg-emerald-950 rounded-t-3xl border-t border-emerald-100 dark:border-emerald-800 shadow-2xl flex flex-col z-10 overflow-hidden"
      >
        {/* Drawer Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-emerald-800 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-emerald-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-emerald-950 dark:text-white font-display">
                Centre d'Aide & FAQ
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Assistance rapide & questions fréquentes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="p-4 border-b border-slate-100 dark:border-emerald-900 bg-slate-50/50 dark:bg-emerald-900/30">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question (ex: livraison, escrow...)"
              className="w-full bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex space-x-1.5 overflow-x-auto py-2.5 scrollbar-none text-[11px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-emerald-900/60 text-slate-600 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-emerald-400">
              Aucune question ne correspond à votre recherche.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-slate-200 dark:border-emerald-800/80 rounded-2xl overflow-hidden bg-white dark:bg-emerald-900/40 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-emerald-950 dark:text-white hover:bg-slate-50 dark:hover:bg-emerald-900/60 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3.5 pb-3.5 text-xs text-slate-600 dark:text-emerald-200/90 leading-relaxed border-t border-slate-100 dark:border-emerald-900/60 pt-2"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}

          {/* Quick Support Channels */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-emerald-900 space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
              Besoin d'aide immédiate ?
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://wa.me/22890000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp LGF</span>
              </a>

              <a
                href="mailto:lgfmall.lmdg11@gmail.com"
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>Email Support</span>
              </a>
            </div>

            {onOpenHelpCenter && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelpCenter();
                }}
                className="w-full mt-2 py-2 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center justify-center space-x-1"
              >
                <span>Ouvrir la page complète du Centre d'aide</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
