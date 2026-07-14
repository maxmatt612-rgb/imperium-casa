// ============================================================
// LISTINO PREZZI — modifica solo i numeri qui sotto per cambiare
// i prezzi mostrati sul sito e nel calcolo del totale.
// ============================================================
export const PRICING = {
  progettazione: {
    base: 3000,
    completa: 5000,
  },
  dimensione: {
    "16x16": 5000,
    "32x32": 10000,
  },
  altezzaPerBlocco: 500, // ogni 4 blocchi di altezza
  altezzaOgniBlocchi: 4,
  styling: {
    base: 3000,
    completo: 5000,
  },
};

export function calcAltezzaCosto(blocchi) {
  const n = Math.max(0, Number(blocchi) || 0);
  return Math.ceil(n / PRICING.altezzaOgniBlocchi) * PRICING.altezzaPerBlocco;
}

export function calcTotale({ progettazione, dimensione, altezza, styling }) {
  const pProg = PRICING.progettazione[progettazione] || 0;
  const pDim = PRICING.dimensione[dimensione] || 0;
  const pAlt = calcAltezzaCosto(altezza);
  const pStyle = PRICING.styling[styling] || 0;
  return {
    progettazione: pProg,
    dimensione: pDim,
    altezza: pAlt,
    styling: pStyle,
    totale: pProg + pDim + pAlt + pStyle,
  };
}

export function formatEuro(n) {
  return n.toLocaleString("it-IT") + " €";
}
