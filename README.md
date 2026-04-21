# stufaMonesi
# Sistema di Controllo Remoto per Stufa a Pellet via Contatto Pulito

## Panoramica del Progetto
Questo progetto permette di gestire l'accensione e lo spegnimento di una stufa da remoto tramite una web app. 
Il sistema sfrutta l'ingresso "Termostato Esterno" (o Contatto Pulito / Morsetto T.A.) presente sulla scheda madre della stufa a pellet. Collegando un relè Wi-Fi a questo ingresso, possiamo comandare la stufa simulando la richiesta di calore di un termostato.

## Componenti Principali

### Relè Smart (Contatto Pulito)
- **Consigliato:** Shelly Plus 1.
- Il relè si collega al Wi-Fi di casa ed espone delle API HTTP.
- I morsetti I/O (Input/Output a potenziale zero) del relè vanno collegati ai morsetti del termostato esterno della stufa.

### Sensore di Temperatura
- Utilizzando uno Shelly Plus 1, è possibile aggiungere lo "Shelly Plus Add-on" per collegare un sensore di temperatura (es. DS18B20) direttamente al relè.
- Questo permette di avere, interrogando un solo indirizzo IP, sia lo stato del contatto della stufa che la temperatura ambientale.

## Logica di Controllo e Verifica
Il sistema lavora su due livelli di conferma per garantire la massima affidabilità:

1. **Conferma Elettrica (Immediata):** Quando premi "Accendi", la web app ordina al relè di chiudere il contatto. Lo stato della stufa passa subito ad "Accesa".
2. **Controllo Fiamma (Timer 20 min):** Non appena il contatto viene chiuso, il sistema registra la temperatura (T0) e avvia un timer. Dopo 20 minuti, legge la nuova temperatura (T20). Se la temperatura è salita, conferma che la stufa sta scaldando. Altrimenti, invia un avviso di anomalia (es. pellet esaurito o mancata accensione).

## Web App (Docker)
L'interfaccia utente è servita tramite un container Nginx leggero che ospita i file statici (HTML, CSS, JS).

## link
per aprire la web app andare sull'indirizzo: http://localhost:8080
