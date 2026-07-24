import { translations } from "../translations";

/**
 * Development Utility: i18n Translation Audit System
 * 
 * Scans runtime dictionary coverage and detects potential unlocalized keys or missing dictionary entries.
 */

export interface I18nAuditReport {
  totalKeys: number;
  supportedLanguages: string[];
  missingKeysByLang: Record<string, string[]>;
  isComplete: boolean;
  timestamp: string;
}

/**
 * Audit existing dictionary completeness across FR, EN, EWE, and KABYE.
 */
export function auditTranslationsDictionary(): I18nAuditReport {
  const languages = Object.keys(translations) as Array<keyof typeof translations>;
  const baseKeys = Object.keys(translations.FR || {});
  const missingKeysByLang: Record<string, string[]> = {};

  languages.forEach((lang) => {
    const langKeys = new Set(Object.keys(translations[lang] || {}));
    const missing = baseKeys.filter((k) => !langKeys.has(k));
    missingKeysByLang[lang] = missing;
  });

  const isComplete = Object.values(missingKeysByLang).every((list) => list.length === 0);

  return {
    totalKeys: baseKeys.length,
    supportedLanguages: languages,
    missingKeysByLang,
    isComplete,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper scanner to inspect runtime DOM text nodes or React JSX strings in dev mode.
 * Identifies visible French/English plain strings not matching translation keys.
 */
export function scanElementForUntranslatedText(container?: HTMLElement | null): string[] {
  if (typeof window === "undefined") return [];
  const root = container || document.body;
  const untranslatedFound: string[] = [];
  const textWalk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tagName = parent.tagName.toLowerCase();
      if (["script", "style", "code", "pre", "svg", "path"].includes(tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let currentNode: Node | null;
  while ((currentNode = textWalk.nextNode())) {
    const text = currentNode.textContent?.trim() || "";
    // Check if text looks like human readable sentence (> 3 characters, contains words)
    if (text.length > 3 && /[a-zA-Zà-ÿÀ-Ÿ]/.test(text) && !/^\d+$/.test(text) && !/^(http|https|\+|\{|\}|\$)/.test(text)) {
      // Check if string matches any known translation value
      const isTranslatedValue = Object.values(translations).some((langDict) =>
        Object.values(langDict).includes(text)
      );
      if (!isTranslatedValue && !untranslatedFound.includes(text)) {
        untranslatedFound.push(text);
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.group("🌐 [i18n Audit Report]");
    console.log(`Total Keys in Dictionary: ${Object.keys(translations.FR).length}`);
    console.log(`Untranslated Candidate Strings Detected in DOM (${untranslatedFound.length}):`, untranslatedFound.slice(0, 20));
    console.groupEnd();
  }

  return untranslatedFound;
}
