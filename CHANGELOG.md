# Patch de sécurité & corrections — LGF's Mall

Ce patch corrige les problèmes identifiés lors de l'audit du code. Chaque section
est indépendante ; voir le diff (`patch.diff`) pour le détail ligne par ligne.

Le projet a été réinstallé (`npm install`), le client Prisma partiellement vérifié,
et compilé avec succès en mode `strict` de TypeScript (`npm run lint`) ainsi qu'avec
`vite build`, avant livraison.

## 🔴 Corrections critiques (sécurité)

1. **`JWT_SECRET` codé en dur supprimé.** Le serveur refuse maintenant de démarrer
   si `JWT_SECRET` n'est pas défini (≥ 32 caractères) dans l'environnement.
   Générer une valeur : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

2. **Mot de passe admin codé en dur supprimé.** `seedDatabase()` génère désormais un
   mot de passe aléatoire fort (ou utilise `ADMIN_SEED_PASSWORD` si fourni) et
   l'affiche **une seule fois** dans les logs au premier démarrage. À changer
   immédiatement après la première connexion.

3. **Faille de prise de compte via `/api/auth/verify-email` corrigée.**
   L'ancien code acceptait de vérifier n'importe quel email sans validation réelle
   du token (`if (token) { /* pas de vérification */ }`). Le flux utilise maintenant
   de vrais tokens aléatoires (32 octets), dont seul le hash SHA-256 est stocké en
   base, avec expiration (24h). Nouveaux champs Prisma : `verificationTokenHash`,
   `verificationTokenExpiry`.

