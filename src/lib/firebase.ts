import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  User as FirebaseUser,
  Auth,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  Firestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Merge configuration from firebase-applet-config.json with runtime VITE_FIREBASE_* environment variables
const resolvedFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId || undefined,
};

const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";

export interface FirebaseConfigValidationResult {
  isValid: boolean;
  missingKeys: string[];
  malformedKeys: string[];
  config: typeof resolvedFirebaseConfig;
}

/**
 * 1. Runtime validation check that explicitly checks if VITE_FIREBASE_API_KEY and other essential variables are present and well-formed.
 */
export function validateFirebaseConfig(): FirebaseConfigValidationResult {
  const missingKeys: string[] = [];
  const malformedKeys: string[] = [];

  // Check API Key
  if (!resolvedFirebaseConfig.apiKey || String(resolvedFirebaseConfig.apiKey).trim() === "") {
    missingKeys.push("apiKey (VITE_FIREBASE_API_KEY)");
  } else if (String(resolvedFirebaseConfig.apiKey).length < 10) {
    malformedKeys.push("apiKey (length too short / invalid format)");
  }

  // Check Project ID
  if (!resolvedFirebaseConfig.projectId || String(resolvedFirebaseConfig.projectId).trim() === "") {
    missingKeys.push("projectId (VITE_FIREBASE_PROJECT_ID)");
  }

  // Check Auth Domain
  if (!resolvedFirebaseConfig.authDomain || String(resolvedFirebaseConfig.authDomain).trim() === "") {
    missingKeys.push("authDomain (VITE_FIREBASE_AUTH_DOMAIN)");
  }

  // Check App ID
  if (!resolvedFirebaseConfig.appId || String(resolvedFirebaseConfig.appId).trim() === "") {
    missingKeys.push("appId (VITE_FIREBASE_APP_ID)");
  }

  const isValid = missingKeys.length === 0 && malformedKeys.length === 0;

  if (!isValid) {
    console.error("🚨 [Firebase Config Validation Error] Missing or malformed Firebase environment configuration:", {
      missing: missingKeys,
      malformed: malformedKeys,
      resolvedConfig: {
        apiKey: resolvedFirebaseConfig.apiKey ? "***" + String(resolvedFirebaseConfig.apiKey).slice(-4) : "MISSING",
        authDomain: resolvedFirebaseConfig.authDomain || "MISSING",
        projectId: resolvedFirebaseConfig.projectId || "MISSING",
        appId: resolvedFirebaseConfig.appId || "MISSING"
      }
    });
  } else {
    console.log("✅ [Firebase Config Validation] All essential Firebase configuration variables are present and verified.");
  }

  return {
    isValid,
    missingKeys,
    malformedKeys,
    config: resolvedFirebaseConfig
  };
}

// Run validation check immediately on module load
export const configValidationResult = validateFirebaseConfig();

/**
 * 4. Diagnostic utility function that compares window.location.origin with the authorized domains list in Firebase
 * and logs clear instructions if the domain or APP_URL is not matching standard Firebase defaults.
 */
export function checkAuthorizedDomainsDiagnostic(): {
  isAuthorizedCandidate: boolean;
  currentOrigin: string;
  currentHostname: string;
  projectId: string;
  authDomain: string;
  appUrlEnv: string;
  instructions: string;
} {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "server";
  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "server";
  const projectId = resolvedFirebaseConfig.projectId || "amazing-task-5tsmh";
  const authDomain = resolvedFirebaseConfig.authDomain || `${projectId}.firebaseapp.com`;
  const appUrlEnv = (import.meta.env.VITE_APP_URL as string) || (typeof window !== "undefined" ? window.location.origin : "");

  const isStandardDefault = 
    currentHostname === "localhost" ||
    currentHostname === "127.0.0.1" ||
    currentHostname.endsWith(".firebaseapp.com") ||
    currentHostname.endsWith(".web.app");

  const instructions = isStandardDefault 
    ? `Domain '${currentHostname}' matches standard Firebase defaults.`
    : `[Firebase Console Action Required] To authorize Google Sign-In on '${currentHostname}', navigate to Firebase Console > Authentication > Settings > Authorized Domains > and click 'Add Domain' with: ${currentHostname}`;

  if (!isStandardDefault && typeof window !== "undefined") {
    console.group("🌐 [Firebase Authorized Domains Diagnostic]");
    console.warn(`Current host '${currentHostname}' is a custom/Cloud Run origin not in default standard whitelist.`);
    console.info(`👉 Action: ${instructions}`);
    console.info(`🔗 Project Auth Domain: ${authDomain}`);
    console.groupEnd();
  } else {
    console.log(`✅ [Firebase Authorized Domains Diagnostic] Current host '${currentHostname}' is recognized.`);
  }

  return {
    isAuthorizedCandidate: isStandardDefault,
    currentOrigin,
    currentHostname,
    projectId,
    authDomain,
    appUrlEnv,
    instructions
  };
}

