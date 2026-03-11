// --- ELEMENTI DEL DOM ---
const btnAccendi = document.getElementById('btn-accendi');
const btnSpegni = document.getElementById('btn-spegni');
const statoStufa = document.getElementById('stato-stufa');
const boxNotifiche = document.getElementById('notifiche');
const tempDisplay = document.getElementById('temp-display');

// Indirizzo del server o dell'ESP (da aggiornare in futuro)
const API_URL = "http://INDIRIZZO_DEL_SERVER_O_ESP/api"; 

// Variabili per ricordare i vecchi dati in caso di disconnessione
let ultimaTemp = null;
let ultimoOrario = null;

// --- 1. FUNZIONE PER LEGGERE I DATI ATTUALI (GET) ---
async function aggiornaDatiStufa() {
    try {
        const response = await fetch(`${API_URL}/stato`);
        
        if (!response.ok) throw new Error(`Codice di errore: ${response.status}`);

        const dati = await response.json(); 
        
        // Calcoliamo l'orario attuale
        const adesso = new Date();
        const ore = adesso.getHours().toString().padStart(2, '0');
        const minuti = adesso.getMinutes().toString().padStart(2, '0');
        
        // Salviamo in memoria
        ultimoOrario = `${ore}:${minuti}`;
        ultimaTemp = dati.temperatura;
        
        // Mostriamo i dati a schermo
        tempDisplay.innerHTML = `
            ${ultimaTemp} °C
            <div style="font-size: 14px; color: #666; font-weight: normal; margin-top: 8px;">
                Ultimo aggiornamento: ${ultimoOrario}
            </div>
        `;

        // Gestione stati
        if (dati.stato === "accesa") {
            statoStufa.innerHTML = "Accesa 🟢";
            statoStufa.className = "status-accesa";
            btnAccendi.disabled = true;
            btnSpegni.disabled = false;
            boxNotifiche.innerHTML = "Stufa connessa e operativa. 🔥";
            
        } else if (dati.stato === "spenta") {
            statoStufa.innerHTML = "Spenta 🔴";
            statoStufa.className = "status-spenta";
            btnAccendi.disabled = false;
            btnSpegni.disabled = true;
            boxNotifiche.innerHTML = "Stufa connessa e in attesa di comandi.";
            
        } else if (dati.stato === "verifica") {
            statoStufa.innerHTML = "In verifica 🟡";
            statoStufa.className = "status-attesa";
            btnAccendi.disabled = true;
            btnSpegni.disabled = true;
        }

    } catch (errore) {
        console.error("Errore di rete:", errore);
        
        statoStufa.innerHTML = "Disconnessa ❌";
        statoStufa.className = "status-spenta"; 
        btnAccendi.disabled = true;
        btnSpegni.disabled = true;

        if (ultimaTemp !== null && ultimoOrario !== null) {
            tempDisplay.innerHTML = `
                --.- °C
                <div style="font-size: 14px; color: #d32f2f; font-weight: normal; margin-top: 8px;">
                    Ultima temp. rilevata alle ${ultimoOrario}: <b>${ultimaTemp} °C</b>
                </div>
            `;
        } else {
            tempDisplay.innerHTML = `--.- °C`;
        }

        boxNotifiche.innerHTML = `
            <b style="color: #d32f2f;">⚠️ Nessuna connessione con la stufa</b><br>
            <span style="font-size: 13px;">I comandi sono disabilitati. Motivi possibili:</span>
            <ul style="text-align: left; font-size: 13px; margin-top: 5px;">
                <li>Il dispositivo fisico è spento.</li>
                <li>La stufa non è connessa al Wi-Fi.</li>
            </ul>
            <hr style="border: 0.5px solid #ccc;">
            <small style="color: #666;">Dettaglio: ${errore.message}</small>
        `;
    }
}

// Chiediamo i dati nuovi ogni 10 secondi
setInterval(aggiornaDatiStufa, 10000);
aggiornaDatiStufa();

