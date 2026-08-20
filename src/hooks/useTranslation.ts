import { useAppStore } from "../store";
import { translations, SupportedLanguage } from "../translations";

export function useTranslation() {
  const lang = useAppStore((state) => state.lang) as SupportedLanguage || "FR";
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = translations[lang] || translations.FR;

  return {
    lang,
    setLanguage,
    t,
  };
}

export default useTranslation;
