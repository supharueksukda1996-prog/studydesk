/* ============================================================
   StudyDesk — Gmail login + cross-device sync (Firebase)
   Activates ONLY when firebase-config.js has a real apiKey.
   Strategy: localStorage is the local source of truth; the whole
   set of "sd_*" keys is mirrored to Firestore doc users/{uid}.
   Last write wins across a single user's own devices.
   ============================================================ */
const cfg = (window.SD_FIREBASE_CONFIG) || {};
window.sdConfigured = () => !!(cfg && cfg.apiKey);
window.sdUser = () => null; // replaced below when configured

if (window.sdConfigured()) {
  const APP = "https://www.gstatic.com/firebasejs/10.12.5/";
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(APP + "firebase-app.js"),
    import(APP + "firebase-auth.js"),
    import(APP + "firebase-firestore.js")
  ]);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } = authMod;
  const { getFirestore, doc, getDoc, setDoc, onSnapshot, enableIndexedDbPersistence } = fsMod;

  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  try { await enableIndexedDbPersistence(db); } catch (e) {}

  const provider = new GoogleAuthProvider();
  let curUser = null, pushT = null, applyingRemote = false;

  window.sdUser = () => curUser ? { email: curUser.email, uid: curUser.uid } : null;
  window.sdLogin = () => { signInWithPopup(auth, provider).catch(() => signInWithRedirect(auth, provider)); };
  const wipeLocal = () => {
    const rm = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("sd_") === 0) rm.push(k); }
    rm.forEach((k) => localStorage.removeItem(k));
    try { indexedDB.deleteDatabase("studydesk"); } catch (e) {} // slip/task images are per-user + local
  };
  // Logout clears this device so the next Gmail signs in to a clean slate
  // (prevents one person's local data from overwriting another's cloud account).
  window.sdLogout = () => {
    window.__sdOnChange = null;
    const done = () => { wipeLocal(); location.reload(); };
    signOut(auth).then(done, done);
  };
  getRedirectResult(auth).catch(() => {});

  const localData = () => {
    const d = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("sd_") === 0) d[k] = localStorage.getItem(k); }
    return d;
  };
  const applyRemote = (data) => {
    applyingRemote = true;
    const rm = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("sd_") === 0 && k !== "sd_synctime") rm.push(k); }
    rm.forEach((k) => localStorage.removeItem(k));
    Object.entries(data || {}).forEach(([k, v]) => { if (k !== "sd_synctime") { try { localStorage.setItem(k, v); } catch (e) {} } });
    applyingRemote = false;
  };
  const pushNow = async () => {
    if (!curUser || applyingRemote) return;
    const now = Date.now();
    try {
      await setDoc(doc(db, "users", curUser.uid), { data: localData(), updatedAt: now }, { merge: true });
      localStorage.setItem("sd_synctime", String(now));
    } catch (e) {}
  };
  const debouncedPush = () => { clearTimeout(pushT); pushT = setTimeout(pushNow, 1500); };

  onAuthStateChanged(auth, async (user) => {
    curUser = user;
    if (!user) { window.__sdOnChange = null; return; }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const rd = snap.data(); const remoteAt = rd.updatedAt || 0; const localAt = +(localStorage.getItem("sd_synctime") || 0);
        if (remoteAt >= localAt && rd.data) {
          applyRemote(rd.data); localStorage.setItem("sd_synctime", String(remoteAt));
          if (window.__sdReload) return window.__sdReload();
        }
      }
    } catch (e) {}
    window.__sdOnChange = debouncedPush;
    pushNow();
    // live updates pushed from another device
    onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (!snap.exists() || applyingRemote) return;
      const rd = snap.data(); const remoteAt = rd.updatedAt || 0; const localAt = +(localStorage.getItem("sd_synctime") || 0);
      if (remoteAt > localAt && rd.data) {
        applyRemote(rd.data); localStorage.setItem("sd_synctime", String(remoteAt));
        if (window.__sdReload) window.__sdReload();
      }
    });
  });
}
