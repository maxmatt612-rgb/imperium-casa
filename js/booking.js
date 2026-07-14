import { firebaseConfig } from "./firebase-config.js";
import { PRICING, calcAltezzaCosto, calcTotale, formatEuro } from "./pricing.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("booking-form");
const breakdownEl = document.getElementById("breakdown");
const totaleValueEl = document.getElementById("totale-value");
const rateNoteEl = document.getElementById("rate-note");
const errorBox = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

function readForm() {
  return {
    ign: document.getElementById("ign").value.trim(),
    telegram: document.getElementById("telegram").value.trim(),
    plot: document.getElementById("plot").value.trim(),
    progettazione: document.getElementById("progettazione").value,
    dimensione: document.getElementById("dimensione").value,
    altezza: document.getElementById("altezza").value,
    styling: document.getElementById("styling").value,
    pagamento: form.querySelector('input[name="pagamento"]:checked').value,
    note: document.getElementById("note").value.trim(),
  };
}

function updateTotal() {
  const data = readForm();
  const c = calcTotale(data);

  breakdownEl.innerHTML = `
    <div><span>Progettazione (${data.progettazione})</span><span>${formatEuro(c.progettazione)}</span></div>
    <div><span>Dimensione (${data.dimensione})</span><span>${formatEuro(c.dimensione)}</span></div>
    <div><span>Altezza (${data.altezza || 0} blocchi)</span><span>${formatEuro(c.altezza)}</span></div>
    <div><span>Styling (${data.styling})</span><span>${formatEuro(c.styling)}</span></div>
  `;
  totaleValueEl.textContent = formatEuro(c.totale);

  if (data.pagamento === "rateizzato") {
    const meta = Math.round(c.totale / 2);
    rateNoteEl.style.display = "block";
    rateNoteEl.textContent = `Rateizzato: ${formatEuro(meta)} all'inizio lavori + ${formatEuro(c.totale - meta)} alla consegna.`;
  } else {
    rateNoteEl.style.display = "none";
  }

  return c;
}

form.addEventListener("input", updateTotal);
form.addEventListener("change", updateTotal);

document.querySelectorAll('input[name="pagamento"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.getElementById("opt-anticipato").classList.toggle("checked", document.querySelector('input[value="anticipato"]').checked);
    document.getElementById("opt-rate").classList.toggle("checked", document.querySelector('input[value="rateizzato"]').checked);
  });
});

updateTotal();
document.getElementById("opt-anticipato").classList.add("checked");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";

  const data = readForm();

  if (!data.ign || !data.telegram || !data.plot) {
    errorBox.textContent = "Compila tutti i campi obbligatori.";
    errorBox.style.display = "block";
    return;
  }
  if (!data.telegram.startsWith("@")) {
    errorBox.textContent = "L'username Telegram deve iniziare con @.";
    errorBox.style.display = "block";
    return;
  }

  const costi = calcTotale(data);

  submitBtn.disabled = true;
  submitBtn.textContent = "Invio in corso...";

  try {
    await addDoc(collection(db, "bookings"), {
      ign: data.ign,
      telegram: data.telegram,
      plot: data.plot,
      progettazione: data.progettazione,
      dimensione: data.dimensione,
      altezza: Number(data.altezza) || 0,
      styling: data.styling,
      pagamento: data.pagamento,
      note: data.note,
      costi,
      totale: costi.totale,
      stato: "In attesa",
      createdAt: serverTimestamp(),
    });

    form.style.display = "none";
    const confirmBox = document.getElementById("confirm");
    document.getElementById("confirm-text").textContent =
      `Totale da pagare: ${formatEuro(costi.totale)} (${data.pagamento === "rateizzato" ? "rateizzato 50/50" : "anticipato"}).`;
    confirmBox.style.display = "block";
    confirmBox.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Errore durante l'invio. Riprova tra poco o contatta lo staff.";
    errorBox.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Invia prenotazione";
  }
});
