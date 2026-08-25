import React from "react";
import { Home, Search, HelpCircle, ArrowLeft, ShoppingBag, Store, ShieldAlert } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onNavigateHelp: () => void;
  onOpenCatalog?: () => void;
}

export default function NotFoundPage({
  onNavigateHome,
  onNavigateHelp,
  onOpenCatalog
}: NotFoundPageProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 text-center space-y-8 animate-fade-in">
      {/* Visual Badge & Icon */}
      <div className="inline-flex items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-950/80 rounded-full border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xl">
        <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 animate-pulse" />
      </div>

      {/* Heading & Error Code */}
      <div className="space-y-3">
        <span className="text-xs font-mono font-black text-amber-500 uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
          Erreur 404 — Page Non Trouvée
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">
          Oups ! Cette page est introuvable sur LGF's Mall
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-emerald-100/90 max-w-xl mx-auto font-medium leading-relaxed">
          Le lien que vous avez suivi a peut-être expiré, la page a été déplacée ou l'adresse URL contient une petite faute de frappe.
        </p>
      </div>

      {/* Suggested Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex flex-col items-center justify-center p-5 bg-white dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/80 border border-slate-200 dark:border-emerald-800 rounded-2xl transition-all cursor-pointer shadow-sm group active:scale-95"
        >
          <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Page d'accueil</span>
          <span className="text-xs text-slate-500 dark:text-emerald-200/80 mt-1">Retourner au marché principal</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenCatalog) {
              onOpenCatalog();
            } else {
              onNavigateHome();
            }
          }}
          className="flex flex-col items-center justify-center p-5 bg-white dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/80 border border-slate-200 dark:border-emerald-800 rounded-2xl transition-all cursor-pointer shadow-sm group active:scale-95"
        >
          <ShoppingBag className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Explorer le Catalogue</span>
          <span className="text-xs text-slate-500 dark:text-emerald-200/80 mt-1">Découvrir les offres à Lomé</span>
        </button>

        <button
          type="button"
          onClick={onNavigateHelp}
          className="flex flex-col items-center justify-center p-5 bg-white dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/80 border border-slate-200 dark:border-emerald-800 rounded-2xl transition-all cursor-pointer shadow-sm group active:scale-95"
        >
          <HelpCircle className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Centre d'Aide</span>
          <span className="text-xs text-slate-500 dark:text-emerald-200/80 mt-1">FAQ & Support Client 7j/7</span>
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={onNavigateHome}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Revenir à l'accueil</span>
        </button>
      </div>
    </div>
  );
}
