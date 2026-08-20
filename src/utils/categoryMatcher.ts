/**
 * Shared category matching utility to ensure consistent filtering
 * across Header, Faceted Search, Category Grid, and Product Cards.
 */
export const isCategoryMatch = (productCategory: string | undefined | null, targetCategory: string): boolean => {
  if (!targetCategory || targetCategory === "Tous") return true;
  if (!productCategory) return false;

  const p = productCategory.toLowerCase().trim();
  const t = targetCategory.toLowerCase().trim();

  // Exact or direct inclusion match
  if (p === t || p.includes(t) || t.includes(p)) return true;

  // Maison / Cuisine / Décoration / Tapis / Rideaux
  if (
    (t.includes("maison") || t.includes("cuisine") || t.includes("déco")) &&
    (p.includes("maison") || p.includes("décoration") || p.includes("rideau") || p.includes("tapis") || p.includes("cuisine") || p.includes("meuble"))
  ) {
    return true;
  }

  // Beauté / Soins / Visage / Santé / Cosmétiques
  if (
    (t.includes("beauté") || t.includes("santé") || t.includes("soin")) &&
    (p.includes("beauté") || p.includes("santé") || p.includes("soin") || p.includes("visage") || p.includes("cosmétique") || p.includes("parfum"))
  ) {
    return true;
  }

  // Téléphones / Smartphones / Mobiles
  if (
    (t.includes("téléphone") || t.includes("mobile") || t.includes("tablette")) &&
    (p.includes("téléphone") || p.includes("mobile") || p.includes("smartphone") || p.includes("tablette") || p.includes("tecno") || p.includes("iphone") || p.includes("samsung"))
  ) {
    return true;
  }

  // Électronique / High-Tech / TV / Audio
  if (
    (t.includes("électro") || t.includes("tech")) &&
    (p.includes("électro") || p.includes("tech") || p.includes("high-tech") || p.includes("tv") || p.includes("audio") || p.includes("connect"))
  ) {
    return true;
  }

  // Ordinateurs / Informatique / PC / Laptop
  if (
    (t.includes("ordinateur") || t.includes("informatique") || t.includes("laptop")) &&
    (p.includes("ordinateur") || p.includes("informatique") || p.includes("laptop") || p.includes("pc"))
  ) {
    return true;
  }

  // Mode Homme
  if (t.includes("homme") && (p.includes("homme") || p.includes("masculin") || p.includes("mode"))) {
    return true;
  }

  // Mode Femme
  if (t.includes("femme") && (p.includes("femme") || p.includes("féminin") || p.includes("mode"))) {
    return true;
  }

  // Épicerie / Agro-Alimentaire / Vivres
  if (
    (t.includes("épicerie") || t.includes("agro") || t.includes("aliment") || t.includes("vivre")) &&
    (p.includes("épicerie") || p.includes("agro") || p.includes("aliment") || p.includes("nourriture") || p.includes("riz") || p.includes("sucre") || p.includes("huile"))
  ) {
    return true;
  }

  // Artisanat / Pagne / Traditionnel
  if (
    (t.includes("artisanat") || t.includes("togolais") || t.includes("africain")) &&
    (p.includes("artisanat") || p.includes("sculpture") || p.includes("pagne") || p.includes("fait main") || p.includes("wax") || p.includes("local"))
  ) {
    return true;
  }

  return false;
};
