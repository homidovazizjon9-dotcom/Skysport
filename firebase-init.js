import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, child, onValue, off }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  // Firebase web API key — public by design, safe to expose
  apiKey: "AIzaSyBeiC9-NpXiHMoDACAsCwVd-mZsx-f2xVI",
  authDomain: "spenses-f8c91.firebaseapp.com",
  projectId: "spenses-f8c91",
  storageBucket: "spenses-f8c91.firebasestorage.app",
  messagingSenderId: "609345629874",
  appId: "1:609345629874:web:37a5acb549a651d4b923ab",
  databaseURL: "https://spenses-f8c91-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

window._fbAuth = auth;
window._fbDb = db;
window._fbProvider = provider;
window._fbSignIn = () => signInWithPopup(auth, provider);
window._fbSignOut = () => signOut(auth);
window._fbRef = ref;
window._fbSet = set;
window._fbUpdate = update;
window._fbGet = get;
window._fbChild = child;
window._fbOnValue = onValue;
window._fbOff = off;
window._firebaseReady = true;

onAuthStateChanged(auth, (user) => {
  if (window._onAuthReady) window._onAuthReady(user);
});
