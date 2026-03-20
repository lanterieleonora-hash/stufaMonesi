// --- ELEMENTI DEL DOM ---
const btnAccendi = document.getElementById('btn-accendi');
const btnSpegni = document.getElementById('btn-spegni');
const statoStufa = document.getElementById('stato-stufa');
const boxNotifiche = document.getElementById('notifiche');
const tempDisplay = document.getElementById('temp-display');
const timerDisplay = document.getElementById('timer-riscaldamento');

// --- INDIRIZZO RELÈ SMART ---
// Inserisci qui l'IP del tuo Shelly / Relè una volta configurato
const RELAY_IP = "http://192.168.1.100"; 

// --- VARIABILI DI STATO ---
let ultimaTemp = null;
let ultimoOrario = null;
let tempT0 = null;
let intervalloCountdown = null;

// --- 1. LETTURA STATO E TEMPERATURA ---
async function aggiornaDati() {
    try {
        // Chiamata API (Esempio per Shelly Plus 1 - Gen 2)
        const response = await fetch(`${RELAY_IP}/rpc/Shelly.GetStatus`);
        if (!response.ok) throw new Error(`Errore Relè: ${response.status}`);

        const dati = await response.json(); 
        
        const adesso = new Date();
        const ore = adesso.getHours().toString().padStart(2, '0');
        const minuti = adesso.getMinutes().toString().padStart(2, '0');
        ultimoOrario = `${ore}:${minuti}`;
        
        // Estrazione dati dal JSON
        ultimaTemp = dati['temperature:0'] ? dati['temperature:0'].tC : "--.-";
        const releAcceso = dati['switch:0'].output === true;
        
        // Aggiornamento Interfaccia Temperatura
        tempDisplay.innerHTML = `
            ${ultimaTemp} °C
            <div style="font-size: 14px; color: #666; font-weight: normal; margin-top: 8px;">
                Ultimo aggiornamento: ${ultimoOrario}
            </div>
        `;

        // Aggiornamento Interfaccia Stato
        if (releAcceso) {
            statoStufa.innerHTML = "Contatto Chiuso (Accesa) 🟢";
            statoStufa.className = "status-accesa";
            btnAccendi.disabled = true;
            btnSpegni.disabled = false;
        } else {
            statoStufa.innerHTML = "Contatto Aperto (Spenta) 🔴";
            statoStufa.className = "status-spenta";
            btnAccendi.disabled = false;
            btnSpegni.disabled = true;
        }

        // Rimuove avvisi di disconnessione se la connessione è tornata
        if (boxNotifiche.innerText.includes("In attesa") || boxNotifiche.innerText.includes("Offline") || boxNotifiche.innerText.includes("Errore di comunicazione")) {
             boxNotifiche.innerHTML = "✅ Connessione al relè stabilita.";
        }

    } catch (errore) {
        console.error("Errore di rete:", errore);
        statoStufa.innerHTML = "Disconnesso ⚠️";
        statoStufa.className = "status-spenta";
        btnAccendi.disabled = true;
        btnSpegni.disabled = true;
        boxNotifiche.innerHTML = `⚠️ Errore di comunicazione col relè all'IP ${RELAY_IP}. Assicurati che sia acceso e connesso alla rete.`;
    }
}

// Avvia il polling ogni 5 secondi
setInterval(aggiornaDati, 5000);
aggiornaDati();

