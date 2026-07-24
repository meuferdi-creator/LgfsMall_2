import React, { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, RefreshCw, X } from "lucide-react";

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onReturnToLogin?: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  initialEmail = "",
  onReturnToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail.trim().toLowerCase());
      setErrorMessage(null);
      setIsSuccess(false);
    }
  }, [isOpen, initialEmail]);

  // Handle countdown timer for resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmailFormat = (rawEmail: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(rawEmail);
  };

  const handleSendResetLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setErrorMessage(null);
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setErrorMessage("Veuillez saisir votre adresse email.");
      return;
    }

    if (!validateEmailFormat(cleanedEmail)) {
      setErrorMessage("Veuillez saisir une adresse email valide (ex: nom@domaine.tg).");
      return;
    }

    if (cooldown > 0) {
      setErrorMessage(`Veuillez patienter encore ${cooldown} seconde(s) avant de renvoyer le lien.`);
      return;
    }

    setIsLoading(true);

    try {
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, cleanedEmail);
        console.log("🔥 [Firebase Auth] Password reset email sent to:", cleanedEmail);
      } else {
        // Fallback simulation for iframe / local sandbox environments
        console.log("ℹ️ [Simulated Auth] Password reset email processed for:", cleanedEmail);
        await new Promise((res) => setTimeout(res, 800));
      }

      setIsSuccess(true);
      setCooldown(60); // 60 seconds cooldown for security rate limiting
    } catch (error: any) {
      console.error("❌ Error sending password reset email:", error);
      const code = error?.code || "";

      if (code === "auth/invalid-email") {
        setErrorMessage("Format d'adresse email invalide.");
      } else if (code === "auth/user-not-found") {
        // For security & email enumeration prevention, we still treat this as success or neutral
        setIsSuccess(true);
        setCooldown(60);
      } else if (code === "auth/too-many-requests") {
        setErrorMessage("Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.");
      } else if (code === "auth/network-request-failed") {
        setErrorMessage("Erreur de connexion réseau. Veuillez vérifier votre accès à Internet.");
      } else {
        setErrorMessage("Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = () => {
    onClose();
    if (onReturnToLogin) {
      onReturnToLogin();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 bg-emerald-700/60 rounded-2xl flex items-center justify-center mb-3 border border-emerald-500/30 shadow-inner">
            <KeyRound className="w-6 h-6 text-emerald-300" />
          </div>

          <h3 id="reset-modal-title" className="text-xl font-bold font-display tracking-tight">
            Réinitialisation du mot de passe
          </h3>
          <p className="text-xs text-emerald-200/90 font-medium mt-1">
            LGF's Mall — Authentification Sécurisée
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {!isSuccess ? (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Saisissez l'adresse email associée à votre compte LGF's Mall. Nous vous enverrons un lien sécurisé Firebase pour définir un nouveau mot de passe.
              </p>

              {errorMessage && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-900 p-3.5 rounded-xl flex items-start space-x-2.5 shadow-sm text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase font-bold tracking-widest text-emerald-800 mb-2 block font-mono">
                  Adresse Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-emerald-600 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@lgfmall.tg"
                    disabled={isLoading}
                    className="w-full bg-emerald-50/70 border border-emerald-100 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950 text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <span>Envoyer le lien de réinitialisation</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReturn}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion</span>
                </button>
              </div>
            </form>
          ) : (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="space-y-5 animate-fade-in text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900 font-display">
                  ✅ Un lien de réinitialisation a été envoyé !
                </h4>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 text-left space-y-2 leading-relaxed">
                  <p className="font-semibold">
                    Un email contenant les instructions a été transmis à : <strong className="font-mono text-emerald-950 underline">{email}</strong>
                  </p>
                  <p className="text-emerald-800/90 font-medium">
                    Veuillez consulter votre boîte de réception ainsi que votre dossier <strong>Courrier indésirable (Spam)</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSendResetLink}
                  disabled={isLoading || cooldown > 0}
                  className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>
                    {cooldown > 0
                      ? `Renvoyer l'email dans ${cooldown}s`
                      : "Renvoyer l'email de réinitialisation"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleReturn}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center space-x-2 text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
