import { Product } from "../types";

export const DEFAULT_CATALOG_PRODUCTS: Product[] = [
  // 1. ÉLECTRONIQUE
  {
    id: "prod-elec-1",
    title: "Smart TV 55\" 4K Ultra HD Smart HDR10+ – Dolby Audio",
    description: "Téléviseur écran 55 pouces Haute Définition 4K avec applications intégrées (Netflix, YouTube, Prime), connectivité Wi-Fi & Bluetooth, son immersif Dolby Audio.",
    price: 185000,
    wholesalePrice: 170000,
    wholesaleMinQty: 2,
    category: "Électronique",
    stock: 25,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-elec-2",
    title: "Enceinte Sans Fil Bluetooth Boombox Étanche IPX7 – Basses Puissantes",
    description: "Enceinte portable tout-terrain avec autonomie 24h, son surround 360°, résistance totale à l'eau IPX7 et fonction recharge de téléphone.",
    price: 32000,
    wholesalePrice: 28000,
    wholesaleMinQty: 4,
    category: "Électronique",
    stock: 60,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 2. TÉLÉPHONES
  {
    id: "prod-tel-1",
    title: "Smartphone Tecno Camon 30 Pro 5G – 256Go / 12Go RAM",
    description: "Appareil photo 50MP Sony OIS, écran AMOLED 144Hz, charge ultra-rapide 70W et processeur ultra-fluide pour le jeu et le multitâche.",
    price: 195000,
    wholesalePrice: 185000,
    wholesaleMinQty: 3,
    category: "Téléphones",
    stock: 40,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-tel-2",
    title: "iPhone 15 Pro 128Go Titane Naturel – Garantie 1 An Apple",
    description: "Puce A17 Pro révolutionnaire, châssis en titane ultra-léger, port USB-C et capteur photo principal 48MP.",
    price: 680000,
    wholesalePrice: 650000,
    wholesaleMinQty: 2,
    category: "Téléphones",
    stock: 15,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 3. ORDINATEURS
  {
    id: "prod-info-1",
    title: "Ordinateur Portable HP Pavilion 15\" Core i5 – 16Go RAM / 512Go SSD",
    description: "Écran Full HD antireflet, clavier rétroéclairé avec pavé numérique, autonomie jusqu'à 9 heures. Parfait pour le travail, les études et la bureautique.",
    price: 345000,
    wholesalePrice: 320000,
    wholesaleMinQty: 2,
    category: "Ordinateurs",
    stock: 20,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 4. MAISON & CUISINE / DÉCORATION (Produits originaux LGF)
  {
    id: "prod-maison-1",
    title: "Rideaux Haute Qualité (La Paire) – Design Élégant",
    description: "Habillez vos fenêtres avec élégance grâce à nos rideaux de haute qualité. Tissu résistant, finitions soignées et tombé impeccable pour sublimer votre intérieur.",
    price: 3500,
    wholesalePrice: 3000,
    wholesaleMinQty: 6,
    category: "Maison & Cuisine",
    stock: 100,
    vendorId: "official-boutique",
    image: "https://i.ibb.co/DjFtx2F/PHOTO-2026-07-20-18-33-43-1.jpg",
    images: [
      "https://i.ibb.co/DjFtx2F/PHOTO-2026-07-20-18-33-43-1.jpg",
      "https://i.ibb.co/qFBf8Rnw/PHOTO-2026-07-20-18-33-42.jpg"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-maison-2",
    title: "Rideaux Confort (La Paire) – Excellent Rapport Qualité/Prix",
    description: "Apportez une touche de fraîcheur et de modernité à vos pièces à petit prix. Des rideaux pratiques, faciles à installer et parfaits pour le quotidien.",
    price: 6500,
    wholesalePrice: 6000,
    wholesaleMinQty: 6,
    category: "Maison & Cuisine",
    stock: 100,
    vendorId: "official-boutique",
    image: "https://i.ibb.co/WWKfZ8Lc/PHOTO-2026-07-20-18-33-32-1.jpg",
    images: [
      "https://i.ibb.co/WWKfZ8Lc/PHOTO-2026-07-20-18-33-32-1.jpg",
      "https://i.ibb.co/mPz6v1H/PHOTO-2026-07-20-18-33-32.jpg",
      "https://i.ibb.co/v6ZWhh6T/PHOTO-2026-07-20-18-33-31-1.jpg",
      "https://i.ibb.co/FdPrkw9/PHOTO-2026-07-20-18-33-31.jpg"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-maison-3",
    title: "Tapis Douillet Premium – Confort et Style",
    description: "Un tapis ultra-doux et coloré pour réchauffer l'ambiance de votre salon ou de votre chambre. Offre une excellente sensation sous les pieds et retient bien la poussière.",
    price: 15000,
    wholesalePrice: 14000,
    wholesaleMinQty: 2,
    category: "Maison & Cuisine",
    stock: 50,
    vendorId: "official-boutique",
    image: "https://i.ibb.co/7dxKGgWg/PHOTO-2026-07-20-18-33-51.jpg",
    images: [
      "https://i.ibb.co/7dxKGgWg/PHOTO-2026-07-20-18-33-51.jpg",
      "https://i.ibb.co/sd06NSgy/PHOTO-2026-07-20-18-33-52-2.jpg",
      "https://i.ibb.co/pvZnrxVX/PHOTO-2026-07-20-18-33-52-1.jpg",
      "https://i.ibb.co/fYKVgdDZ/PHOTO-2026-07-20-18-33-52.jpg"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 5. BEAUTÉ & SANTÉ
  {
    id: "prod-beaute-1",
    title: "Masque de Visage Hydratant – Éclat et Fraîcheur",
    description: "Offrez un moment de pure détente à votre peau. Ce masque purifie, hydrate en profondeur et redonne instantanément de l'éclat à votre teint.",
    price: 300,
    wholesalePrice: 200,
    wholesaleMinQty: 12,
    category: "Beauté & Santé",
    stock: 500,
    vendorId: "official-boutique",
    image: "https://i.ibb.co/VcS5WL5b/PHOTO-2026-07-20-18-33-53-2.jpg",
    images: [
      "https://i.ibb.co/VcS5WL5b/PHOTO-2026-07-20-18-33-53-2.jpg",
      "https://i.ibb.co/JRCyHBz1/PHOTO-2026-07-20-18-33-53-1.jpg",
      "https://i.ibb.co/fdz8HbWX/PHOTO-2026-07-20-18-33-53.jpg"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-beaute-2",
    title: "Beurre de Karité Pur Bio du Togo (Pot 500g) – 100% Naturel",
    description: "Beurre de karité artisanal brut et non raffiné, extrait traditionnellement à Kpalimé. Nourrit intensément la peau et fortifie les cheveux.",
    price: 3500,
    wholesalePrice: 2800,
    wholesaleMinQty: 5,
    category: "Beauté & Santé",
    stock: 120,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 6. MODE HOMME
  {
    id: "prod-mode-h-1",
    title: "Chemise Manches Longues Lin Casual – Coupe Ajustée",
    description: "Tissu 100% lin respirant, finitions haut de gamme, boutons nacrés. Idéale pour les climats chauds et le style décontracté chic.",
    price: 12500,
    wholesalePrice: 10500,
    wholesaleMinQty: 4,
    category: "Mode Homme",
    stock: 75,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-mode-h-2",
    title: "Chaussures Sneakers Urbaines Confort – Semelle Amortissante",
    description: "Baskets légères et aérées avec soutien plantaire ergonomique, cuir synthétique résistant et semelle antidérapante.",
    price: 18000,
    wholesalePrice: 15500,
    wholesaleMinQty: 3,
    category: "Mode Homme",
    stock: 50,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 7. MODE FEMME
  {
    id: "prod-mode-f-1",
    title: "Robe Longue Wax Africain Moderne – Motif Floral Lomé",
    description: "Véritable pagne wax hollandais cousu sur mesure, coupe évasée moderne avec ceinture assortie.",
    price: 24000,
    wholesalePrice: 20000,
    wholesaleMinQty: 3,
    category: "Mode Femme",
    stock: 45,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-mode-f-2",
    title: "Sac à Main Cuir Élégance – Bandoulière Ajustable",
    description: "Sac à main chic avec multiples compartiments intérieurs, fermeture zippée sécurisée et garnitures dorées inoxydables.",
    price: 16500,
    wholesalePrice: 14000,
    wholesaleMinQty: 3,
    category: "Mode Femme",
    stock: 35,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 8. ÉPICERIE
  {
    id: "prod-epicerie-1",
    title: "Riz Parfumé Jasmin Supérieur (Sac 25kg) – Grains Longs",
    description: "Riz de qualité supérieure, parfum naturel délicat, cuisson légère et non collante. Idéal pour tous les repas de famille.",
    price: 18500,
    wholesalePrice: 17200,
    wholesaleMinQty: 5,
    category: "Épicerie",
    stock: 80,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },
  {
    id: "prod-epicerie-2",
    title: "Huile Végétale Raffinée Sans Cholestérol (Bidon 5L)",
    description: "Huile de cuisson enrichie en vitamine A & E, 100% pure et adaptée à toutes vos fritures et assaisonnements.",
    price: 7500,
    wholesalePrice: 6800,
    wholesaleMinQty: 4,
    category: "Épicerie",
    stock: 150,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 9. SPORT & LOISIRS
  {
    id: "prod-sport-1",
    title: "Kit Haltères Musculation Réglables (20kg) – Avec Mallette",
    description: "Paires d'haltères modulables en fonte chromée avec poignées ergonomiques antidérapantes et barres d'extension.",
    price: 32000,
    wholesalePrice: 28000,
    wholesaleMinQty: 2,
    category: "Sport & Loisirs",
    stock: 30,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 10. BÉBÉ & ENFANT
  {
    id: "prod-bebe-1",
    title: "Poussette Bébé Pliable Ultra-Légère – Confort & Sécurité 5 Points",
    description: "Châssis en aluminium robuste, pliage compact à une main, auvent pare-soleil UV50+ et panier de rangement spacieux.",
    price: 45000,
    wholesalePrice: 40000,
    wholesaleMinQty: 2,
    category: "Bébé & Enfant",
    stock: 25,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 11. AUTO & MOTO
  {
    id: "prod-auto-1",
    title: "Casque Moto Intégral Homologué Sécurité – Visière Anti-Rayures",
    description: "Coque aérodynamique haute résistance, système de ventilation multiple, doublure intérieure lavable et boucle micrométrique.",
    price: 26000,
    wholesalePrice: 22500,
    wholesaleMinQty: 3,
    category: "Auto & Moto",
    stock: 40,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  },

  // 12. ARTISANAT AFRICAIN
  {
    id: "prod-artisanat-1",
    title: "Statue Décorative Sculptée en Bois d'Ébène – Fait Main au Togo",
    description: "Œuvre d'art artisanale authentique taillée par les maîtres sculpteurs de Kpalimé. Finition cirée naturelle.",
    price: 28000,
    wholesalePrice: 24000,
    wholesaleMinQty: 2,
    category: "Artisanat Africain",
    stock: 20,
    vendorId: "official-boutique",
    image: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80"
    ],
    vendor: {
      id: "official-boutique",
      name: "LGF's Mall",
      email: "lgfmall.lmdg11@gmail.com",
      role: "ADMIN"
    }
  }
];