// --- FUNZIONE TIMER DI VERIFICA (20 MIN) ---
function avviaCountdownVerifica() {
    if (intervalloCountdown) clearInterval(intervalloCountdown);
    
    let tempoRimanente = 20 * 60; // 20 minuti in secondi
    timerDisplay.style.display = "block";

    intervalloCountdown = setInterval(() => {
        tempoRimanente--;
        let min = Math.floor(tempoRimanente / 60).toString().padStart(2, '0');
        let sec = (tempoRimanente % 60).toString().padStart(2, '0');
        
        timerDisplay.innerHTML = `⏳ Verifica accensione fiamma in: ${min}:${sec} <br> <small>(Partita da: ${tempT0}°C)</small>`;

        if (tempoRimanente <= 0) {
            clearInterval(intervalloCountdown);
            timerDisplay.style.display = "none";
            
            // CONFRONTO TEMPERATURA
            let delta = (parseFloat(ultimaTemp) - tempT0).toFixed(1);
            if (delta > 0) {
                boxNotifiche.innerHTML = `🔥 <b>Stufa a regime:</b> La temperatura è salita di ${delta}°C (da ${tempT0}°C a ${ultimaTemp}°C).`;
            } else {
                boxNotifiche.innerHTML = `⚠️ <b>Attenzione:</b> Dopo 20 minuti la temperatura non è salita (Partenza: ${tempT0}°C, Attuale: ${ultimaTemp}°C). Verifica se il pellet è finito o se la stufa è in allarme.`;
            }
        }
    }, 1000);
}

// --- 2. LOGICA DI ACCENSIONE ---
btnAccendi.addEventListener('click', async function() {
    boxNotifiche.innerHTML = "⏳ Invio comando di accensione...";
    btnAccendi.disabled = true;

    try {
        const response = await fetch(`${RELAY_IP}/rpc/Switch.Set?id=0&on=true`);
        if (!response.ok) throw new Error(`Errore API: ${response.status}`);
        
        boxNotifiche.innerHTML = `✅ Comando inviato: Contatto chiuso. La stufa si sta accendendo.`;
        
        // Salva la temperatura di partenza e avvia il timer di verifica
        tempT0 = (ultimaTemp && ultimaTemp !== "--.-") ? parseFloat(ultimaTemp) : null;
        if (tempT0 !== null) avviaCountdownVerifica();
        
        setTimeout(aggiornaDati, 1000); 
    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore durante l'accensione: <br><small>${errore.message}</small>`;
        btnAccendi.disabled = false;
    }
});

// --- 3. LOGICA DI SPEGNIMENTO ---
btnSpegni.addEventListener('click', async function() {
    boxNotifiche.innerHTML = "⏳ Invio comando di spegnimento...";
    btnSpegni.disabled = true;

    try {
        const response = await fetch(`${RELAY_IP}/rpc/Switch.Set?id=0&on=false`);
        if (!response.ok) throw new Error(`Errore API: ${response.status}`);
        
        boxNotifiche.innerHTML = `✅ Comando inviato: Contatto aperto. Stufa in fase di spegnimento.`;
        
        // Ferma il timer di verifica se si spegne prima dei 20 minuti
        if (intervalloCountdown) {
            clearInterval(intervalloCountdown);
            timerDisplay.style.display = "none";
        }
        
        setTimeout(aggiornaDati, 1000); 
    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore durante lo spegnimento: <br><small>${errore.message}</small>`;
        btnSpegni.disabled = false;
    }
});

// --- 4. GRAFICO E STORICO (MOCK) ---
const inputOrario = document.getElementById('input-orario');
const btnCercaStorico = document.getElementById('btn-cerca-storico');
const risultatoStorico = document.getElementById('risultato-storico');

btnCercaStorico.addEventListener('click', function() {
    const oraScelta = inputOrario.value;
    if (!oraScelta) {
        risultatoStorico.innerHTML = "⚠️ Inserisci un orario valido.";
        return;
    }
    risultatoStorico.innerHTML = `(Funzione storico in arrivo per le ${oraScelta}).`;
});

function generaEtichetteOggi() {
    const etichette = [];
    const oraAttuale = new Date().getHours(); 
    for (let i = 0; i <= oraAttuale; i++) {
        etichette.push(i.toString().padStart(2, '0') + ":00");
    }
    return etichette;
}

function generaDatiTemporanei(numeroOre) {
    const dati = [];
    let tempPartenza = 14.5; 
    for (let i = 0; i < numeroOre; i++) {
        dati.push(parseFloat(tempPartenza.toFixed(1)));
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
    options: { responsive: true, scales: { y: { suggestedMin: 12, suggestedMax: 25 } } }
});