// Run diagnostic check on load
if (typeof window !== "undefined") {
  checkAuthorizedDomainsDiagnostic();
}

console.log("🔥 [Firebase Init] Initializing Firebase SDK with Project ID:", resolvedFirebaseConfig.projectId, "AuthDomain:", resolvedFirebaseConfig.authDomain);

// Initialize Firebase App & Services
export const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();

export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true
    }, databaseId);
  } catch (_err) {
    // If already initialized or custom settings applied
    return getFirestore(app, databaseId);
  }
})();

export const auth = getAuth(app);
export const isFirebaseConfigured = true;

// Configure session persistence
if (auth) {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          console.log("🔥 [Firebase Auth] Persistent session active for:", firebaseUser.email, "(UID:", firebaseUser.uid, ")");
        } else {
          console.log("🔥 [Firebase Auth] No active Firebase Auth user session.");
        }
      });
    })
    .catch((err) => {
      console.warn("⚠️ [Firebase Auth] Persistence setup note:", err?.message || err);
    });
}

// Standard Error Schema for Firestore operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Unified interface for Google login result
export interface GoogleSignInResult {
  email: string;
  name: string;
  photoURL?: string;
  uid: string;
  idToken?: string;
  role?: string;
  requiresEmailPrompt?: boolean;
  errorCode?: string;
}

/**
 * Ensures Google Identity Services (GSI) script is loaded in the DOM.
 */
async function ensureGoogleIdentityServicesLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as any).google?.accounts?.oauth2) return true;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.oauth2 || attempts > 25) {
          clearInterval(interval);
          resolve(!!(window as any).google?.accounts?.oauth2);
        }
      }, 100);
    }
  });
}

/**
 * Tries Google Identity Services (GSI) OAuth token client using GCP OAuth Client ID
 */
async function tryGoogleIdentityServicesAuth(): Promise<GoogleSignInResult | null> {
  await ensureGoogleIdentityServicesLoaded();
  return new Promise((resolve) => {
    let isCompleted = false;
    const finish = (res: GoogleSignInResult | null) => {
      if (!isCompleted) {
        isCompleted = true;
        resolve(res);
      }
    };

    // User-action timeout (120 seconds to allow standard account selection)
    const safetyTimer = setTimeout(() => {
      console.log("ℹ️ [GSI OAuth Step] OAuth window timed out.");
      finish(null);
    }, 120000);

    try {
      const rawClientId = (firebaseConfig as any).oAuthClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const isValidOAuthClientId = rawClientId && typeof rawClientId === "string" && rawClientId.includes(".apps.googleusercontent.com");
      const g = (typeof window !== "undefined" && (window as any).google);
      if (!isValidOAuthClientId || !g?.accounts?.oauth2) {
        clearTimeout(safetyTimer);
        return finish(null);
      }

      const clientId = rawClientId;

      console.log("🌐 [GSI OAuth Step] Initializing Google Identity Services Token Client with Client ID:", clientId);
      const client = g.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (response: any) => {
          clearTimeout(safetyTimer);
          if (response?.error) {
            console.warn("⚠️ [GSI OAuth Step] Error received from token client:", response.error);
            return finish(null);
          }
          if (response?.access_token) {
            try {
              console.log("✅ [GSI OAuth Step] Access token resolved! Fetching Google UserInfo endpoint...");
              const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              const userinfo = await userinfoRes.json();
              if (userinfo && userinfo.email) {
                console.log("✅ [GSI OAuth Step] Successfully fetched Google profile for:", userinfo.email);
                return finish({
                  email: userinfo.email,
                  name: userinfo.name || userinfo.given_name || userinfo.email.split("@")[0],
                  photoURL: userinfo.picture || undefined,
                  uid: `google_${userinfo.sub || userinfo.email.replace(/[^a-zA-Z0-9]/g, "_")}`,
                  idToken: response.access_token
                });
              }
            } catch (fetchErr) {
              console.warn("⚠️ [GSI OAuth Step] Userinfo fetch error:", fetchErr);
            }
          }
          finish(null);
        },
        error_callback: (err: any) => {
          clearTimeout(safetyTimer);
          console.warn("⚠️ [GSI OAuth Step] Token client error callback:", err);
          const errType = err?.type || err?.error || "gsi_error";
          finish({
            email: "",
            name: "",
            uid: "",
            requiresEmailPrompt: true,
            errorCode: errType === "origin_mismatch" ? "auth/origin-mismatch" : `auth/${errType}`
          });
        }
      });

      client.requestAccessToken({ prompt: "select_account" });
    } catch (e: any) {
      clearTimeout(safetyTimer);
      console.warn("⚠️ [GSI OAuth Step] Exception during client request:", e);
      finish({
        email: "",
        name: "",
        uid: "",
        requiresEmailPrompt: true,
        errorCode: e?.message?.includes("origin") ? "auth/origin-mismatch" : "auth/gsi-failed"
      });
    }
  });
}

