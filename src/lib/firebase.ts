import { initializeApp, getApps, getApp } from "firebase/app";
import { logger } from "./logger";
import { 
  getAuth, 
  GoogleAuthProvider, 
  User as FirebaseUser,
  Auth,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  getRedirectResult,
  signInWithRedirect
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  Firestore
} from "firebase/firestore";

// Firebase Config from Env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if credentials are fully populated
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Set up persistence and listener to prevent session dropouts and sync errors
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        onAuthStateChanged(auth!, (firebaseUser) => {
          if (firebaseUser) {
            console.log("🔥 [Firebase Auth] Persistent session restored for:", firebaseUser.email);
          } else {
            console.log("🔥 [Firebase Auth] No active persistent session.");
          }
        }, (error) => {
          console.error("❌ [Firebase Auth] Listener initialization error:", error);
        });
      })
      .catch((err) => {
        console.warn("⚠️ [Firebase Auth] Persistence initialization failed:", err?.message || err);
      });

    console.log("🔥 Firebase initialized successfully with cloud configuration!");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase SDK:", error);
  }
} else {
  console.warn(
    "⚠️ Firebase is running in SIMULATED fallback mode. To connect to a live Firebase instance, configure your VITE_FIREBASE_* environment variables."
  );
}

let isFirestoreOffline = false;

export { auth, db, isFirebaseConfigured };

// Define a unified interface for Google login result
export interface GoogleSignInResult {
  email: string;
  name: string;
  photoURL?: string;
  uid: string;
  idToken?: string;
  role?: string;
}

/**
 * Executes a Google Sign-In.
 * Handles:
 * 1. Real Firebase Auth Google Sign-In with redirect method (if keys are configured & not sandboxed)
 * 2. Elegant simulated selector for sandbox iframe testing & missing secrets
 */
export async function executeGoogleSignIn(onShowSimulatedSelector: (onSelect: (user: GoogleSignInResult) => void) => void): Promise<GoogleSignInResult> {
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  if (isFirebaseConfigured && auth && !isInIframe) {
    try {
      // Check if this is a redirect return
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult) {
        const user = redirectResult.user;
        const idToken = await user.getIdToken();
        
        return {
          email: user.email || "",
          name: user.displayName || user.email?.split("@")[0] || "Utilisateur Google",
          photoURL: user.photoURL || undefined,
          uid: user.uid,
          idToken,
        };
      }
      
      // Initiate new sign-in with redirect (instant, no popup blocking issues)
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      await signInWithRedirect(auth, provider);
      
      // This promise never resolves as the page will redirect
      return new Promise(() => {});
    } catch (error: any) {
      console.warn("Firebase auth redirect failed, falling back to simulator:", error);
      // If redirect fails, proceed to simulated fallback so the user doesn't get stuck
    }
  }

  // Simulated google auth fallback for iframe environments and local runs
  return new Promise<GoogleSignInResult>((resolve) => {
    onShowSimulatedSelector((selectedUser) => {
      resolve(selectedUser);
    });
  });
}

/**
 * Unified Firestore-or-LocalStorage persistence wrappers.
 * Automatically synchronizes changes locally and pushes to Firestore when online and configured.
 */
export const firestoreSync = {
  // Save order or status update in real-time
  async saveDocument(collectionName: string, docId: string, data: any) {
    if (isFirebaseConfigured && db && !isFirestoreOffline) {
      try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
        console.log(`[Firestore] Document ${collectionName}/${docId} successfully synced!`);
      } catch (e: any) {
        console.warn(`[Firestore] Error saving document ${collectionName}/${docId}, using offline fallback:`, e?.message || e);
        if (e?.message?.includes("offline") || e?.message?.includes("Failed to get") || e?.message?.includes("permission") || e?.message?.includes("unreachable")) {
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

  // Read single document
  async getDocument(collectionName: string, docId: string): Promise<any | null> {
    if (isFirebaseConfigured && db && !isFirestoreOffline) {
      try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data();
        }
      } catch (e: any) {
        console.warn(`[Firestore] Error reading ${collectionName}/${docId}, using offline fallback:`, e?.message || e);
        if (e?.message?.includes("offline") || e?.message?.includes("Failed to get") || e?.message?.includes("permission") || e?.message?.includes("unreachable")) {
          isFirestoreOffline = true;
        }
      }
    }
    const localKey = `lgf_sync_${collectionName}`;
    const current = JSON.parse(localStorage.getItem(localKey) || "{}");
    return current[docId] || null;
  },

  // Setup real-time listeners (optional callback)
  subscribeCollection(collectionName: string, onUpdate: (data: any[]) => void) {
    if (isFirebaseConfigured && db && !isFirestoreOffline) {
      try {
        const q = collection(db, collectionName);
        return onSnapshot(q, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          onUpdate(items);
        }, (err) => {
          console.warn(`[Firestore] Subscription error for ${collectionName}, using local fallback:`, err);
          if (err?.message?.includes("offline") || err?.message?.includes("Failed to get") || err?.message?.includes("permission") || err?.message?.includes("unreachable")) {
            isFirestoreOffline = true;
          }
          // Fall back to local
          this.fallbackSubscribe(collectionName, onUpdate);
        });
      } catch (e: any) {
        console.warn(`[Firestore] Sync subscribe failed for ${collectionName}, fallback to local:`, e);
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
    // Initial fetch
    handleStorageChange();

    // Return unsubscribe callback
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }
};
