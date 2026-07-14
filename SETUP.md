# Imperium Casa — Guida alla pubblicazione (100% gratis)

Il sito è già completo e pronto. Ti restano solo dei passaggi da fare tu stesso
(perché servono i tuoi account Google/GitHub, che nessuno può creare al posto tuo).
Segui questi passaggi in ordine, ci vogliono circa 15-20 minuti la prima volta.

## Passo 0 — Aggiungi il logo

Salva l'immagine del logo che mi hai mandato (colonne dorate su fondo viola) dentro la cartella
`assets/` con esattamente questo nome: `assets/logo.png`. Non posso scaricarlo io direttamente dalla
chat: il file HTML lo referenzia già come `assets/logo.png`, quindi appena lo salvi lì apparirà
automaticamente nell'header e nella home.

## Passo 1 — Crea il progetto Firebase (gratis)

1. Vai su https://console.firebase.google.com e accedi con un account Google.
2. Clicca "Aggiungi progetto", dagli un nome (es. `imperium-casa`), continua fino alla fine (puoi disattivare Google Analytics, non serve).
3. Nel menu a sinistra vai su **Build > Firestore Database** → "Crea database" → scegli una posizione europea (es. `eur3`) → modalità **produzione** → Crea.
4. Sempre in Firestore, vai su **Regole** e incolla questo (sostituisce tutto il contenuto):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow create: if request.resource.data.keys().hasAll(
                        ['ign','telegram','plot','totale','stato','createdAt']
                      )
                      && request.resource.data.stato == 'In attesa';
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

Questo permette a chiunque di inviare una prenotazione, ma solo allo staff loggato di leggerle/modificarle/eliminarle. Clicca "Pubblica".

5. Nel menu a sinistra vai su **Build > Authentication** → "Inizia" → scheda "Sign-in method" → attiva **Email/Password**.
6. Vai sulla scheda "Users" (Utenti) → "Aggiungi utente" → crea UN account con:
   - Email: `staff@imperiumcasa.it` (deve corrispondere esattamente, è già scritta in [js/staff.js](js/staff.js))
   - Password: `Staf3I1mperium`

   Questa è la password unica che darai a tutti i dipendenti — nella pagina `staff.html` vedranno solo il campo password, non l'email (è gestita internamente dal sito).
7. Vai su **Impostazioni progetto** (icona ingranaggio in alto a sinistra) → scorri fino a "Le tue app" → clicca l'icona `</>` (Web) → dai un nome all'app → "Registra app". Ti mostrerà un blocco `firebaseConfig = {...}`: copia quei valori.

## Passo 2 — Incolla la configurazione nel sito

Apri il file [js/firebase-config.js](js/firebase-config.js) e sostituisci i valori placeholder con quelli copiati al passo 1.7. Salva il file.

## Passo 3 — Pubblica su GitHub Pages (gratis)

1. Vai su https://github.com e crea un account gratuito se non lo hai già.
2. Crea un nuovo repository pubblico, es. `imperium-casa`.
3. Carica tutti i file di questa cartella nel repository (puoi trascinarli nella pagina "Add file > Upload files" su GitHub, oppure con git da riga di comando).
4. Nel repository vai su **Settings > Pages**, in "Branch" scegli `main` e cartella `/ (root)`, salva.
5. Dopo 1-2 minuti il sito sarà online su `https://tuonomeutente.github.io/imperium-casa/`.

## Passo 4 — Prova tutto

- Apri `prenota.html` e invia una prenotazione di prova.
- Apri `staff.html`, accedi con l'account creato al passo 1.6, controlla che la prenotazione appaia nella tabella.
- Prova a cambiare stato e a eliminare la prenotazione di prova.

## Struttura del sito

- `index.html` — Home (presentazione, chi siamo, contatti)
- `prenota.html` — listino prezzi e form di prenotazione (con calcolo totale automatico)
- `blog.html` — blog/annunci
- `staff.html` — pannello riservato allo staff

## Modifiche future

- **Prezzi**: modifica i numeri in [js/pricing.js](js/pricing.js) (aggiorna anche i testi in [prenota.html](prenota.html) nella sezione prezzi se cambi i valori).
- **Nome/colori del sito**: modifica `index.html`, `prenota.html`, `blog.html`, `staff.html` e le variabili colore in cima a [css/style.css](css/style.css).
- **Nuovo staff**: aggiungi altri utenti in Firebase Authentication se in futuro vuoi account separati invece di una password condivisa.
- **Nuovi articoli sul blog**: aggiungi un nuovo blocco `<article class="card article reveal">...</article>` dentro `.blog-list` in [blog.html](blog.html), copiando la struttura di quello esistente.

## Nota sui costi

Sia Firebase (piano Spark) che GitHub Pages sono gratuiti per questo tipo di traffico (piccolo sito con poche prenotazioni al giorno). Non serve inserire alcuna carta di credito.