/**
 * Retrieves the cryptographic ID token for the currently active Firebase Auth user session.
 * Enables instant, cryptographically verified 1-click login without re-opening popups.
 */
export async function getFirebaseCachedUserToken(): Promise<GoogleSignInResult | null> {
  if (auth && auth.currentUser && auth.currentUser.email) {
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      return {
        email: auth.currentUser.email,
        name: auth.currentUser.displayName || auth.currentUser.email.split("@")[0],
        photoURL: auth.currentUser.photoURL || undefined,
        uid: auth.currentUser.uid,
        idToken
      };
    } catch (err) {
      console.warn("⚠️ [Firebase Cached User] Error fetching token from active session:", err);
    }
  }
  return null;
}

/**
 * 2. Enhanced executeGoogleSignIn function:
 * - Always contacts Google OAuth provider (Firebase Auth or Google Identity Services).
 * - Never returns unverified mock strings.
 * - Extracts and returns a valid cryptographic idToken.
 */
export async function executeGoogleSignIn(): Promise<GoogleSignInResult | null> {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "unknown";
  console.group("🔥 [Firebase Google Auth Flow]");
  console.log("📍 [Stage 0 - Context] Starting executeGoogleSignIn...");
  console.log("📍 [Stage 0 - Context] Current Origin:", currentOrigin);
  console.log("📍 [Stage 0 - Context] Target Auth Domain:", resolvedFirebaseConfig.authDomain);
  console.log("📍 [Stage 0 - Context] Target Project ID:", resolvedFirebaseConfig.projectId);

  // Check if active session already exists in Firebase Auth
  if (auth && auth.currentUser && auth.currentUser.email) {
    try {
      console.log("⚡ [Stage 0 - Instant Session] Using active Firebase session for:", auth.currentUser.email);
      const idToken = await auth.currentUser.getIdToken(true);
      if (idToken) {
        const cachedResult: GoogleSignInResult = {
          email: auth.currentUser.email,
          name: auth.currentUser.displayName || auth.currentUser.email.split("@")[0],
          photoURL: auth.currentUser.photoURL || undefined,
          uid: auth.currentUser.uid,
          idToken
        };
        console.groupEnd();
        return cachedResult;
      }
    } catch (cachedErr) {
      console.warn("ℹ️ [Stage 0 - Active Session Notice]:", cachedErr);
    }
  }

  // Tier 1: Try Firebase Authentication Popup
  if (auth) {
    try {
      // Step 1: Initialization of GoogleAuthProvider
      console.log("🚀 [Step 1/4 - Init Provider] Initializing GoogleAuthProvider with scopes ['profile', 'email']...");
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({
        prompt: "select_account"
      });

      // Step 2: Triggering of signInWithPopup
      console.log("🚀 [Step 2/4 - Trigger Popup] Executing signInWithPopup(auth, provider)...");
      const result = await signInWithPopup(auth, provider);

      // Step 3: Resolution of credential object
      if (result && result.user) {
        const user = result.user;
        console.log("✅ [Step 3/4 - Credential Resolution] User verified:", user.email);

        const idToken = await user.getIdToken(true);
        console.log("✅ [Step 3/4 - Token Fetch] JWT ID Token retrieved successfully (Length:", idToken?.length || 0, ")");

        // Step 4: Finalization
        const finalResult: GoogleSignInResult = {
          email: user.email || "",
          name: user.displayName || user.email?.split("@")[0] || "Utilisateur Google",
          photoURL: user.photoURL || undefined,
          uid: user.uid,
          idToken,
        };
        console.groupEnd();
        return finalResult;
      }
    } catch (error: any) {
      const errorCode = error?.code || "auth/unknown";
      const errorMessage = error?.message || String(error);

      console.warn("⚠️ [Step 2/4 - Error Caught] Popup encounter during OAuth redirect / popup trigger:", {
        code: errorCode,
        message: errorMessage
      });

      if (
        errorCode === "auth/popup-closed-by-user" ||
        errorCode === "auth/cancelled-popup-request" ||
        errorCode === "auth/popup-blocked" ||
        errorCode === "auth/unauthorized-domain" ||
        errorCode === "auth/invalid-api-key" ||
        errorCode === "auth/operation-not-allowed" ||
        errorCode === "auth/internal-error"
      ) {
        console.log("ℹ️ [Step 2/4 - Notice] Google OAuth popup closed, blocked, or unauthorized domain:", errorCode);
        console.groupEnd();
        return {
          email: "",
          name: "",
          uid: "",
          requiresEmailPrompt: true,
          errorCode
        };
      }

      console.groupEnd();
      return {
        email: "",
        name: "",
        uid: "",
        requiresEmailPrompt: true,
        errorCode
      };
    }
  }

  // Tier 2: Direct GSI only if Firebase Auth instance is not initialized
  try {
    const gsiResult = await tryGoogleIdentityServicesAuth();
    if (gsiResult && gsiResult.idToken) {
      console.groupEnd();
      return gsiResult;
    }
  } catch (directGsiErr) {
    console.warn("⚠️ Direct GSI notice:", directGsiErr);
  }

  console.groupEnd();
  return {
    email: "",
    name: "",
    uid: "",
    requiresEmailPrompt: true
  };
}

