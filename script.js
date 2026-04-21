// --- ELEMENTI DEL DOM ---
const btnAccendi = document.getElementById('btn-accendi');
const btnSpegni = document.getElementById('btn-spegni');
const statoStufa = document.getElementById('stato-stufa');
const boxNotifiche = document.getElementById('notifiche');
const tempDisplay = document.getElementById('temp-display');
const timerDisplay = document.getElementById('timer-riscaldamento');

// --- INDIRIZZI IP DEI DISPOSITIVI (ora non sono veri perchè non ho ancora i dispositivi)-
const RELAY_IP = "http://192.168.1.100";  // IP del Relè (Stufa)
const TEMP_IP = "http://192.168.1.101";   // IP del Termometro Wi-Fi

// --- VARIABILI DI STATO ---
let ultimaTemp = null;
let ultimoOrario = null;
let tempT0 = null;
let intervalloCountdown = null;

// --- INIZIALIZZAZIONE GRAFICO VUOTO ---
const ctx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Array vuoto per gli orari
        datasets: [{
            label: 'Temperatura (°C)',
            data: [], // Array vuoto per i gradi
            borderColor: '#f57c00',
            backgroundColor: 'rgba(245, 124, 0, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: false,
                suggestedMin: 15,
                suggestedMax: 25
            }
        }
    }
});

// --- 1. LETTURA STATO E TEMPERATURA REALE ---
async function aggiornaDati() {
    try {
        // A. Interroga il Termometro per i gradi
        const resTemp = await fetch(`${TEMP_IP}/rpc/Shelly.GetStatus`);
        if (!resTemp.ok) throw new Error("Errore Termometro");
        const datiTemp = await resTemp.json();
        
        // B. Interroga il Relè per lo stato della stufa
        const resRelay = await fetch(`${RELAY_IP}/rpc/Shelly.GetStatus`);
        if (!resRelay.ok) throw new Error("Errore Relè Stufa");
        const datiRelay = await resRelay.json(); 
        
        // Orario attuale
        const adesso = new Date();
        ultimoOrario = adesso.getHours().toString().padStart(2, '0') + ":" + adesso.getMinutes().toString().padStart(2, '0');
        
        // Estrazione dati 
        ultimaTemp = datiTemp['temperature:0'] ? datiTemp['temperature:0'].tC : "--.-";
        const releAcceso = datiRelay['switch:0'].output === true;
        
        // Aggiornamento Testo Temperatura
        tempDisplay.innerHTML = `
            ${ultimaTemp} °C
            <div style="font-size: 14px; color: #666; font-weight: normal; margin-top: 8px;">
                Ultimo aggiornamento: ${ultimoOrario}
            </div>
        `;

        // AGGIORNAMENTO DINAMICO DEL GRAFICO IN TEMPO REALE
        if (ultimaTemp !== "--.-") {
            const tempNumerica = parseFloat(ultimaTemp);
            
            // Aggiungiamo solo se l'orario è diverso dall'ultimo punto (per evitare doppioni nello stesso minuto)
            const ultimoLabel = tempChart.data.labels[tempChart.data.labels.length - 1];
            if (ultimoLabel !== ultimoOrario) {
                tempChart.data.labels.push(ultimoOrario);
                tempChart.data.datasets[0].data.push(tempNumerica);

                // Manteniamo solo le ultime 30 letture a schermo
                if (tempChart.data.labels.length > 30) {
                    tempChart.data.labels.shift();
                    tempChart.data.datasets[0].data.shift();
                }
                tempChart.update();
            }
        }

        // Aggiornamento Pulsanti e Stato
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

        if (boxNotifiche.innerText.includes("In attesa") || boxNotifiche.innerText.includes("Errore")) {
             boxNotifiche.innerHTML = "✅ Sistema online. In attesa di comandi.";
        }

    } catch (errore) {
        console.error("Errore di rete:", errore);
        statoStufa.innerHTML = "Disconnesso ⚠️";
        statoStufa.className = "status-spenta";
        btnAccendi.disabled = true;
        btnSpegni.disabled = true;
        boxNotifiche.innerHTML = `⚠️ Comunicazione interrotta. Verifica che Relè e Termometro siano accesi e connessi al Wi-Fi.`;
    }
}

// Avvia il controllo ogni 5 secondi
setInterval(aggiornaDati, 5000);
aggiornaDati();

// --- FUNZIONE TIMER DI VERIFICA (20 MIN) ---
function avviaCountdownVerifica() {
    if (intervalloCountdown) clearInterval(intervalloCountdown);
    
    let tempoRimanente = 20 * 60; // 20 minuti
    timerDisplay.style.display = "block";

    intervalloCountdown = setInterval(() => {
        tempoRimanente--;
        let min = Math.floor(tempoRimanente / 60).toString().padStart(2, '0');
        let sec = (tempoRimanente % 60).toString().padStart(2, '0');
        
        timerDisplay.innerHTML = `⏳ Verifica accensione in: ${min}:${sec} <br> <small>(Partita da: ${tempT0}°C)</small>`;

        if (tempoRimanente <= 0) {
            clearInterval(intervalloCountdown);
            timerDisplay.style.display = "none";
            
            let delta = (parseFloat(ultimaTemp) - tempT0).toFixed(1);
            if (delta > 0) {
                boxNotifiche.innerHTML = `🔥 <b>Stufa a regime:</b> Temp. salita di ${delta}°C.`;
            } else {
                boxNotifiche.innerHTML = `⚠️ <b>Attenzione:</b> Dopo 20 min temperatura invariata. Verifica la stufa.`;
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
        if (!response.ok) throw new Error("Errore API");
        boxNotifiche.innerHTML = `✅ Comando inviato. La stufa si sta accendendo.`;
        tempT0 = (ultimaTemp && ultimaTemp !== "--.-") ? parseFloat(ultimaTemp) : null;
        if (tempT0 !== null) avviaCountdownVerifica();
        setTimeout(aggiornaDati, 1000); 
    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore accensione: Impossibile contattare il relè.`;
        btnAccendi.disabled = false;
    }
});

// --- 3. LOGICA DI SPEGNIMENTO ---
btnSpegni.addEventListener('click', async function() {
    boxNotifiche.innerHTML = "⏳ Invio comando di spegnimento...";
    btnSpegni.disabled = true;
    try {
        const response = await fetch(`${RELAY_IP}/rpc/Switch.Set?id=0&on=false`);
        if (!response.ok) throw new Error("Errore API");
        boxNotifiche.innerHTML = `✅ Comando inviato. Stufa in spegnimento.`;
        if (intervalloCountdown) {
            clearInterval(intervalloCountdown);
            timerDisplay.style.display = "none";
        }
        setTimeout(aggiornaDati, 1000); 
    } catch (errore) {
        boxNotifiche.innerHTML = `⚠️ Errore spegnimento: Impossibile contattare il relè.`;
        btnSpegni.disabled = false;
    }
});