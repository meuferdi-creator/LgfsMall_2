import React, { useState } from "react";
import { 
  ArrowLeft, 
  Building2, 
  Target, 
  Eye, 
  Award, 
  Users, 
  Briefcase, 
  Newspaper, 
  Globe, 
  Leaf, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CreditCard, 
  Percent, 
  Megaphone, 
  Share2, 
  FileText, 
  Mail, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  ChevronRight
} from "lucide-react";
import SupportTicketModal from "./SupportTicketModal";
import { User as UserType } from "../types";

interface InfoPageProps {
  slug: string;
  user: UserType | null;
  onNavigateHome: () => void;
  onNavigateHelp: () => void;
  onOpenVendorPortal?: () => void;
  onOpenTrackOrders?: () => void;
}

export default function InfoPages({
  slug,
  user,
  onNavigateHome,
  onNavigateHelp,
  onOpenVendorPortal,
  onOpenTrackOrders
}: InfoPageProps) {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("Question générale");

  const openTicket = (subject: string) => {
    setTicketSubject(subject);
    setIsTicketOpen(true);
  };

  // Helper Breadcrumb Top Header
  const renderHeader = (title: string, subtitle: string) => (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center space-x-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Retour à l'accueil LGF's Mall</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
          <span>LGF's Mall</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white">{title}</span>
        </div>
      </div>
    </div>
  );

  // Render Page Content according to slug
  const renderContent = () => {
    switch (slug) {
      // 1. ABOUT / WHO WE ARE
      case "about":
        return (
          <div className="space-y-12">
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-800/50 space-y-4">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Qui Sommes-Nous ?
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight leading-tight">
                LGF's Mall : Le Marché Numérique Africain Innovant
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed font-medium">
                Fondé au Togo à Lomé, LGF's Mall est une marketplace e-commerce multi-vendeurs conçue pour digitaliser le commerce local, sécuriser les transactions de gré à gré via un compte séquestre neutre, et connecter vendeurs, acheteurs et livreurs indépendants.
              </p>
            </div>

            {/* Mission, Vision, Value Proposition Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">Notre Mission</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Connecter directement les producteurs, boutiques locales et artisans aux consommateurs africains en garantissant des transactions financières sécurisées et un suivi logistique transparent.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">Notre Vision</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Devenir l'infrastructure e-commerce de référence en Afrique de l'Ouest, facilitant le commerce transfrontalier et créant des opportunités économiques durables.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">Pourquoi LGF's Mall ?</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Paiements protégés par séquestre (T-Money, Flooz, Wave, cartes), validation de livraison par OTP secret, intelligence artificielle Gemini pour les descriptions, et retraits vendeurs 1-clic.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">
                Nos Valeurs Fondamentales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-medium">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white block">🤝 Confiance & Transparence</span>
                  <p className="text-slate-500 dark:text-slate-400">Aucun frais caché. Les fonds sont sécurisés jusqu'à la réception conforme.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white block">📱 Accessibilité Universelle</span>
                  <p className="text-slate-500 dark:text-slate-400">Plateforme optimisée pour les smartphones avec intégration Mobile Money natif.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white block">🏪 Soutien au Commerce Local</span>
                  <p className="text-slate-500 dark:text-slate-400">Autonomisation des commerçants de Lomé, Kara, Sokodé et de toute la région.</p>
                </div>
              </div>
            </div>
          </div>
        );

      // 2. CAREERS
      case "careers":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 space-y-4">
              <span className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest block">
                Rejoignez L'Aventure
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Bâtissez le futur du e-commerce en Afrique
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium leading-relaxed">
                Chez LGF's Mall, nous réunissons des talents passionnés par la technologie, la logistique et l'impact économique local.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  Pourquoi travailler chez LGF's Mall ?
                </h3>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Environnement de travail stimulant, axé sur l'innovation produit et la résolution de défis logistiques.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Impact direct sur le développement des PME et vendeurs indépendants en Afrique.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Opportunités d'évolution rapide au sein d'une entreprise en forte croissance.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  Pôles d'Activités
                </h3>
                <div className="space-y-2 text-xs font-medium">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="font-extrabold text-slate-900 dark:text-white block">💻 Ingiénierie Tech & IA</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Développement Full-Stack, Supabase, IA Gemini & Sécurité.</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="font-extrabold text-slate-900 dark:text-white block">🛵 Logistique & Operatons Hubs</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Gestion des flux de livraison, dépôts régionaux et flotte de livreurs.</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="font-extrabold text-slate-900 dark:text-white block">🎧 Service Client & Support Vendeurs</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Accompagnement, gestion des litiges et satisfaction client.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 text-center space-y-4">
              <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                Vous souhaitez postuler ou envoyer une candidature spontanée ?
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-xl mx-auto font-medium">
                Transmettez votre CV et lettre de motivation directement à notre équipe des ressources humaines via WhatsApp ou par email.
              </p>
              <button
                onClick={() => openTicket("Candidature / Recrutement LGF")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs inline-flex items-center space-x-2 shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Envoyer ma candidature via le Support WhatsApp</span>
              </button>
            </div>
          </div>
        );

      // 3. BLOG
      case "blog":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Actualités & Insights
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Le Blog LGF's Mall
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Découvrez les tendances du commerce électronique en Afrique de l'Ouest, nos conseils pour les vendeurs et l'évolution de la plateforme.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Comment sécuriser ses paiements Mobile Money en e-commerce ?",
                  category: "Sécurité & Fintech",
                  date: "Août 2026",
                  desc: "Analyse du fonctionnement des compte séquestres et des codes OTP pour éviter les fraudes lors des livraisons au Togo."
                },
                {
                  title: "5 astuces pour optimiser la fiche produit de votre boutique",
                  category: "Conseils Vendeurs",
                  date: "Juillet 2026",
                  desc: "Utiliser l'IA Gemini pour rédiger des descriptions captivantes et structurer vos prix de gros."
                },
                {
                  title: "L'expansion de la livraison express dans les régions du Togo",
                  category: "Logistique & Hubs",
                  date: "Juin 2026",
                  desc: "Comment nos hubs régionaux à Kara, Sokodé et Atakpamé réduisent les délais d'expédition."
                }
              ].map((article, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xs hover:shadow-md transition-all">
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                    {article.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {article.desc}
                  </p>
                  <div className="pt-2 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>{article.date}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Lecture 3 min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // 4. PRESS
      case "press":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Espace Presse & Médias
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Ressources Presse LGF's Mall
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Journalistes, médias et partenaires : retrouvez les communiqués officiels et nos informations institutionnelles.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
                Contact Médias & Relations Publiques
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <span className="font-extrabold text-slate-900 dark:text-white block">📧 Adresse Email Presse</span>
                  <p className="text-slate-500 dark:text-slate-400 font-mono">lgfmall.lmdg11@gmail.com</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <span className="font-extrabold text-slate-900 dark:text-white block">📍 Siège Social</span>
                  <p className="text-slate-500 dark:text-slate-400">Boulevard du Mono, Lomé, Togo</p>
                </div>
              </div>
            </div>
          </div>
        );

      // 5. SUSTAINABILITY
      case "sustainability":
        return (
          <div className="space-y-10">
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest block">
                Engagement & Durabilité
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Un Commerce Équitable et Responsable
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Notre engagement pour un impact social et économique positif au Togo et en Afrique de l'Ouest.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Économie Circulaire & Artisanat</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Nous valorisons les créateurs et producteurs locaux en leur offrant une vitrine numérique directe sans intermédiaires spéculatifs.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Optimisation des Logistiques de Livraison</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Nos algorithmes de routage pour livreurs réduisent les trajets inutiles et diminuent l'empreinte carbone des expéditions urbaines.
                </p>
              </div>
            </div>
          </div>
        );

      // 6. DELIVERY
      case "delivery":
      case "shipping":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Politique de Livraison
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Expédition & Livraison Partout au Togo
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Des livraisons rapides, sécurisées par code OTP et suivies en temps réel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-medium">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">🏙️ Lomé & Grand Lomé</span>
                <p className="text-slate-500 dark:text-slate-400">Livraison express en 2h à 24h. Remise en main propre par nos livreurs certifiés.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">📍 Villes de Régions</span>
                <p className="text-slate-500 dark:text-slate-400">Kara, Sokodé, Atakpamé, Kpalimé, Dapaong, Tsévié : expédition en 24h à 48h via nos Hubs.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">🔐 Validation Sécurisée</span>
                <p className="text-slate-500 dark:text-slate-400">Conservez votre code secret OTP. Communiquez-le au livreur uniquement après vérification du colis.</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onOpenTrackOrders}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs inline-flex items-center space-x-2 shadow-md cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Ouvrir l'outil de Suivi de Commande</span>
              </button>
            </div>
          </div>
        );

      // 7. RETURNS & REFUNDS
      case "returns":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Retours & Remboursements
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Garantie Satisfait ou Remboursé sous 7 jours
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Si un article est non conforme ou défectueux, nous nous engageons à vous rembourser.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-6 text-xs font-medium">
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Conditions d'Éligibilité au Retour :
              </h2>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Article retourné sous 7 jours calendaires suivant la date de réception.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Produit non utilisé, dans son emballage d'origine avec étiquettes intactes.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Non conforme à la fiche descriptive ou présentant un défaut technique avéré.</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => openTicket("Demande de retour / remboursement")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs inline-flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Signaler un Problème & Demander un Retour</span>
                </button>
              </div>
            </div>
          </div>
        );

      // 8. PAYMENTS
      case "payments":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Moyens de Paiement
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Paiements Sécurisés en FCFA
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Réglez vos achats en toute confiance avec les moyens de paiement les plus populaires en Afrique.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-medium">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">📱 T-Money (Togocom)</span>
                <p className="text-slate-500 dark:text-slate-400">Paiement direct et sécurisé via code marchand Togo. Instantané et sans frais annexes.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">📱 Moov Flooz & Mixx Yas</span>
                <p className="text-slate-500 dark:text-slate-400">Intégration directe Flooz / Moov Money pour tous les abonnés Moov Togo.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">💳 Visa & Mastercard</span>
                <p className="text-slate-500 dark:text-slate-400">Accepte les cartes bancaires locales et internationales sécurisées par 3D Secure.</p>
              </div>
            </div>
          </div>
        );

      // 9. COMMISSIONS
      case "commissions":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Commissions Vendeurs
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Tarification Transparente
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Pas d'abonnement mensuel requis. Vous ne payez que lorsque vous vendez.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-medium">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                LGF's Mall applique un barème de commission fixe selon la catégorie de produit (de 3% à 7%). La création de la boutique et l'hébergement du catalogue sont 100% gratuits.
              </p>

              <div className="pt-2">
                <button
                  onClick={onOpenVendorPortal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs inline-flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  <span>Créer ma boutique gratuitement</span>
                </button>
              </div>
            </div>
          </div>
        );

      // 10. ADS / SPONSORED
      case "ads":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Publicité Sponsorisée
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Boostez la Visibilité de Vos Produits
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Affichez vos articles en tête du catalogue et dans les bannières Flash Sales.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-medium">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Les vendeurs certifiés peuvent promouvoir leurs articles pour augmenter leurs ventes jusqu'à 3x lors des campagnes promotionnelles.
              </p>
              <button
                onClick={() => openTicket("Demande de campagne sponsorisée / Pub")}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs inline-flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Megaphone className="w-4 h-4 text-slate-950" />
                <span>Demander un emplacement sponsorisé</span>
              </button>
            </div>
          </div>
        );

      // 11. AFFILIATES
      case "affiliates":
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Programme Affiliés
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                Devenez Ambassadeur LGF's Mall
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Partagez des liens de produits et gagnez des commissions sur chaque vente réalisée.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-medium">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Notre programme d'affiliation s'adresse aux créateurs de contenu, influenceurs et créateurs numériques souhaitant monétiser leur audience.
              </p>
              <button
                onClick={() => openTicket("Rejoindre le programme Affiliation")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs inline-flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Postuler au programme d'affiliation</span>
              </button>
            </div>
          </div>
        );

      // LEGAL: TERMS, PRIVACY, COOKIES
      case "terms":
      case "privacy":
      case "cookies":
      default:
        return (
          <div className="space-y-10">
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                Mentions Légales & Réglementation
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight">
                {slug === "privacy" ? "Politique de Confidentialité" : slug === "cookies" ? "Gestion des Cookies" : "Conditions Générales d'Utilisation"}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium">
                Cadre réglementaire régissant l'utilisation de la plateforme LGF's Mall au Togo.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                LGF's Mall respecte scrupuleusement la réglementation en vigueur concernant la protection des données à caractère personnel, la transparence des transactions commerciales et la sécurisation des fonds de séquestre en partenariat avec les établissements de paiement agréés BCEAO.
              </p>
              <p>
                Pour toute question juridique ou demande relative à vos données personnelles, veuillez contacter notre délégué à la protection des données par email à <strong>lgfmall.lmdg11@gmail.com</strong>.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 animate-in fade-in duration-300">
      {renderHeader(slug.toUpperCase(), "Page d'information")}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {renderContent()}
      </main>

      <SupportTicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        user={user}
        defaultSubject={ticketSubject}
      />
    </div>
  );
}
