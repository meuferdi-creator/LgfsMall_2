import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { PasswordInput } from "./PasswordInput";
import { ArrowRight, User as UserIcon, XCircle, CheckCircle2, Lock, ShoppingBag, ShieldCheck, Sparkles, AlertTriangle, RefreshCw, Copy, Check, ExternalLink, HelpCircle } from "lucide-react";
import { UserRole } from "../types";
import { translations, SupportedLanguage } from "../translations";
import { useAppStore } from "../store";
import NotificationBanner from "./NotificationBanner";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface FirebaseAuthErrorDetails {
  title: string;
  description: string;
  isOriginMismatch?: boolean;
  retryActionText?: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  isLoading: boolean;
  isGoogleAuthLoading?: boolean;
  authMode?: "login" | "register";
  onAuthModeChange?: (mode: "login" | "register") => void;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  activeFirebaseUser?: { email: string; displayName?: string | null; photoURL?: string | null } | null;
  onGoogleSignIn: (explicitData?: { role?: UserRole }) => void;
  onOpenResetPassword: () => void;
  pendingPurchase?: { productId: string; quantity: number } | null;
}

function parseFirebaseAuthError(errorMessage: string | null): FirebaseAuthErrorDetails | null {
  if (!errorMessage) return null;
  const lower = errorMessage.toLowerCase();

  if (
    lower.includes("origin-mismatch") ||
    lower.includes("origin_mismatch") ||
    lower.includes("unauthorized-domain") || 
    lower.includes("unauthorized_domain")
  ) {
    return {
      title: "Google OAuth : Erreur 400 (origin_mismatch)",
      description: "L'URL de votre application déployée n'est pas encore enregistrée dans les origines JavaScript autorisées de votre console Google Cloud / Firebase.",
      isOriginMismatch: true,
      retryActionText: "Réessayer la connexion"
    };
  }

  if (lower.includes("popup-closed-by-user") || lower.includes("popup_closed_by_user") || lower.includes("closed by user")) {
    return {
      title: "Fenêtre Google fermée",
      description: "La fenêtre de connexion Google a été fermée avant la validation. Vous pouvez relancer la connexion interactive.",
      retryActionText: "Réessayer la connexion Google"
    };
  }

  if (lower.includes("cancelled-popup-request") || lower.includes("cancelled_popup_request")) {
    return {
      title: "Demande de connexion annulée",
      description: "Une précédente fenêtre de connexion était en cours. Cliquez pour réinitialiser et retenter la connexion.",
      retryActionText: "Relancer la connexion"
    };
  }

  if (
    lower.includes("popup-blocked") || 
    lower.includes("popup_blocked") || 
    lower.includes("failed to open popup") ||
    lower.includes("blocked by the browser") ||
    lower.includes("gsi_logger")
  ) {
    return {
      title: "Fenêtre pop-up bloquée par le navigateur",
      description: "Votre navigateur ou l'environnement a bloqué la fenêtre pop-up Google. Vous pouvez autoriser les pop-ups pour ce site ou vous connecter directement avec vos identifiants ci-dessous.",
      retryActionText: "Ouvrir la connexion Google"
    };
  }

  if (
    lower.includes("configuration-not-found") ||
    lower.includes("configuration_not_found") ||
    lower.includes("operation-not-allowed")
  ) {
    return {
      title: "Connexion Google Sécurisée",
      description: "Authentifiez-vous directement avec votre compte Google en un clic.",
      retryActionText: "Se connecter avec Google"
    };
  }

  if (lower.includes("network-request-failed") || lower.includes("network_error")) {
    return {
      title: "Erreur réseau",
      description: "Vérifiez votre connexion internet et réessayez.",
      retryActionText: "Réessayer"
    };
  }

  return null;
}

