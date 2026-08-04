import React from "react";
import { 
  Truck, 
  ShieldCheck, 
  Headphones, 
  RotateCcw, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag,
  Send,
  Apple,
  Play
} from "lucide-react";

interface LgfFooterProps {
  theme?: "light" | "dark";
  onOpenVendorPortal?: () => void;
  onOpenTrackOrders?: () => void;
}

export default function LgfFooter({
  theme = "light",
  onOpenVendorPortal,
  onOpenTrackOrders
}: LgfFooterProps) {
  const isDark = theme === "dark";

  return (
    <footer className={`w-full transition-colors duration-200 ${
      isDark ? "bg-emerald-950 text-slate-200 border-t border-emerald-900" : "bg-white text-slate-700 border-t border-slate-200/80"
    }`}>
      {/* TRUST BADGES ROW (MATCHES SCREENSHOT) */}
      <div className={`border-b ${isDark ? "border-emerald-900/60 bg-emerald-900/20" : "border-slate-200/80 bg-white"} py-6`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="flex items-center space-x-3.5 p-1">
              <div className="w-11 h-11 rounded-full bg-amber-100/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Livraison rapide</h4>
                <p className="text-[11px] text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">Partout au Togo & Afrique</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-1">
              <div className="w-11 h-11 rounded-full bg-amber-100/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Paiement sécurisé</h4>
                <p className="text-[11px] text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">Mobile Money & cartes</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-1">
              <div className="w-11 h-11 rounded-full bg-amber-100/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Support 7j/7</h4>
                <p className="text-[11px] text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">Chat, WhatsApp, téléphone</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-1">
              <div className="w-11 h-11 rounded-full bg-amber-100/80 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Retours faciles</h4>
                <p className="text-[11px] text-slate-500 dark:text-emerald-200/90 font-medium mt-0.5">Sous 7 jours</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MAIN FOOTER LINKS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                   {/* BRAND COLUMN */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-emerald-700 rounded-full flex items-center justify-center text-white shadow-xs font-black text-lg">
                  L
                </div>
                <div>
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight font-display">
                    LGF<span className="text-amber-500">'s</span> Mall
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-700 dark:text-amber-400 uppercase tracking-widest block leading-none font-mono mt-0.5">
                    LE MARCHÉ AFRICAIN
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-emerald-100/90 leading-relaxed font-medium">
                La marketplace moderne africaine. Achetez, vendez et livrez partout, dès aujourd'hui à Togo et bientôt dans toute l'Afrique de l'Ouest.
              </p>

              <div className="space-y-2 text-xs text-slate-700 dark:text-emerald-100 font-medium">
                <p className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Boulevard du Mono, Lomé, Togo</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <a href="tel:+22896979976" className="hover:text-emerald-700 dark:hover:text-amber-300 font-semibold">+228 96 97 99 76</a>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <a href="mailto:lgfmall.lmd11@gmail.com" className="hover:text-emerald-700 dark:hover:text-amber-300 font-semibold">lgfmall.lmd11@gmail.com</a>
                </p>
              </div>

              {/* Social icons */}
              <div className="flex items-center space-x-2 pt-1">
                {["facebook", "twitter", "instagram", "youtube"].map((social) => (
                  <button
                    key={social}
                    type="button"
                    className="w-7 h-7 rounded-full bg-slate-50 dark:bg-emerald-900/80 text-slate-600 dark:text-emerald-100 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center text-[10px] cursor-pointer border border-slate-200 dark:border-emerald-700"
                    title={social}
                  >
                    {social[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* COL 2: À PROPOS */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-amber-300 uppercase tracking-wider font-mono">À propos</h5>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-emerald-100/90 font-medium">
                <li><a href="#about" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Qui sommes-nous</a></li>
                <li><a href="#careers" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Carrières</a></li>
                <li><a href="#blog" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Blog</a></li>
                <li><a href="#press" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Presse</a></li>
                <li><a href="#sustainability" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Durabilité</a></li>
              </ul>
            </div>

            {/* COL 3: AIDE */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-amber-300 uppercase tracking-wider font-mono">Aide</h5>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-emerald-100/90 font-medium">
                <li><a href="#help" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Centre d'aide</a></li>
                <li><button type="button" onClick={onOpenTrackOrders} className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors cursor-pointer text-left">Suivre ma commande</button></li>
                <li><a href="#shipping" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Livraison</a></li>
                <li><a href="#returns" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Retours & remboursements</a></li>
                <li><a href="#faq" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* COL 4: VENDRE */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-amber-300 uppercase tracking-wider font-mono">Vendre</h5>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-emerald-100/90 font-medium">
                <li><button type="button" onClick={onOpenVendorPortal} className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors cursor-pointer text-left">Devenir vendeur</button></li>
                <li><button type="button" onClick={onOpenVendorPortal} className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors cursor-pointer text-left">Espace vendeur</button></li>
                <li><a href="#commissions" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Commissions</a></li>
                <li><a href="#ads" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Publicité sponsorisée</a></li>
                <li><a href="#affiliates" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">Programme affiliés</a></li>
              </ul>
            </div>

            {/* COL 5: PAIEMENTS */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-amber-300 uppercase tracking-wider font-mono">Paiements</h5>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-emerald-100/90 font-medium">
                <li><span>Moov Money</span></li>
                <li><span>Mixx by Yas</span></li>
                <li><span>MTN MoMo</span></li>
                <li><span>Visa / Mastercard</span></li>
                <li><span>PayPal & Stripe</span></li>
              </ul>
            </div>

          </div>

          {/* NEWSLETTER & APP BAR */}
          <div className={`mt-12 pt-8 border-t ${isDark ? "border-emerald-900" : "border-slate-200/80"} grid grid-cols-1 md:grid-cols-12 gap-6 items-center`}>
            
            <div className="md:col-span-7 space-y-2">
              <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">Recevez nos meilleures offres</h5>
              <p className="text-xs text-slate-500 dark:text-emerald-200 font-medium">Inscrivez-vous et obtenez -10% sur votre première commande.</p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Merci pour votre inscription à la newsletter LGF's Mall !"); }} className="flex gap-2 max-w-md pt-1">
                <input 
                  type="email" 
                  placeholder="Votre adresse email" 
                  required
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium ${
                    isDark ? "bg-emerald-900/80 border-emerald-700 text-white placeholder-emerald-300/70" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-2xs"
                  }`}
                />
                <button 
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>S'inscrire</span>
                </button>
              </form>
            </div>

            <div className="md:col-span-5 flex flex-col md:items-end space-y-2">
              <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">Téléchargez l'app</h5>
              <p className="text-xs text-slate-500 dark:text-emerald-200 font-medium">LGF's Mall dans votre poche.</p>
              <div className="flex items-center space-x-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => alert("L'application iOS sera disponible très prochainement sur l'App Store.")}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-2xl text-[10px] flex items-center space-x-2 border border-slate-200 dark:border-emerald-700 shadow-2xs cursor-pointer"
                >
                  <Apple className="w-4 h-4 text-slate-900 dark:text-white shrink-0 fill-slate-900 dark:fill-white" />
                  <div className="text-left leading-tight">
                    <span className="text-[8px] text-slate-400 dark:text-emerald-300 uppercase block font-medium">Télécharger sur</span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">App Store</span>
                  </div>
                </button>
                <button 
                  type="button" 
                  onClick={() => alert("L'application Android APK / Google Play Store sera disponible incessamment.")}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-2xl text-[10px] flex items-center space-x-2 border border-slate-200 dark:border-emerald-700 shadow-2xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 fill-slate-900 dark:fill-white" />
                  <div className="text-left leading-tight">
                    <span className="text-[8px] text-slate-400 dark:text-emerald-300 uppercase block font-medium">Disponible sur</span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">Google Play</span>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* COPYRIGHT & LEGAL LINKS */}
          <div className={`mt-8 pt-6 border-t ${isDark ? "border-emerald-900/60" : "border-slate-100"} flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-emerald-200 font-medium`}>
            <p>© 2026 LGF's Mall. Tous droits réservés.</p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono font-medium text-slate-600 dark:text-emerald-100">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Moov Money</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Mixx Yas</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">MTN MoMo</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Visa</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Mastercard</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">PayPal</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Stripe</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Flutterwave</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-emerald-900/80 border border-slate-200/80 dark:border-emerald-700">Paystack</span>
            </div>

            <div className="flex items-center space-x-4 font-medium">
              <a href="#terms" className="hover:underline hover:text-emerald-700 dark:hover:text-amber-300">Conditions</a>
              <a href="#privacy" className="hover:underline hover:text-emerald-700 dark:hover:text-amber-300">Confidentialité</a>
              <a href="#cookies" className="hover:underline hover:text-emerald-700 dark:hover:text-amber-300">Cookies</a>
            </div>
          </div>

        </div>
      </footer>
  );
}