4. **Nouveau flux mot de passe oublié, réel et sécurisé** :
   `POST /api/auth/forgot-password` puis `POST /api/auth/reset-password`, avec
   tokens hashés (SHA-256), expiration (1h), et réponses neutres pour éviter
   l'énumération de comptes. Nouveaux champs Prisma : `resetTokenHash`,
   `resetTokenExpiry`.
   - `PasswordResetModal.tsx` a été branché sur ce nouveau flux (au lieu de
     Firebase/Supabase Auth, où les comptes créés via `/api/auth/register`
     n'existent pas).
   - ⚠️ **Reste à faire côté UI** : une page/route qui lit `email` et `token` dans
     l'URL de reset et appelle `POST /api/auth/reset-password` avec le nouveau mot
     de passe. Le backend est prêt ; il manque l'écran de saisie du nouveau mot de
     passe (l'app n'utilise pas de routeur — à ajouter selon le pattern existant).

5. **En-têtes de sécurité + CORS + rate limiting ajoutés** sur le serveur Express :
   - `helmet()` pour les en-têtes de sécurité HTTP.
   - `cors()` restreint à `APP_URL` en production.
   - `express-rate-limit` : 20 requêtes / 15 min sur les routes d'authentification
     (`/api/auth/login`, `/register`, `/verify-email`, `/forgot-password`,
     `/reset-password`), et 120 requêtes/min sur `/api/*` en général.

## 🟠 Corrections importantes (bugs fonctionnels)

6. **Bug du portail chauffeur/livreur corrigé.** `DriverPortal.tsx` et une partie de
   `VendorPortal.tsx` lisaient le token sous la clé `"lgf_mall_token"` alors qu'il
   est toujours écrit sous `"lgf_token"` (`store.ts`). Toutes les lectures utilisent
   maintenant `"lgf_token"`.

7. **Retrait escrow transformé en vrai flux à deux étapes.** L'ancien code mettait
   le solde à zéro et répondait "traitement en cours par notre banque partenaire"
   sans qu'aucune intégration bancaire réelle n'existe. Désormais :
   - `POST /api/escrow/withdraw` crée une `WithdrawalRequest` (statut `PENDING`) et
     nécessite un KYC `APPROVED`.
   - `GET /api/escrow/withdrawals` : le vendeur consulte ses demandes.
   - `GET /api/admin/withdrawals/pending` : l'admin voit les demandes en attente.
   - `POST /api/admin/withdrawals/:id/resolve` : l'admin confirme (`COMPLETED`) une
     fois le virement réellement exécuté par votre partenaire bancaire/mobile money,
     ou rejette (`REJECTED`, remboursement automatique du solde).
   - Nouveau modèle Prisma `WithdrawalRequest`.

8. **`dotenv` activé.** Le package était dans les dépendances mais jamais importé :
   un fichier `.env` local n'avait donc aucun effet. `import "dotenv/config"` ajouté
   en tête de `server.ts`.

9. **Scripts npm corrigés.** `dev`/`build`/`start` forçaient
   `DATABASE_URL="file:./prisma/dev.db"` (syntaxe SQLite) alors que
   `schema.prisma` déclare `provider = "postgresql"` — ce qui casse `npm run dev`
   sans base Postgres réelle. `DATABASE_URL` doit maintenant venir de votre `.env`
   ou de l'environnement (voir `.env.example`).

10. **`@types/react` et `@types/react-dom` manquants, ajoutés.** Ils n'étaient pas
    dans `package.json` : tout le typage React (props, `Component<Props,State>`,
    JSX) tournait en mode dégradé et masquait de vraies erreurs.

11. **`tsconfig.json` : `"strict": true` activé.** A révélé et permis de corriger :
    - Une faute de frappe dans `App.tsx` : `t[`kyc${status}`]` générait la clé
      `kycAPPROVED` (majuscules) qui n'existe pas dans `translations.ts`
      (`kycApproved`), donc le badge de statut KYC s'affichait vide/`undefined`
      en production pour tout utilisateur ayant soumis un KYC.
    - Plusieurs paramètres de callback implicitement `any` (`server.ts`,
      `export_backup.ts`), maintenant explicitement typés
      (`Prisma.TransactionClient` pour les transactions).

## 🟡 Autres changements

12. **Arrondi des montants** (`Math.round`) sur le calcul du total de commande et
    du montant de retrait, pour limiter la dérive des flottants sur de l'argent
    réel en séquestre. *Ceci est un pansement, pas une vraie correction* : la
    recommandation reste de migrer les colonnes monétaires (`Float`) vers `Int`
    (centimes) ou `Decimal` — non fait ici car c'est une migration de données plus
    lourde à valider avec de vraies données de production.

13. **`AuthProvider` Supabase (mort) retiré de `main.tsx`.** Il enveloppait toute
    l'app mais `useContext(AuthContext)` n'était appelé nulle part — c'était un
    troisième système d'auth actif en arrière-plan sans être réellement utilisé.
    Source de vérité unique désormais : JWT/Prisma (`store.ts`). Firebase reste
    utilisé uniquement pour "Se connecter avec Google" (`firebase-sync`), et
    Supabase uniquement pour le stockage de fichiers (`supabaseStorage.ts`).
    `src/contexts/AuthContext.tsx` et `src/lib/supabaseClient.ts` restent dans le
    code mais ne sont plus montés par défaut.

## ⚠️ Non traité dans ce patch (recommandations pour la suite)

- **Migration `Float` → `Int`/`Decimal`** pour toutes les colonnes monétaires
  (`price`, `total`, `balance`, `pendingBalance`, `amount`...) — nécessite une
  vraie migration de données, à faire séparément avec un environnement de test.
- **Pagination** sur `GET /api/products` et `GET /api/admin/users` — non ajoutée
  car cela changerait la forme de la réponse JSON (array → objet paginé) et
  casserait le frontend actuel sans adaptation de `store.ts` et des composants qui
  consomment ces listes. À faire ensemble.
- **Page de consommation du lien "mot de passe oublié"** (voir point 4).
- **Fichiers de config Firebase/Supabase committés** (`firebase-applet-config.json`,
  clé anon Supabase) : laissés tels quels car ce sont des clés *client*, protégées
  par vos règles Firestore/Storage (vérifiées, elles ont l'air correctement
  restrictives) — ce n'est pas un risque en soi, mais évitez d'y mettre des clés
  serveur/admin à l'avenir.
- Génération réelle du client Prisma (`npx prisma generate`) et application de la
  migration (`npx prisma migrate deploy`) : à faire dans votre environnement, le
  sandbox utilisé ici n'a pas accès à `binaries.prisma.sh`.

## Comment appliquer

```bash
npm install
cp .env.example .env   # puis renseigner JWT_SECRET, DATABASE_URL, etc.
npx prisma generate
npx prisma migrate deploy
npm run dev
```
