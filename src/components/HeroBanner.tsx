import React, { useState, useEffect } from "react";
import { Tag, Phone, ShieldCheck, Truck, Smartphone, ChevronLeft, ChevronRight, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

interface HeroSlide {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  primaryBtnText: string;
  secondaryBtnText: string;
  bgImage: string;
  tags: string[];
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "tech-electronics",
    badge: "TECH & ÉLECTRONIQUE",
    badgeIcon: <Zap className="w-3.5 h-3.5 mr-1 text-emerald-300" />,
    titlePrefix: "Smartphones, TV, ordinateurs ",
    titleHighlight: "aux meilleurs prix",
    subtitle: "Samsung, Tecno, Xiaomi, iPhone reconditionné — profitez de ventes flash quotidiennes, garantie locale et livraison express à Lomé en 24h.",
    primaryBtnText: "Voir les ventes flash",
    secondaryBtnText: "Tous les téléphones",
    bgImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=70",
    tags: ["Mobile Money", "Livraison Lomé 24h", "Paiement sécurisé"]
  },
  {
    id: "fashion-textiles",
    badge: "MODE & PAGNES TOGOLAIS",
    badgeIcon: <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />,
    titlePrefix: "Collection Pagnes Wax & ",
    titleHighlight: "Créations Assigamé",
    subtitle: "Tenues traditionnelles, tissus authentiques et accessoires fabriqués au Togo. Commandez en détail ou bénéficiez de prix de gros négociés.",
    primaryBtnText: "Découvrir la Mode",
    secondaryBtnText: "Commander en Gros",
    bgImage: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=1200&q=70",
    tags: ["100% Fait au Togo", "Wholesale Discounts", "Livraison Régions"]
  },
  {
    id: "home-living",
    badge: "MAISON & ÉLECTROMÉNAGER",
    badgeIcon: <Zap className="w-3.5 h-3.5 mr-1 text-emerald-300" />,
    titlePrefix: "Équipez votre intérieur avec ",
    titleHighlight: "nos garanties locales",
    subtitle: "Réfrigérateurs, climatiseurs, cuisinières et ustensiles de cuisine. Séquestre LGF : vos fonds restent bloqués jusqu'à livraison conforme.",
    primaryBtnText: "Nos Électroménagers",
    secondaryBtnText: "Garantie 12 Mois",
    bgImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=70",
    tags: ["Paiement Escrow", "Installation Inclus", "Support +228 72 99 81 48"]
  }
];

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
  onOpenFlashDeals?: () => void;
}

export default function HeroBanner({ onSelectCategory, onOpenFlashDeals }: HeroBannerProps) {
  const { t } = useTranslation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlideIndex];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-emerald-800/50 shadow-2xl bg-slate-900 group">
      {/* Background image & Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105 group-hover:scale-100"
        style={{ backgroundImage: `url(${slide.bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/40" />

      {/* Main Slide Content */}
      <div className="relative z-10 p-6 sm:p-12 md:p-14 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between text-white">
        
        {/* Top Badge */}
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-700 text-white border border-emerald-400/30 uppercase tracking-wider shadow-md">
            {slide.badgeIcon}
            {slide.badge}
          </span>
        </div>

        {/* Center Text Block */}
        <div className="my-6 max-w-2xl space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight leading-tight text-white">
            {slide.titlePrefix}
            <span className="text-amber-400 drop-shadow-md">{slide.titleHighlight}</span>
          </h2>
          <div className="inline-block max-w-2xl bg-[#009669] dark:bg-emerald-600 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg border border-emerald-400/30">
            <p className="text-xs sm:text-sm md:text-base text-white font-semibold sm:font-bold leading-relaxed">
              {slide.subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenFlashDeals ? onOpenFlashDeals() : null}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-600/30 hover:scale-105 flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Tag className="w-4 h-4" />
              <span>{slide.primaryBtnText || t.flashDeals}</span>
            </button>
            <button
              onClick={() => onSelectCategory ? onSelectCategory("Électronique") : null}
              className="bg-white/15 hover:bg-white/25 text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border border-white/20 flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>{slide.secondaryBtnText || t.exploreMarketplace}</span>
            </button>
          </div>
        </div>

        {/* Bottom Features & Slider Controls */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Feature Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-200">
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/10">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>TMoney & Flooz</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/10">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.fastDelivery} (24h)</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.escrowProtected}</span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-2">
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentSlideIndex
                    ? "w-8 h-2 bg-amber-400"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
                title={`Diapositive ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-slate-900 transition-all border border-white/20 cursor-pointer z-20"
        title={t.back}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-slate-900 transition-all border border-white/20 cursor-pointer z-20"
        title="Suivant"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
