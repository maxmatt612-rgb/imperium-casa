import { firebaseConfig } from "./firebase-config.js";
import { formatEuro } from "./pricing.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Firebase Authentication richiede un identificativo (email) oltre alla password.
// Lo staff vede solo il campo password: questa email fissa resta interna/tecnica.
const STAFF_EMAIL = "staff@imperiumcasa.it";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutLink = document.getElementById("logout-link");
const filterStato = document.getElementById("filter-stato");
const tbody = document.getElementById("bookings-body");

let allBookings = [];
let unsubscribe = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.style.display = "none";
    dashboardView.style.display = "block";
    logoutLink.style.display = "inline";
    startListening();
  } else {
    loginView.style.display = "block";
    dashboardView.style.display = "none";
    logoutLink.style.display = "none";
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.style.display = "none";
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, STAFF_EMAIL, password);
  } catch (err) {
    const authErrors = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"];
    if (authErrors.includes(err.code)) {
      loginError.textContent = "Accesso negato: password errata.";
    } else if (err.code === "auth/user-disabled") {
      loginError.textContent = "Questo account staff è stato disabilitato su Firebase.";
    } else {
      loginError.textContent =
        `Il sito non è ancora collegato a Firebase (o la configurazione non è corretta). ` +
        `Completa i Passi 1 e 2 di SETUP.md. Dettaglio tecnico: ${err.code || err.message}`;
    }
    loginError.style.display = "block";
  }
});

logoutLink.addEventListener("click", (e) => {
  e.preventDefault();
  signOut(auth);
});

function startListening() {
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    allBookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;color:var(--danger);">Errore nel caricamento: ${err.message}</td></tr>`;
  });
}

filterStato.addEventListener("change", render);

function statoBadgeClass(stato) {
  if (stato === "Completato") return "completato";
  if (stato === "In lavorazione") return "lavorazione";
  return "attesa";
}

function render() {
  const filtro = filterStato.value;
  const list = filtro ? allBookings.filter((b) => b.stato === filtro) : allBookings;

  document.getElementById("stat-totale").textContent = allBookings.length;
  document.getElementById("stat-attesa").textContent = allBookings.filter((b) => b.stato === "In attesa").length;
  document.getElementById("stat-lavorazione").textContent = allBookings.filter((b) => b.stato === "In lavorazione").length;
  const incasso = allBookings.reduce((sum, b) => sum + (b.totale || 0), 0);
  document.getElementById("stat-incasso").textContent = formatEuro(incasso);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;color:var(--text-dim);">Nessuna prenotazione.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((b) => {
    const data = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().toLocaleString("it-IT") : "-";
    return `
      <tr data-id="${b.id}">
        <td>${data}</td>
        <td>${escapeHtml(b.ign)}</td>
        <td>${escapeHtml(b.plot)}</td>
        <td>${escapeHtml(b.progettazione)}</td>
        <td>${escapeHtml(b.dimensione)}</td>
        <td>${b.altezza ?? "-"} blocchi</td>
        <td>${escapeHtml(b.styling)}</td>
        <td>${escapeHtml(b.pagamento)}</td>
        <td>${escapeHtml(b.note || "-")}</td>
        <td><strong>${formatEuro(b.totale || 0)}</strong></td>
        <td>
          <select class="status-select" data-action="stato">
            <option value="In attesa" ${b.stato === "In attesa" ? "selected" : ""}>In attesa</option>
            <option value="In lavorazione" ${b.stato === "In lavorazione" ? "selected" : ""}>In lavorazione</option>
            <option value="Completato" ${b.stato === "Completato" ? "selected" : ""}>Completato</option>
          </select>
          <div><span class="badge ${statoBadgeClass(b.stato)}">${escapeHtml(b.stato)}</span></div>
        </td>
        <td><button class="btn danger" data-action="delete" style="padding:6px 12px;font-size:0.8rem;">Elimina</button></td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll('select[data-action="stato"]').forEach((sel) => {
    sel.addEventListener("change", async (e) => {
      const id = e.target.closest("tr").dataset.id;
      await updateDoc(doc(db, "bookings", id), { stato: e.target.value });
    });
  });

  tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.closest("tr").dataset.id;
      if (confirm("Eliminare definitivamente questa prenotazione?")) {
        await deleteDoc(doc(db, "bookings", id));
      }
    });
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
