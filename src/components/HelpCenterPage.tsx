import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  HelpCircle, 
  ShoppingBag, 
  Store, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  ArrowLeft,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FileText
} from "lucide-react";
import { User as UserType } from "../types";
import SupportTicketModal from "./SupportTicketModal";

interface HelpCenterPageProps {
  user: UserType | null;
  initialCategory?: string;
  initialSearchQuery?: string;
  onNavigateHome: () => void;
  onOpenVendorPortal?: () => void;
  onOpenTrackOrders?: () => void;
}

interface FaqItem {
  id: string;
  category: "buyers" | "vendor" | "delivery" | "account" | "payments" | "returns";
  question: string;
  answer: string;
  keywords: string[];
}

const FAQ_DATA: FaqItem[] = [
  // BUYERS / VISITORS
  {
    id: "b1",
    category: "buyers",
    question: "Comment passer une commande sur LGF's Mall ?",
    answer: "Pour passer une commande :\n1. Parcourez notre catalogue ou recherchez l'article souhaité.\n2. Sélectionnez la taille, couleur ou variante et cliquez sur 'Ajouter au panier'.\n3. Ouvrez votre panier et cliquez sur 'Passer la commande'.\n4. Saisissez votre adresse de livraison au Togo (Lomé, Kara, Sokodé, Atakpamé, Kpalimé, Dapaong, etc.).\n5. Choisissez votre mode de paiement (T-Money, Flooz, Wave, Carte bancaire) et confirmez votre commande.",
    keywords: ["commande", "acheter", "panier", "etapes", "passer commande"]
  },
  {
    id: "b2",
    category: "buyers",
    question: "Comment suivre l'acheminement de mon colis ?",
    answer: "Chaque commande génère un code de suivi unique (ex: #ORD-89421). Vous pouvez cliquer sur 'Suivre ma commande' dans le menu haut ou le pied de page, puis saisir votre numéro pour voir les étapes de livraison en temps réel.",
    keywords: ["suivi", "colis", "livraison", "statut", "suivre commande", "code"]
  },
  {
    id: "b3",
    category: "buyers",
    question: "Comment annuler ou modifier une commande ?",
    answer: "Tant que le vendeur n'a pas encore expédié votre colis, vous pouvez demander l'annulation directement depuis votre espace client dans l'historique des commandes. Si le colis est déjà en cours de livraison par le chauffeur, veuillez utiliser le bouton 'Support WhatsApp' pour solliciter notre équipe.",
    keywords: ["annuler", "annulation", "modifier", "changer", "erreur"]
  },
  {
    id: "b4",
    category: "buyers",
    question: "Qu'est-ce que le système de paiement séquestre (Escrow) ?",
    answer: "LGF's Mall protège vos achats à 100%. Lorsque vous payez votre commande, vos fonds sont conservés en toute sécurité sur un compte séquestre neutre. Le vendeur ne reçoit son argent que lorsque vous réceptionnez votre colis et validez le code OTP de livraison.",
    keywords: ["escrow", "sequestre", "securite", "protection", "argent", "garantie"]
  },
  {
    id: "b5",
    category: "buyers",
    question: "Comment utiliser un code promo ou coupon de réduction ?",
    answer: "Lors de la validation de votre panier dans la fenêtre tiroir, saisissez votre code promo dans la case 'Code Promo' et cliquez sur 'Appliquer'. La réduction s'appliquera instantanément sur le montant total.",
    keywords: ["promo", "coupon", "reduction", "remise", "code"]
  },

  // SELLERS / BOUTIQUES
  {
    id: "v1",
    category: "vendor",
    question: "Comment créer ma boutique sur LGF's Mall ?",
    answer: "Ouvrir une boutique est gratuit et se fait en 2 minutes :\n1. Cliquez sur 'Devenir Vendeur' dans le menu ou pied de page.\n2. Renseignez le nom de votre boutique, votre ville et numéro WhatsApp.\n3. Soumettez une pièce d'identité (CNI ou Passeport) ou NIF/RCCM pour la vérification KYC.\n4. Dès validation, vous accédez à votre tableau de bord vendeur pour publier vos produits.",
    keywords: ["creer boutique", "vendeur", "vendre", "inscription", "kyc"]
  },
  {
    id: "v2",
    category: "vendor",
    question: "Comment fonctionnent le retrait des gains et le portefeuille vendeur ?",
    answer: "Chaque livraison validée crédite automatiquement votre portefeuille vendeur en FCFA. Vous pouvez demander un retrait instantané 24/7 vers votre compte T-Money, Flooz ou virement bancaire. Les retraits Mobile Money sont traités en moins de 15 minutes.",
    keywords: ["retrait", "portefeuille", "gains", "paiement vendeur", "solde", "t-money"]
  },
  {
    id: "v3",
    category: "vendor",
    question: "Quelles sont les commissions prélevées par LGF's Mall ?",
    answer: "La création de boutique et la publication de produits sont 100% gratuites. LGF's Mall prélève une commission fixe et transparente (entre 3% et 7% selon la catégorie) uniquement sur les ventes réussies et livrées.",
    keywords: ["commission", "frais", "pourcentage", "tarif", "cout"]
  },
  {
    id: "v4",
    category: "vendor",
    question: "Comment fonctionne la génération de description de produit par l'IA Gemini ?",
    answer: "Dans votre espace vendeur, lors de l'ajout d'un produit, cliquez sur le bouton 'Générer la description avec l'IA'. Notre intelligence artificielle Gemini analyse le titre et la catégorie de votre produit pour rédiger automatiquement une description professionnelle et optimisée.",
    keywords: ["ia", "gemini", "description", "générer", "intelligence artificielle"]
  },

  // DELIVERY PARTNERS
  {
    id: "d1",
    category: "delivery",
    question: "Comment devenir livreur / chauffeur partenaire LGF ?",
    answer: "Pour rejoindre le réseau de livraison LGF :\n1. Cliquez sur 'Réseau de Livraison' ou contactez le support chauffeur.\n2. Fournissez votre pièce d'identité, permis de conduire et carte grise.\n3. Une fois votre compte validé, vous recevrez les demandes de livraison géolocalisées sur votre portail livreur.",
    keywords: ["livreur", "chauffeur", "rejoindre", "partenaire", "moto", "voiture"]
  },
  {
    id: "d2",
    category: "delivery",
    question: "Comment valider une livraison et débloquer les fonds ?",
    answer: "À la remise du colis au client, demandez le code secret OTP à 4 chiffres présent sur le reçu du client ou scannez le QR Code de livraison. Saisissez ce code dans votre portail livreur : la commande passe au statut 'Livrée' et crédite immédiatement votre frais de course.",
    keywords: ["valider livraison", "otp", "code", "qr code", "livraison reussie"]
  },
  {
    id: "d3",
    category: "delivery",
    question: "Que faire si le client est absent ou injoignable ?",
    answer: "En cas d'injoignabilité du client, attendez 10 minutes à l'adresse indiquée et effectuez au moins 2 appels. Si le client ne répond pas, signalez 'Client Injoignable' sur le portail livreur et ramenez le colis au Hub LGF le plus proche.",
    keywords: ["client absent", "injoignable", "echec livraison", "retour hub"]
  },

  // ACCOUNT & SECURITY
  {
    id: "a1",
    category: "account",
    question: "Comment réinitialiser mon mot de passe en cas d'oubli ?",
    answer: "Sur la fenêtre de connexion, cliquez sur 'Mot de passe oublié ?'. Saisissez votre adresse email : un lien de réinitialisation sécurisé vous sera envoyé immédiatement par email.",
    keywords: ["mot de passe", "oubli", "reinitialiser", "connexion", "compte"]
  },
  {
    id: "a2",
    category: "account",
    question: "Puis-je me connecter avec mon compte Google ?",
    answer: "Oui ! Cliquez sur 'Continuer avec Google' dans la fenêtre de connexion. Votre compte LGF's Mall sera créé automatiquement et sécurisé via Google OAuth.",
    keywords: ["google", "oauth", "connexion google", "se connecter"]
  },
  {
    id: "a3",
    category: "account",
    question: "Comment mes données personnelles sont-elles protégées ?",
    answer: "LGF's Mall utilise un chiffrement SSL/TLS de niveau bancaire, la conformité RGPD/BCEAO et un stockage sécurisé avec Supabase pour protéger vos informations personnelles et bancaires.",
    keywords: ["securite", "donnees", "confidentialite", "rgpd", "bceao"]
  },

  // PAYMENTS
  {
    id: "p1",
    category: "payments",
    question: "Quels sont les moyens de paiement acceptés sur LGF's Mall ?",
    answer: "Nous acceptons :\n- Mobile Money Togo : T-Money (Togocom), Moov Flooz, Mixx by Yas.\n- Mobile Money Afrique : Wave, MTN MoMo, Orange Money.\n- Cartes bancaires : Visa, Mastercard.\n- Portefeuille virtuel LGF's Mall.",
    keywords: ["paiement", "t-money", "flooz", "wave", "visa", "mastercard", "momo"]
  },
  {
    id: "p2",
    category: "payments",
    question: "Que faire si mon paiement Mobile Money a échoué ?",
    answer: "Si le débit a échoué :\n1. Vérifiez que votre solde Mobile Money est suffisant.\n2. Assurez-vous d'avoir validé le code PIN secret sur votre téléphone dans les 60 secondes.\n3. Si le montant a été prélevé sans validation de la commande, rassurez-vous : notre système effectue un remboursement automatique sous 30 minutes ou contactez notre support WhatsApp avec le numéro de transaction.",
    keywords: ["echec paiement", "probleme paiement", "t-money echoue", "flooz echoue"]
  },

  // RETURNS & REFUNDS
  {
    id: "r1",
    category: "returns",
    question: "Quelle est la politique de retour et remboursement ?",
    answer: "Vous disposez de 7 jours après la réception de votre colis pour demander un retour si le produit est défectueux, non conforme à la description ou endommagé. Les remboursements sont effectués sous 24h à 48h sur votre compte Mobile Money ou Portefeuille LGF.",
    keywords: ["retour", "remboursement", "politique", "7 jours", "echange"]
  },
  {
    id: "r2",
    category: "returns",
    question: "Comment engager une procédure de retour d'article ?",
    answer: "Rendez-vous dans l'historique de vos commandes, sélectionnez la commande concernée et cliquez sur 'Signaler un problème / Demander un retour'. Vous pourrez joindre une photo du défaut. Notre équipe d'arbitrage traite votre demande sous 24h.",
    keywords: ["procedure retour", "demander retour", "defaut", "casse"]
  }
];

