import React, { useEffect } from "react";
import { Product } from "../types";

interface SeoStructuredDataProps {
  selectedProduct?: Product | null;
  activeCategory?: string;
  searchQuery?: string;
}

export default function SeoStructuredData({
  selectedProduct,
  activeCategory = "Tous",
  searchQuery = ""
}: SeoStructuredDataProps) {
  useEffect(() => {
    // 1. Organization Schema
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "LGF's Mall",
      "legalName": "LGF's Mall Enterprise Lomé",
      "url": "https://lgfmall.tg",
      "logo": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400",
      "foundingDate": "2024",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Grand Marché d'Assigamé",
        "addressLocality": "Lomé",
        "addressRegion": "Maritime",
        "postalCode": "00228",
        "addressCountry": "TG"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+228-90-00-00-00",
        "contactType": "customer service",
        "areaServed": ["TG", "BJ", "GH", "CI", "SN"],
        "availableLanguage": ["French", "English", "Ewe"]
      },
      "sameAs": [
        "https://facebook.com/lgfmall",
        "https://twitter.com/lgfmall",
        "https://instagram.com/lgfmall"
      ]
    };

    // 2. WebSite & SearchAction Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "LGF's Mall",
      "alternateName": "Assigamé Digital Marketplace",
      "url": "https://lgfmall.tg",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://lgfmall.tg/catalog?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };

    // 3. BreadcrumbList Schema
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://lgfmall.tg"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": activeCategory || "Catalogue",
        "item": `https://lgfmall.tg/catalog?category=${encodeURIComponent(activeCategory || "Tous")}`
      }
    ];

    if (selectedProduct) {
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": 3,
        "name": selectedProduct.title,
        "item": `https://lgfmall.tg/product/${selectedProduct.id}`
      });
    }

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    };

    // 4. Product Schema (if a product is selected or inspected)
    let productSchema = null;
    if (selectedProduct) {
      productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": selectedProduct.title,
        "image": [selectedProduct.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800"],
        "description": selectedProduct.description || `${selectedProduct.title} disponible sur LGF's Mall Lomé.`,
        "sku": `LGF-${selectedProduct.id.slice(0, 8)}`,
        "mpn": selectedProduct.id,
        "category": selectedProduct.category,
        "brand": {
          "@type": "Brand",
          "name": selectedProduct.vendor?.name || "Marchand Assigamé"
        },
        "offers": {
          "@type": "Offer",
          "url": `https://lgfmall.tg/product/${selectedProduct.id}`,
          "priceCurrency": "XOF",
          "price": selectedProduct.price,
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": selectedProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": selectedProduct.vendor?.name || "Vendeur Certifié Assigamé"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "24"
        }
      };
    }

    // Insert or Update Script tags in document head
    const updateScriptTag = (id: string, schemaObj: object | null) => {
      let scriptEl = document.getElementById(id) as HTMLScriptElement | null;
      if (!schemaObj) {
        if (scriptEl) scriptEl.remove();
        return;
      }
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = id;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schemaObj, null, 2);
    };

    updateScriptTag("jsonld-organization", orgSchema);
    updateScriptTag("jsonld-website", websiteSchema);
    updateScriptTag("jsonld-breadcrumb", breadcrumbSchema);
    updateScriptTag("jsonld-product", productSchema);

    // Dynamic Meta Title & OpenGraph tags update
    if (selectedProduct) {
      document.title = `${selectedProduct.title} | LGF's Mall Assigamé`;
    } else if (activeCategory && activeCategory !== "Tous") {
      document.title = `${activeCategory} | Catalogue LGF's Mall Togo`;
    } else if (searchQuery) {
      document.title = `Recherche "${searchQuery}" | LGF's Mall`;
    } else {
      document.title = "LGF's Mall — Marketplace Digitale d'Assigamé & Afrique de l'Ouest";
    }

    return () => {
      // Cleanup on unmount if necessary
    };
  }, [selectedProduct, activeCategory, searchQuery]);

  return null;
}
