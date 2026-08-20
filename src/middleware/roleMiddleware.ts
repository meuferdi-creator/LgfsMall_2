/**
 * Strict Server-Side Role Middleware (RBAC)
 * Ensures backend enforces role permissions regardless of frontend state.
 */

export function requireRole(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    const userRole = (req.user.role || "").toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: `Accès refusé. Privilèges insuffisants (${allowedRoles.join(" ou ")} requis).`
      });
    }

    next();
  };
}
