import { User, UserRole } from "../types";

export type WorkspaceAccessCheck = {
  hasAccess: boolean;
  reason?: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_CREATED";
  title?: string;
  description?: string;
  requirementHint?: string;
};

export type WorkspaceAccessGuardResult = WorkspaceAccessCheck & {
  isAllowed: boolean;
  effectiveRole: UserRole;
  redirectRole: UserRole;
};

/**
 * Checks whether the given user has authorized access to a specific workspace portal.
 * Respects strict differentiation between Authentication and Authorization.
 */
export function checkWorkspaceAccess(user: User | null, targetRole: UserRole): WorkspaceAccessCheck {
  if (!user) {
    if (targetRole === "BUYER") {
      return { hasAccess: true };
    }
    return {
      hasAccess: false,
      reason: "UNAUTHENTICATED",
      title: "Connexion requise",
      description: "Vous devez être connecté à votre compte utilisateur pour accéder à cet espace.",
      requirementHint: "Connexion requise pour accéder à cet espace"
    };
  }

  // Admin role grants global access to all areas (and administrative sandbox)
  if (user.role === "ADMIN") {
    return { hasAccess: true };
  }

  // Buyer (E-Boutique) is accessible to every registered user
  if (targetRole === "BUYER") {
    return { hasAccess: true };
  }

  // Administration is strictly reserved for users with role === 'ADMIN'
  if (targetRole === "ADMIN") {
    return {
      hasAccess: false,
      reason: "FORBIDDEN",
      title: "Accès non autorisé",
      description: "Vous n'avez pas les autorisations nécessaires pour accéder à l'espace d'Administration. Cette zone est strictement réservée aux administrateurs de la plateforme.",
      requirementHint: "Réservé exclusivement aux administrateurs de la plateforme"
    };
  }

  // Vendor Portal Access Check
  if (targetRole === "VENDOR") {
    const hasVendor = Boolean(
      user.role === "VENDOR" ||
      user.hasVendorAccount ||
      (user.escrowWallet !== null && user.escrowWallet !== undefined) ||
      (user.roles && user.roles.includes("VENDOR"))
    );

    if (hasVendor) {
      return { hasAccess: true };
    }

    return {
      hasAccess: false,
      reason: "NOT_CREATED",
      title: "Vous n'avez pas encore de compte vendeur",
      description: "Vous êtes actuellement connecté avec votre compte utilisateur, mais vous n'avez pas encore créé ou activé votre compte vendeur. Le compte vendeur vous permet de créer votre boutique, ajouter vos produits/services, gérer vos commandes et développer votre activité sur LGF's Mall.",
      requirementHint: "Nécessite l'activation d'un compte Vendeur actif"
    };
  }

  // Driver Portal Access Check
  if (targetRole === "DRIVER") {
    const hasDriver = Boolean(
      user.role === "DRIVER" ||
      user.hasDriverAccount ||
      (user.roles && user.roles.includes("DRIVER"))
    );

    if (hasDriver) {
      return { hasAccess: true };
    }

    return {
      hasAccess: false,
      reason: "NOT_CREATED",
      title: "Vous n'avez pas encore de compte chauffeur",
      description: "Le compte chauffeur vous permet d'effectuer des livraisons de colis de la marketplace, de suivre les courses en temps réel et de percevoir vos commissions de transport sécurisées.",
      requirementHint: "Nécessite l'activation d'un compte Chauffeur / Livreur"
    };
  }

  // Investor Portal Access Check
  if (targetRole === "INVESTOR") {
    const hasInvestor = Boolean(
      user.role === "INVESTOR" ||
      user.hasInvestorAccount ||
      (user.roles && user.roles.includes("INVESTOR"))
    );

    if (hasInvestor) {
      return { hasAccess: true };
    }

    return {
      hasAccess: false,
      reason: "NOT_CREATED",
      title: "Vous n'avez pas encore de compte investisseur",
      description: "L'Espace Investisseur vous permet de financer des projets d'approvisionnement et de commerce à fort impact, de suivre vos rendements et de gérer vos contrats d'investissement LGF.",
      requirementHint: "Nécessite l'activation d'un compte Investisseur LGF"
    };
  }

  return {
    hasAccess: false,
    reason: "NOT_CREATED",
    title: "Espace non activé",
    description: "Vous n'avez pas encore activé ce profil sur votre compte utilisateur.",
    requirementHint: "Nécessite l'activation de ce profil de travail"
  };
}

/**
 * Centralized Access Guard utility function.
 * Evaluates both authentication status AND role-based requirements for sensitive routes/dashboards
 * ensuring uniform enforcement across the entire application.
 */
export function guardWorkspaceAccess(
  user: User | null,
  targetRole: UserRole,
  options: { allowBuyerFallback?: boolean } = { allowBuyerFallback: true }
): WorkspaceAccessGuardResult {
  const check = checkWorkspaceAccess(user, targetRole);

  if (check.hasAccess) {
    return {
      ...check,
      isAllowed: true,
      effectiveRole: targetRole,
      redirectRole: targetRole
    };
  }

  return {
    ...check,
    isAllowed: false,
    effectiveRole: options.allowBuyerFallback ? "BUYER" : targetRole,
    redirectRole: "BUYER"
  };
}

/**
 * Helper to get user-friendly tooltip guidance for any workspace role.
 */
export function getWorkspaceTooltipText(user: User | null, role: UserRole): string {
  const check = checkWorkspaceAccess(user, role);
  if (check.hasAccess) {
    return "Espace débloqué et accessible";
  }
  return check.requirementHint || "Action requise pour accéder à cet espace";
}