const CATEGORY_TABS = [
  { id: "all", label: "Toutes les catégories", icon: HelpCircle },
  { id: "buyers", label: "🛒 Acheteurs", icon: ShoppingBag },
  { id: "vendor", label: "🏪 Vendeurs", icon: Store },
  { id: "delivery", label: "🛵 Livreurs", icon: Truck },
  { id: "account", label: "🔐 Compte & Sécurité", icon: ShieldCheck },
  { id: "payments", label: "💳 Paiements", icon: CreditCard },
  { id: "returns", label: "🔄 Retours & Remboursements", icon: RotateCcw }
];

export default function HelpCenterPage({
  user,
  initialCategory = "all",
  initialSearchQuery = "",
  onNavigateHome,
  onOpenVendorPortal,
  onOpenTrackOrders
}: HelpCenterPageProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [openFaqId, setOpenFaqId] = useState<string | null>("b1");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketModalSubject, setTicketModalSubject] = useState("Problème de commande");

  useEffect(() => {
    if (initialCategory) setActiveCategory(initialCategory);
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialCategory, initialSearchQuery]);

  // Filter FAQ items dynamically by search query & active category
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      // Category match
      const categoryMatch = activeCategory === "all" || item.category === activeCategory;

      // Query match
      if (!searchQuery.trim()) return categoryMatch;

      const q = searchQuery.toLowerCase().trim();
      const textToSearch = `${item.question} ${item.answer} ${item.keywords.join(" ")}`.toLowerCase();
      
      // Simple accent normalization for French
      const normalizedQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedText = textToSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return categoryMatch && (textToSearch.includes(q) || normalizedText.includes(normalizedQ));
    });
  }, [activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleOpenTicketForCategory = (catLabel: string) => {
    setTicketModalSubject(`Demande d'aide (${catLabel})`);
    setIsTicketModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center space-x-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Retour à la marketplace LGF's Mall</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
              Centre d'Aide officiel
            </span>
          </div>
        </div>
      </div>

      {/* HELP CENTER HERO SECTION */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-mono font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Assistance Client LGF's Mall</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
            Comment pouvons-nous vous aider ?
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Trouvez rapidement des réponses claires sur vos commandes, paiements T-Money/Flooz, livraisons, retraits vendeurs ou créez un ticket direct.
          </p>

          {/* DEDICATED HELP CENTER INTERNAL SEARCH BAR (DOES NOT TOUCH MAIN HEADER) */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative group">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une réponse (ex: paiement, livraison, commande, vendeur...)"
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium pl-12 pr-10 py-4 rounded-2xl border-2 border-emerald-500/30 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-xl transition-all"
                id="help-center-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        
        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* QUICK ACCESS ACTION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={onOpenTrackOrders}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Suivre une commande
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Consultez le statut de livraison avec votre code #ORD.
              </p>
            </div>
          </div>

          <div 
            onClick={onOpenVendorPortal}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Espace Vendeur & Boutique
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Inscrivez-vous et gérez vos retraits de gains 1-clic.
              </p>
            </div>
          </div>

          <div 
            onClick={() => {
              setTicketModalSubject("Question sur la plateforme LGF");
              setIsTicketModalOpen(true);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Contacter le Support 🟢
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Générez un ticket direct vers WhatsApp (+228 72 99 81 48).
              </p>
            </div>
          </div>
        </div>

        {/* FAQ ACCORDION LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Foire Aux Questions ({filteredFaqs.length})</span>
            </h3>

            {searchQuery && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
                Résultats pour "{searchQuery}"
              </span>
            )}
          </div>

          {filteredFaqs.length > 0 ? (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between space-x-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {faq.question}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-5 pt-1 sm:px-5 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-200">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cette réponse vous a-t-elle aidé ?</span>
                          <button
                            onClick={() => {
                              setTicketModalSubject(`Question complémentaire : ${faq.question}`);
                              setIsTicketModalOpen(true);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center space-x-1"
                          >
                            <span>Besoin d'aide supplémentaire ? Ticket WhatsApp</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* NO RESULTS ESCALATION BOX */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
                <HelpCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Aucun résultat trouvé pour "{searchQuery}"
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Si vous avez consulté notre Centre d'Aide et avez toujours besoin d'assistance, notre équipe support est à votre disposition pour traiter directement votre demande sur WhatsApp.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setTicketModalSubject(`Question non trouvée : ${searchQuery}`);
                    setIsTicketModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs inline-flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>🟢 Créer un Ticket Support sur WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ALWAYS-PRESENT BOTTOM SUPPORT BANNER */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800/50">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-lg font-black font-display text-white">
              Vous n'avez pas trouvé votre réponse ?
            </h4>
            <p className="text-xs text-emerald-200 font-medium max-w-xl">
              Notre équipe d'assistance client est disponible 7j/7 pour traiter vos commandes, litiges et paiements directement sur WhatsApp.
            </p>
          </div>

          <button
            onClick={() => {
              setTicketModalSubject("Assistance générale WhatsApp");
              setIsTicketModalOpen(true);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs shrink-0 shadow-md transition-all cursor-pointer flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span>Créer un Ticket WhatsApp 🟢</span>
          </button>
        </div>

      </main>

      {/* SUPPORT TICKET MODAL */}
      <SupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        user={user}
        defaultSubject={ticketModalSubject}
        defaultDetails={searchQuery ? `Recherche effectuée : ${searchQuery}` : ""}
      />
    </div>
  );
}