export default function AuthModal({
  isOpen,
  onClose,
  lang,
  isLoading,
  isGoogleAuthLoading = false,
  authMode: controlledAuthMode,
  onAuthModeChange,
  error,
  successMessage,
  clearMessages,
  login,
  register,
  activeFirebaseUser: propActiveFirebaseUser,
  onGoogleSignIn,
  onOpenResetPassword,
  pendingPurchase
}: AuthModalProps) {
  const t = translations[lang] || translations.FR;
  const [internalAuthMode, setInternalAuthMode] = useState<"login" | "register">("login");
  const authMode = controlledAuthMode !== undefined ? controlledAuthMode : internalAuthMode;
  const setAuthMode = (mode: "login" | "register") => {
    setInternalAuthMode(mode);
    if (onAuthModeChange) onAuthModeChange(mode);
  };

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("BUYER");

  // Copy state for diagnostic URLs
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "";

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2500);
    }
  };

  // Active Firebase User session
  const [internalActiveFirebaseUser, setInternalActiveFirebaseUser] = useState<FirebaseUser | null>(null);
  const activeFirebaseUser = propActiveFirebaseUser !== undefined ? propActiveFirebaseUser : internalActiveFirebaseUser;

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setInternalActiveFirebaseUser(fbUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const ok = await login(cleanEmail, cleanPassword);
    if (ok) {
      setEmail("");
      setPassword("");
      onClose();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword.trim(),
      role: regRole
    });
    if (ok) {
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      onClose();
    }
  };

  const firebaseErrorDetails = parseFirebaseAuthError(error);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-emerald-950 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-emerald-800 shadow-2xl transition-all duration-300 ease-out data-[state=open]:slide-in-from-bottom-8 data-[state=open]:fade-in-100">
        <DialogHeader className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black font-display text-emerald-950 dark:text-white">
            {authMode === "login" ? "Connexion LGF's Mall" : "Créer un compte LGF"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-emerald-300">
            {pendingPurchase 
              ? "Veuillez vous connecter pour finaliser votre achat en Séquestre LGF."
              : "Accédez à votre espace sécurisé, vos commandes et vos soldes Mobile Money."}
          </DialogDescription>
        </DialogHeader>

        {/* Dedicated Firebase Auth Error UI */}
        {firebaseErrorDetails && (
          <div className="my-2 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2.5 text-left">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">{firebaseErrorDetails.title}</h5>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5">
                  {firebaseErrorDetails.description}
                </p>
              </div>
            </div>

            {/* If origin_mismatch / unauthorized-domain, show quick-copy buttons and guide */}
            {firebaseErrorDetails.isOriginMismatch && (
              <div className="pt-1 space-y-2 border-t border-amber-200/80 dark:border-amber-800/50">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Origine de cette version déployée :
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                    <div className="flex-1 bg-white dark:bg-emerald-950/90 border border-amber-300 dark:border-amber-700/80 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-slate-800 dark:text-amber-200 truncate select-all">
                      {currentOrigin}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentOrigin, "origin")}
                      className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 shrink-0 cursor-pointer shadow-xs transition-all"
                    >
                      {copiedItem === "origin" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier l'Origine</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfigGuide(!showConfigGuide)}
                    className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showConfigGuide ? "Masquer le guide" : "Comment enregistrer ce domaine (2 min)"}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setAuthMode("login");
                    }}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Connexion par Email ci-dessous ↓
                  </button>
                </div>

                {showConfigGuide && (
                  <div className="p-3 bg-white dark:bg-emerald-900/60 border border-amber-200 dark:border-emerald-700/60 rounded-xl space-y-2 text-[11px] text-slate-700 dark:text-emerald-200 leading-relaxed animate-in fade-in-50 duration-200">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>📌 Deux étapes simples dans Google Cloud & Firebase :</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 pl-0.5">
                      <li>
                        <strong>Console Google Cloud</strong> : Rendez-vous dans <em>APIs & Services &gt; Identifiants</em> &gt; Ouvrez votre ID client <em>OAuth 2.0 (Application Web)</em> &gt; Ajoutez <code className="px-1 py-0.5 bg-slate-100 dark:bg-emerald-950 rounded text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">{currentOrigin}</code> dans <strong>Origines JavaScript autorisées</strong> &gt; Enregistrer.
                      </li>
                      <li>
                        <strong>Console Firebase</strong> : Rendez-vous dans <em>Authentication &gt; Paramètres &gt; Domaines autorisés</em> &gt; Cliquez sur <em>Ajouter un domaine</em> avec <code className="px-1 py-0.5 bg-slate-100 dark:bg-emerald-950 rounded text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">{currentHostname}</code>.
                      </li>
                    </ol>
                    <p className="text-[10px] text-slate-500 dark:text-emerald-300 italic pt-0.5">
                      💡 Astuce : En attendant la propagation (environ 2 min), vous pouvez créer un compte ou vous connecter directement avec un email ci-dessous.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!firebaseErrorDetails.isOriginMismatch && firebaseErrorDetails.retryActionText && (
              <div className="pt-1 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    onGoogleSignIn({ role: authMode === "register" ? regRole : "BUYER" });
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{firebaseErrorDetails.retryActionText}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Global error or success messages */}
        {!firebaseErrorDetails && (
          <div className="space-y-2 my-2">
            <NotificationBanner
              message={error}
              type="error"
              onClose={clearMessages}
              autoDismissMs={8000}
            />
            <NotificationBanner
              message={successMessage}
              type="success"
              onClose={clearMessages}
              autoDismissMs={8000}
            />
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-emerald-800 my-4">
          <button
            onClick={() => { setAuthMode("login"); clearMessages(); }}
            className={`flex-1 pb-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
              authMode === "login"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Se Connecter
          </button>
          <button
            onClick={() => { setAuthMode("register"); clearMessages(); }}
            className={`flex-1 pb-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
              authMode === "register"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Créer un Compte
          </button>
        </div>

        {/* Active Firebase Session Fast Re-Authentication */}
        {activeFirebaseUser?.email && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-300 block">
              Session Google active
            </span>
            <button
              type="button"
              disabled={isLoading || isGoogleAuthLoading}
              onClick={() => onGoogleSignIn({ role: authMode === "register" ? regRole : "BUYER" })}
              className="w-full bg-white dark:bg-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-800 border border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center space-x-2.5 text-left">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[11px]">
                  {(activeFirebaseUser.displayName?.[0] || activeFirebaseUser.email[0]).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-xs">{activeFirebaseUser.email}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Continuer avec ce compte Google</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        )}

        {authMode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 dark:text-emerald-300 mb-1 block">
                Adresse Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.tg"
                className="w-full bg-slate-50 dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-700 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <PasswordInput
                label="Mot de passe"
                requiredStar
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="flex items-center justify-end text-xs mt-1">
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenResetPassword(); }}
                  className="text-emerald-600 font-bold hover:underline text-[11px]"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Se Connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-emerald-800"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 dark:text-emerald-500 font-mono font-bold uppercase">OU</span>
              <div className="flex-grow border-t border-slate-200 dark:border-emerald-800"></div>
            </div>

            <button
              type="button"
              disabled={isLoading || isGoogleAuthLoading}
              onClick={() => onGoogleSignIn({ role: "BUYER" })}
              className="w-full bg-white dark:bg-emerald-900 text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all hover:bg-slate-50 disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isGoogleAuthLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Initialisation Google OAuth...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Continuer avec Google</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 dark:text-emerald-300 mb-1 block">
                Nom Complet / Entreprise *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Koffi Mensah"
                className="w-full bg-slate-50 dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 dark:text-emerald-300 mb-1 block">
                Adresse Email *
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="nom@exemple.tg"
                className="w-full bg-slate-50 dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 dark:text-emerald-300 mb-1 block">
                Téléphone Mobile Money
              </label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full bg-slate-50 dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-700 dark:text-emerald-300 mb-1 block">
                Profil / Rôle *
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 dark:bg-emerald-900/40 border border-slate-200 dark:border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 dark:text-white cursor-pointer"
              >
                <option value="BUYER">Acheteur Client</option>
                <option value="VENDOR">Vendeur Marchand</option>
                <option value="DRIVER">Livreur / Transporteur</option>
                <option value="INVESTOR">Investisseur LGF</option>
              </select>
            </div>

            <div>
              <PasswordInput
                label="Mot de passe"
                requiredStar
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs mt-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Créer Mon Compte</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-emerald-800"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 dark:text-emerald-500 font-mono font-bold uppercase">OU</span>
              <div className="flex-grow border-t border-slate-200 dark:border-emerald-800"></div>
            </div>

            <button
              type="button"
              disabled={isLoading || isGoogleAuthLoading}
              onClick={() => onGoogleSignIn({ role: regRole })}
              className="w-full bg-white dark:bg-emerald-900 text-slate-800 dark:text-white border border-slate-200 dark:border-emerald-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all hover:bg-slate-50 disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isGoogleAuthLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Initialisation Google OAuth...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>S'inscrire avec Google</span>
                </>
              )}
            </button>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}
