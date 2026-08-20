import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  X, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  ShoppingBag, 
  Store, 
  Truck, 
  MessageCircle, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { useAppStore } from "../store";
import { useClickOutside } from "../hooks/useClickOutside";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  showWhatsappBtn?: boolean;
}

const FAQ_CATEGORIES = [
  {
    id: "buyer",
    label: "🛒 Visiteurs / Acheteurs",
    questions: [
      { text: "Comment passer une commande ?", category: "buyer" },
      { text: "Quels sont les modes de paiement ?", category: "buyer" }
    ]
  },
  {
    id: "vendor",
    label: "🏪 Vendeurs / Boutiques",
    questions: [
      { text: "Comment créer ma boutique ?", category: "vendor" },
      { text: "Comment fonctionnent les retraits ?", category: "vendor" }
    ]
  },
  {
    id: "driver",
    label: "🛵 Livreurs & Chauffeurs",
    questions: [
      { text: "Comment rejoindre le réseau de livraison LGF ?", category: "driver" },
      { text: "Comment valider une livraison ?", category: "driver" }
    ]
  }
];

const LOCAL_KNOWLEDGE_BASE: Record<string, string> = {
  "comment passer une commande ?": `🛒 **Comment passer une commande sur LGF's Mall :**

1. **Parcourez le catalogue** et sélectionnez les articles de votre choix.
2. **Choisissez les variantes** (couleur, taille, quantité) puis cliquez sur **"Ajouter au panier"**.
3. **Accédez au Panier** et vérifiez vos articles (vous pouvez ajouter un code promo s'il y en a un).
4. **Cliquez sur "Passer la commande"**, renseignez votre adresse de livraison à Lomé ou dans les villes du Togo (Kara, Sokodé, Atakpamé, Kpalimé, Dapaong).
5. **Choisissez votre mode de paiement** (T-Money, Flooz, Wave, Carte bancaire ou Portefeuille LGF) et validez.
6. **Suivez votre colis** en direct grâce à votre code de suivi unique !`,

  "quels sont les modes de paiement ?": `💳 **Modes de paiement acceptés sur LGF's Mall :**

- **Mobile Money Togo & Afrique :** T-Money (Togocom), Moov Flooz, Wave, Orange Money.
- **Cartes Bancaires :** Visa, Mastercard et cartes locales/internationales.
- **Portefeuille LGF :** Recharchez votre compte LGF pour payer instantanément sans frais.
- **Sécurité Escrow (Compte Séquestre) :** L'argent de votre commande est conservé en sécurité par LGF's Mall et n'est transféré au vendeur que lorsque vous recevez votre colis conforme !`,

  "comment créer ma boutique ?": `🏪 **Comment créer et certifier votre boutique Vendeur :**

1. Cliquez sur le bouton **"Ouvrir une Boutique"** ou connectez-vous et basculez vers le **Portail Vendeur**.
2. **Renseignez les détails de votre boutique** (Nom, Description, Numéro WhatsApp, Emplacement).
3. **Soumettez vos documents KYC** (Carte d'identité/Passeport ou NIF/RCCM) pour obtenir le **Badge de Vendeur Certifié**.
4. **Ajoutez vos premiers produits** avec des photos de qualité. Vous pouvez utiliser notre IA Gemini pour générer des descriptions vendeuses automatiques !`,

  "comment fonctionnent les retraits ?": `💰 **Fonctionnement des retraits de gains pour les vendeurs :**

1. Chaque vente validée après livraison crédite automatiquement votre **Portefeuille Séquestre Vendeur LGF**.
2. Allez dans l'onglet **"Portefeuille & Retraits"** de votre Espace Vendeur.
3. Saisissez le montant à retirer et sélectionnez votre méthode : **T-Money**, **Flooz** ou **Virement Bancaire**.
4. **Cliquez sur "Demander le retrait"** : Le transfert est traité immédiatement !`,

  "comment rejoindre le réseau de livraison lgf ?": `🛵 **Comment devenir Livreur Partenaire LGF's Mall :**

1. Rendez-vous sur la section **"Rejoindre le Réseau de Livraison"** ou contactez notre pôle logistique.
2. Remplissez le formulaire avec votre pièce d'identité, permis de conduire et carte grise du véhicule/moto.
3. Après validation de votre compte **Chauffeur/Livreur**, vous accédez au **Portail Livreur** pour accepter les courses à proximité de votre Hub (Lomé, Kara, etc.) et gagner des revenus garantis !`,

  "comment valider une livraison ?": `📦 **Comment valider une livraison en tant que livreur :**

1. Lorsque vous remettez le colis à l'acheteur, demandez-lui son **Code OTP à 4 chiffres** ou scannez son **QR Code de livraison**.
2. Entrez le code dans votre **Portail Livreur**.
3. La commande passe immédiatement au statut **"Livrée"**, ce qui débloque automatiquement les fonds du compte séquestre pour le vendeur et crédite votre commission de livraison !`
};

