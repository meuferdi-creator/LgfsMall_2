import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  User, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { User as UserType } from "../types";

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  defaultRole?: string;
  defaultSubject?: string;
  defaultDetails?: string;
  defaultOrderNumber?: string;
}

export default function SupportTicketModal({
  isOpen,
  onClose,
  user,
  defaultRole = "Acheteur",
  defaultSubject = "Problème de commande",
  defaultDetails = "",
  defaultOrderNumber = ""
}: SupportTicketModalProps) {
  const [role, setRole] = useState(defaultRole);
  const [subject, setSubject] = useState(defaultSubject);
  const [details, setDetails] = useState(defaultDetails);
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState<{
    ticketId: string;
    messageText: string;
    whatsappUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (user?.role) {
        if (user.role === "VENDOR") setRole("Vendeur");
        else if (user.role === "DRIVER") setRole("Livreur");
        else setRole("Acheteur");
      } else {
        setRole(defaultRole || "Acheteur");
      }
      setSubject(defaultSubject || "Problème de commande");
      setDetails(defaultDetails || "");
      setOrderNumber(defaultOrderNumber || "");
      setTicketData(null);
      setErrorMessage("");
      setCopied(false);
    }
  }, [isOpen, user, defaultRole, defaultSubject, defaultDetails, defaultOrderNumber]);

  if (!isOpen) return null;

  // Generate unique ticket ID: #LGF-XXXXX (5 random numbers/uppercase letters)
  const generateTicketId = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomCode = "";
    for (let i = 0; i < 5; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#LGF-${randomCode}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!details.trim()) {
      setErrorMessage("Veuillez décrire votre problème de façon détaillée.");
      return;
    }

    if (details.trim().length < 10) {
      setErrorMessage("Veuillez saisir au moins 10 caractères pour nous expliquer votre problème.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketId = generateTicketId();
      const userName = user ? (user.name || user.email) : "Invité";
      const timestamp = new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      let fullDetailsText = details.trim();
      if (orderNumber.trim()) {
        fullDetailsText += `\n• N° Commande associée : ${orderNumber.trim()}`;
      }

      // Exact structure requested
      const messageText = `🎫 NOUVEAU TICKET SUPPORT LGF'S MALL
──────────────────────────────
• N° Ticket : ${ticketId}
• Rôle : ${role}
• Utilisateur : ${userName}
• Sujet : ${subject}
• Détails / N° Commande : ${fullDetailsText}
• Date/Heure : ${timestamp}
──────────────────────────────
Bonjour l'équipe support LGF's Mall, j'ai besoin d'assistance pour ce problème.`;

      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/22872998148?text=${encodedMessage}`;

      setTicketData({
        ticketId,
        messageText,
        whatsappUrl
      });

      // Attempt to open WhatsApp in new tab
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      console.error("Error generating WhatsApp support ticket:", err);
      setErrorMessage("Une erreur est survenue lors de la création du ticket. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = () => {
    if (ticketData?.messageText) {
      navigator.clipboard.writeText(ticketData.messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
        role="dialog"
        aria-labelledby="ticket-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="ticket-modal-title" className="font-extrabold text-base tracking-tight flex items-center space-x-1.5">
                <span>Ticket Support WhatsApp</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                Assistance directe LGF's Mall • Équipe dédiée
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Fermer"
            aria-label="Fermer le formulaire de ticket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {ticketData ? (
            /* SUCCESS & TICKET GENERATED VIEW */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                  Ticket {ticketData.ticketId} Créé !
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Votre message a été formaté et redirigé vers WhatsApp. Si la fenêtre ne s'est pas ouverte automatiquement, utilisez les boutons ci-dessous.
                </p>
              </div>

              {/* Message Box Preview */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Contenu du message WhatsApp :
                </label>
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                  {ticketData.messageText}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <a
                  href={ticketData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ouvrir sur WhatsApp 🟢 (+228 72 99 81 48)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{copied ? "✓ Message copié dans le presse-papier !" : "Copier le texte du ticket"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* User Identity Info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono uppercase block font-bold">
                      Demandeur
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {user ? (user.name || user.email) : "Invité (Non connecté)"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg font-mono">
                  {user ? "AUTHENTIFIÉ" : "INVITÉ"}
                </span>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Votre Rôle <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Acheteur", "Vendeur", "Livreur", "Visiteur"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                        role === r
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Sujet de la demande <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Problème de commande">📦 Problème de commande</option>
                  <option value="Problème de paiement">💳 Problème de paiement</option>
                  <option value="Suivi de livraison">🛵 Suivi de livraison</option>
                  <option value="Retour / Remboursement">🔄 Retour / Remboursement</option>
                  <option value="Retrait vendeur / Portefeuille">💰 Retrait vendeur / Portefeuille</option>
                  <option value="Création de boutique / KYC">🏪 Création de boutique / KYC</option>
                  <option value="Chauffeur / Livreur partenaire">🛵 Chauffeur / Livreur partenaire</option>
                  <option value="Problème de compte / Sécurité">🔐 Problème de compte / Sécurité</option>
                  <option value="Problème technique / Bug">🐛 Problème technique / Bug</option>
                  <option value="Autre demande">💬 Autre demande</option>
                </select>
              </div>

              {/* Optional Order Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  N° de Commande <span className="text-slate-400 font-normal">(Facultatif)</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ex: #ORD-89421 ou code de suivi"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Details Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Détails & Description du problème <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Expliquez votre situation avec précision (erreur affichée, date de commande, montant concerné, etc.)..."
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !details.trim()}
                  className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all cursor-pointer active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Création du ticket..." : "Générer le Ticket & Ouvrir WhatsApp 🟢"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