// --- 2. FUNZIONI PER INVIARE COMANDI (POST) ---
btnAccendi.addEventListener('click', async function() {
    statoStufa.innerHTML = "Invio comando... 🟡";
    btnAccendi.disabled = true;
    try {
        const response = await fetch(`${API_URL}/accendi`, { method: 'POST' });
        if (response.ok) boxNotifiche.innerHTML = "Comando di accensione inviato! Attesa verifica termica (20 min).";
        else throw new Error(`Errore dal server: ${response.status}`);
    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore durante l'invio. <br><small>${errore.message}</small>`;
        btnAccendi.disabled = false;
    }
});

btnSpegni.addEventListener('click', async function() {
    statoStufa.innerHTML = "Spegnimento... 🔴";
    btnSpegni.disabled = true;
    try {
        const response = await fetch(`${API_URL}/spegni`, { method: 'POST' });
        if (response.ok) boxNotifiche.innerHTML = "Comando di spegnimento inviato.";
        else throw new Error(`Errore dal server: ${response.status}`);
    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore. Impossibile spegnere. <br><small>${errore.message}</small>`;
        btnSpegni.disabled = false;
    }
});

// --- 3. FUNZIONE PER CERCARE LO STORICO ---
const inputOrario = document.getElementById('input-orario');
const btnCercaStorico = document.getElementById('btn-cerca-storico');
const risultatoStorico = document.getElementById('risultato-storico');

btnCercaStorico.addEventListener('click', async function() {
    const oraScelta = inputOrario.value;

    if (!oraScelta) {
        risultatoStorico.innerHTML = "⚠️ Inserisci un orario valido.";
        return;
    }

    risultatoStorico.innerHTML = "Ricerca in corso... ⏳";

    try {
        const response = await fetch(`${API_URL}/storico?ora=${oraScelta}`);
        if (!response.ok) throw new Error("Errore dal server");

        const dati = await response.json();

        if (dati.temperatura !== null && dati.temperatura !== undefined) {
            risultatoStorico.innerHTML = `Alle ore ${oraScelta} c'erano <b>${dati.temperatura} °C</b> 🌡️`;
        } else {
            risultatoStorico.innerHTML = `Nessun dato registrato alle ${oraScelta}.`;
        }
    } catch (errore) {
        risultatoStorico.innerHTML = `<span style="color: #d32f2f;">Impossibile connettersi al server per lo storico.</span>`;
    }
});

// --- 4. LOGICA GRAFICO (Chart.js) ---

// Funzione per creare le etichette da 00:00 all'ora attuale
function generaEtichetteOggi() {
    const etichette = [];
    const oraAttuale = new Date().getHours(); // Prende l'ora esatta (es. 18)
    
    // Un ciclo che parte da 0 (mezzanotte) e arriva all'ora attuale
    for (let i = 0; i <= oraAttuale; i++) {
        // Aggiunge lo "0" davanti se l'ora è a singola cifra (es. 09:00)
        const oraFormattata = i.toString().padStart(2, '0') + ":00";
        etichette.push(oraFormattata);
    }
    return etichette;
}

// Generiamo dati "finti" proporzionati al numero di ore correnti per non lasciare il grafico vuoto
// (In futuro questi dati arriveranno dal tuo ESP32)
function generaDatiTemporanei(numeroOre) {
    const dati = [];
    let tempPartenza = 14.5; // Immaginiamo 14.5 gradi a mezzanotte
    
    for (let i = 0; i < numeroOre; i++) {
        dati.push(parseFloat(tempPartenza.toFixed(1)));
        // Simuliamo la temperatura che oscilla un po' durante la giornata
        tempPartenza += (Math.random() * 1.5 - 0.3); 
    }
    return dati;
}

const etichetteAsseX = generaEtichetteOggi();
const datiAsseY = generaDatiTemporanei(etichetteAsseX.length);

const ctx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: etichetteAsseX, 
        datasets: [{
            label: 'Andamento Temperatura Oggi (°C)',
            data: datiAsseY, 
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4 
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { 
                suggestedMin: 12, 
                suggestedMax: 25 
            }
        }
    }
});