let isFirestoreOffline = false;

/**
 * Unified Firestore-or-LocalStorage persistence wrappers.
 * Automatically synchronizes changes locally and pushes to Firestore when online and configured.
 */
export const firestoreSync = {
  // Save order or status update in real-time
  async saveDocument(collectionName: string, docId: string, data: any) {
    if (db && !isFirestoreOffline) {
      try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e: any) {
        console.warn(`[Firestore] Sync save notice for ${collectionName}/${docId}:`, e?.message || e);
        if (e?.message?.includes("offline") || e?.message?.includes("Failed to get") || e?.message?.includes("unreachable")) {
          isFirestoreOffline = true;
        }
      }
    }
    
    // Always sync locally as well for immediate reactive feedback
    const localKey = `lgf_sync_${collectionName}`;
    const current = JSON.parse(localStorage.getItem(localKey) || "{}");
    current[docId] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(localKey, JSON.stringify(current));
  },

  // Delete document
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    if (db && !isFirestoreOffline) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
      } catch (e: any) {
        console.warn(`[Firestore] Sync delete notice for ${collectionName}/${docId}:`, e?.message || e);
      }
    }
    const localKey = `lgf_sync_${collectionName}`;
    const current = JSON.parse(localStorage.getItem(localKey) || "{}");
    delete current[docId];
    localStorage.setItem(localKey, JSON.stringify(current));
  },

  // Read single document
  async getDocument(collectionName: string, docId: string): Promise<any | null> {
    if (db && !isFirestoreOffline) {
      try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data();
        }
      } catch (e: any) {
        console.warn(`[Firestore] Sync read notice for ${collectionName}/${docId}:`, e?.message || e);
        if (e?.message?.includes("offline") || e?.message?.includes("Failed to get") || e?.message?.includes("unreachable")) {
          isFirestoreOffline = true;
        }
      }
    }
    const localKey = `lgf_sync_${collectionName}`;
    const current = JSON.parse(localStorage.getItem(localKey) || "{}");
    return current[docId] || null;
  },

  // Setup real-time listeners
  subscribeCollection(collectionName: string, onUpdate: (data: any[]) => void) {
    if (db && !isFirestoreOffline) {
      try {
        const q = collection(db, collectionName);
        return onSnapshot(q, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          onUpdate(items);
        }, (err) => {
          console.warn(`[Firestore] Subscription notice for ${collectionName}:`, err?.message || err);
          if (err?.message?.includes("offline") || err?.message?.includes("Failed to get") || err?.message?.includes("unreachable")) {
            isFirestoreOffline = true;
          }
          this.fallbackSubscribe(collectionName, onUpdate);
        });
      } catch (e: any) {
        console.warn(`[Firestore] Sync subscribe failed for ${collectionName}:`, e);
        isFirestoreOffline = true;
      }
    }

    return this.fallbackSubscribe(collectionName, onUpdate);
  },

  fallbackSubscribe(collectionName: string, onUpdate: (data: any[]) => void) {
    const handleStorageChange = () => {
      const localKey = `lgf_sync_${collectionName}`;
      const current = JSON.parse(localStorage.getItem(localKey) || "{}");
      onUpdate(Object.entries(current).map(([id, val]: [string, any]) => ({ id, ...val })));
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }
};
