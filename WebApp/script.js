// --- ELEMENTI DEL DOM ---
const btnAccendi = document.getElementById('btn-accendi');
const btnSpegni = document.getElementById('btn-spegni');
const statoStufa = document.getElementById('stato-stufa');
const boxNotifiche = document.getElementById('notifiche');
const tempDisplay = document.getElementById('temp-display');

// --- INDIRIZZI DEGLI ESP ---
// Sostituisci questi IP con quelli reali che stampano sul Monitor Seriale di Arduino IDE
const API_SENSORE = "http://192.168.1.100"; 
const API_SERVO = "http://192.168.1.101";   

// --- VARIABILI DI STATO ---
let ultimaTemp = null;
let ultimoOrario = null;
let statoAttuale = "spenta"; // Stati possibili: "spenta", "verifica", "accesa"
let tempT0 = null;           // Temperatura al momento dell'accensione
let timerVerifica = null;    // Riferimento al timer dei 20 minuti

// --- 1. FUNZIONE PER LEGGERE LA TEMPERATURA (GET) ---
async function aggiornaDatiStufa() {
    try {
        const response = await fetch(`${API_SENSORE}/stato`);
        if (!response.ok) throw new Error(`Errore sensore: ${response.status}`);

        const dati = await response.json(); 
        
        const adesso = new Date();
        const ore = adesso.getHours().toString().padStart(2, '0');
        const minuti = adesso.getMinutes().toString().padStart(2, '0');
        
        ultimoOrario = `${ore}:${minuti}`;
        ultimaTemp = dati.temperatura;
        
        // Aggiorna l'interfaccia con la temperatura
        tempDisplay.innerHTML = `
            ${ultimaTemp} °C
            <div style="font-size: 14px; color: #666; font-weight: normal; margin-top: 8px;">
                Ultimo aggiornamento: ${ultimoOrario}
            </div>
        `;

        // Se non siamo in fase di verifica o già accesi, abilitiamo il tasto accendi
        if (statoAttuale === "spenta") {
            btnAccendi.disabled = false;
        }

    } catch (errore) {
        console.error("Errore di rete col sensore:", errore);
        if (ultimaTemp !== null) {
            tempDisplay.innerHTML = `
                --.- °C
                <div style="font-size: 14px; color: #d32f2f; font-weight: normal; margin-top: 8px;">
                    Sensore offline. Ultima: <b>${ultimaTemp} °C</b> alle ${ultimoOrario}
                </div>
            `;
        }
    }
}

// Chiediamo i dati del sensore ogni 10 secondi
setInterval(aggiornaDatiStufa, 10000);
aggiornaDatiStufa();

// --- 2. LOGICA DI ACCENSIONE E VERIFICA (POST + Timer) ---
btnAccendi.addEventListener('click', async function() {
    if (ultimaTemp === null) {
        alert("Attendi la lettura della temperatura prima di accendere.");
        return;
    }

    statoAttuale = "verifica";
    tempT0 = ultimaTemp; // Registriamo la temperatura T0
    
    // Aggiorniamo la UI
    statoStufa.innerHTML = "In accensione... 🟡";
    statoStufa.className = "status-attesa";
    btnAccendi.disabled = true;
    btnSpegni.disabled = false; // Permettiamo di annullare
    boxNotifiche.innerHTML = `Comando inviato. Temperatura iniziale (T0): <b>${tempT0}°C</b>. Attesa di 20 minuti per la verifica... ⏳`;

    try {
        // Inviamo il comando al Servo
        const response = await fetch(`${API_SERVO}/accendi`, { method: 'POST' });
        if (!response.ok) throw new Error(`Errore dal servo: ${response.status}`);

        // Facciamo partire il timer di 20 minuti (20 * 60 * 1000 millisecondi)
        // NOTA: Per fare dei test veloci, puoi cambiare 20 in 1 (1 minuto)
        const tempoAttesaMinuti = 20; 
        
        timerVerifica = setTimeout(() => {
            verificaAccensione();
        }, tempoAttesaMinuti * 60 * 1000);

    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore di comunicazione col Servo. <br><small>${errore.message}</small>`;
        statoAttuale = "spenta";
        statoStufa.innerHTML = "Spenta 🔴";
        statoStufa.className = "status-spenta";
        btnAccendi.disabled = false;
    }
});

// Funzione che scatta dopo 20 minuti
function verificaAccensione() {
    const tempT20 = ultimaTemp;
    
    if (tempT20 > tempT0) {
        // La temperatura è salita: Accensione riuscita!
        statoAttuale = "accesa";
        statoStufa.innerHTML = "Accesa 🟢";
        statoStufa.className = "status-accesa";
        btnAccendi.disabled = true;
        btnSpegni.disabled = false;
        boxNotifiche.innerHTML = `✅ <b>Accensione riuscita:</b> Temperatura salita da ${tempT0}°C a ${tempT20}°C. La stufa è accesa.`;
    } else {
        // La temperatura non è salita: Accensione fallita
        statoAttuale = "spenta";
        statoStufa.innerHTML = "Fallita 🔴";
        statoStufa.className = "status-spenta";
        btnAccendi.disabled = false;
        btnSpegni.disabled = true;
        boxNotifiche.innerHTML = `❌ <b>Accensione fallita:</b> Temperatura invariata o scesa (${tempT20}°C). La stufa non si è accesa.`;
    }
}

// --- 3. LOGICA DI SPEGNIMENTO (POST) ---
btnSpegni.addEventListener('click', async function() {
    statoStufa.innerHTML = "Spegnimento... 🔴";
    btnSpegni.disabled = true;
    
    // Se c'era una verifica in corso, la annulliamo
    if (timerVerifica) clearTimeout(timerVerifica);

    try {
        const response = await fetch(`${API_SERVO}/spegni`, { method: 'POST' });
        if (!response.ok) throw new Error(`Errore dal servo: ${response.status}`);
        
        statoAttuale = "spenta";
        statoStufa.innerHTML = "Spenta 🔴";
        statoStufa.className = "status-spenta";
        btnAccendi.disabled = false;
        boxNotifiche.innerHTML = "Comando di spegnimento inviato con successo.";

    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore. Impossibile spegnere il servo. <br><small>${errore.message}</small>`;
        btnSpegni.disabled = false;
    }
});

// --- 4. GRAFICO E STORICO (MOCK) ---
// (Mantenuto il codice originale per il grafico e il form dello storico)
const inputOrario = document.getElementById('input-orario');
const btnCercaStorico = document.getElementById('btn-cerca-storico');
const risultatoStorico = document.getElementById('risultato-storico');

btnCercaStorico.addEventListener('click', function() {
    const oraScelta = inputOrario.value;
    if (!oraScelta) {
        risultatoStorico.innerHTML = "⚠️ Inserisci un orario valido.";
        return;
    }
    risultatoStorico.innerHTML = `(Funzione storico in arrivo! Il server backend non è ancora collegato al DB per le ${oraScelta}).`;
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