export default function GeminiAssistantWidget() {
  const { cart, lang } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text: "Bonjour 👋 Je suis l'assistant virtuel de LGF's Mall. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const cartCount = (cart || []).reduce((acc, item) => acc + item.quantity, 0);

  useClickOutside(widgetRef, () => setIsOpen(false), isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customQuery) setInputText("");
    setIsLoading(true);

    const lowerQuery = query.toLowerCase();
    const matchedLocalAnswer = LOCAL_KNOWLEDGE_BASE[lowerQuery];

    try {
      // Call server Gemini API
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
          lang
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: "assistant",
            text: data.response,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            showWhatsappBtn: true
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to local KB if server or Gemini is unavailable
      const fallbackText = matchedLocalAnswer || 
        `Merci pour votre question ! ${query.includes("vendeur") || query.includes("boutique") ? "Pour les vendeurs, vous pouvez créer votre boutique et soumettre votre KYC sur l'espace vendeur." : "LGF's Mall est le marché numéro 1 au Togo avec livraison rapide à Lomé et dans toutes les régions."}\n\nPour une assistance personnalisée immédiate avec un conseiller humain, n'hésitez pas à nous contacter directement sur WhatsApp.`;

      const fallbackMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        showWhatsappBtn: true
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } catch (err) {
      console.warn("Assistant AI fetch error, using fallback response:", err);
      const fallbackMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: matchedLocalAnswer || "Nous avons bien reçu votre demande. Notre assistant AI reste disponible. Si vous souhaitez une réponse immédiate d'un conseiller, cliquez ci-dessous pour nous écrire sur WhatsApp.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        showWhatsappBtn: true
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        text: "Discussion réinitialisée ✨ Comment puis-je vous aider aujourd'hui sur LGF's Mall ?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const whatsappUrl = "https://wa.me/22872998148?text=Bonjour,%20j'ai%20une%20question%20concernant%20LGF's%20Mall";

  return (
    <>
      {/* Floating Trigger Button */}
      <div 
        className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-auto transition-all duration-300"
        id="lgf-ai-assistant-trigger"
      >
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30 hover:ring-4 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
            title="Besoin d'aide ? Discutez avec notre IA !"
            aria-label="Ouvrir l'assistant virtuel AI LGF Mall"
          >
            {/* Sparkle icon with subtle glow pulse */}
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-5.5 sm:h-5.5 animate-pulse text-amber-300" />
              <Bot className="w-3 h-3 text-white absolute -bottom-1 -right-1" />
            </div>

            {/* Unread badge indicator */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}

            {/* Desktop Hover Tooltip */}
            <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center space-x-2 bg-slate-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-right-2 duration-200">
              <span>Besoin d'aide ? Discutez avec notre IA !</span>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div 
          ref={widgetRef}
          className="fixed inset-x-3 bottom-20 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[380px] max-w-[calc(100vw-24px)] h-[490px] max-h-[72vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col z-40 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
          id="lgf-ai-assistant-drawer"
        >
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 border-b border-emerald-500/30 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 font-bold border border-emerald-400/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full absolute -bottom-0.5 -right-0.5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight flex items-center space-x-1.5">
                  <span>Assistant LGF's Mall</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                  <span>En ligne • Propulsé par Gemini</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Effacer la conversation"
                aria-label="Effacer la conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Fermer"
                aria-label="Fermer la fenêtre de chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-emerald-500/20 bg-slate-50/50 dark:bg-slate-900/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1`}
              >
                <div className="flex items-end space-x-2">
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-line shadow-sm ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-none font-medium"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/90 dark:border-slate-700/70"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 px-1 font-mono">
                  {msg.timestamp}
                </span>

                {/* Embedded WhatsApp Button under AI responses */}
                {msg.role === "assistant" && msg.showWhatsappBtn && (
                  <div className="pl-9 pt-1 w-full max-w-[90%]">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-xl text-[11px] transition-all group"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Parler à un conseiller sur WhatsApp 🟢</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                )}
              </div>
            ))}

            {/* Quick Interactive FAQ Chips */}
            {messages.length <= 2 && !isLoading && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Questions Fréquentes Rapides</span>
                </div>

                <div className="space-y-2.5">
                  {FAQ_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-1.5">
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        {cat.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.questions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q.text)}
                            className="text-left text-[11px] bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-medium shadow-2xs flex items-center space-x-1 group"
                          >
                            <span>{q.text}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Thinking Indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs p-2">
                <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold animate-spin">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium animate-pulse">L'assistant Gemini réfléchit...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Direct Contact Callout Banner */}
          <div className="px-3 py-2 bg-emerald-500/10 border-t border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[11px] font-extrabold text-emerald-950 dark:text-emerald-300">
                Service Client WhatsApp 24/7
              </span>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 shadow-sm"
            >
              <span>Contacter 🟢</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Posez votre question sur LGF's Mall..."
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl p-2.5 disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center"
              aria-label="Envoyer le message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
