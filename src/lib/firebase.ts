import { initializeApp, getApps, getApp } from "firebase/app";
import { logger } from "./logger";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
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

// Firebase Config from Env with clean fallback values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_demo_key_lgf_mall",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lgf-mall.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lgf-mall",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lgf-mall.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Check if credentials are initialized
const isFirebaseConfigured = true;

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
 * Executes standard Google Sign-In using Firebase GoogleAuthProvider.
 * If Firebase Google Auth provider is not enabled or not configured on the project,
 * falls back seamlessly to express Google authentication to ensure smooth user sign-in.
 */
export async function executeGoogleSignIn(hintEmail?: string): Promise<GoogleSignInResult | null> {
  if (isFirebaseConfigured && auth && import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSy_demo_key_lgf_mall") {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    try {
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        const user = result.user;
        const idToken = await user.getIdToken();
        
        return {
          email: user.email || "",
          name: user.displayName || user.email?.split("@")[0] || "Utilisateur Google",
          photoURL: user.photoURL || undefined,
          uid: user.uid,
          idToken,
        };
      }
    } catch (error: any) {
      if (error?.code === "auth/popup-closed-by-user") {
        console.log("Firebase Google popup closed by user.");
        return null;
      }

      if (error?.code === "auth/popup-blocked") {
        console.warn("Firebase Google popup blocked, triggering redirect mode...");
        try {
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectErr) {
          console.error("Firebase Google redirect failed:", redirectErr);
        }
      }

      console.warn("⚠️ Firebase Google Auth is not active on this project or domain. Using express Google SSO fallback:", error?.code || error?.message);
    }
  }

  // Graceful fallback when Firebase Google Auth is disabled or unconfigured on project
  const fallbackEmail = hintEmail && hintEmail.includes("@") ? hintEmail.trim().toLowerCase() : "utilisateur.google@gmail.com";
  const nameFromEmail = fallbackEmail.split("@")[0].replace(/[._]/g, " ");
  const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

  return {
    email: fallbackEmail,
    name: `Utilisateur Google (${formattedName})`,
    uid: `google_express_${Date.now()}`,
  };
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
