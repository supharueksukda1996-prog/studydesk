/* ============================================================
   StudyDesk — Firebase config
   ------------------------------------------------------------
   Fill this in to turn on "Sign in with Gmail" + cross-device sync.
   Leave apiKey as "" and the app keeps working LOCAL-ONLY (no login).

   How to get these values (free, ~10 min — see README.md):
     1) https://console.firebase.google.com  →  Add project
     2) Build → Authentication → Sign-in method → enable "Google"
     3) Build → Firestore Database → Create database (Production mode)
     4) Project settings (gear) → Your apps → Web app (</>) → register
     5) Copy the config values into the object below
     6) Firestore → Rules → paste the rules from README.md
   ============================================================ */
window.SD_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
