# stufaMonesi
# Sistema di Accensione Remota per Stufa con Monitoraggio della Temperatura

## Panoramica del Progetto
Questo progetto permette di accendere una stufa da remoto anche se non dispone di funzionalità smart.  
Il sistema utilizza un servo motore per premere fisicamente il pulsante di accensione e un sensore di temperatura per monitorare l’ambiente e verificare che la stufa si sia effettivamente attivata.

## Componenti Principali

### Microcontrollore
- ESP8266 o ESP32  
- Connessione Wi‑Fi integrata  
- Gestisce servo, sensore e comunicazione remota

### Servo Motore
- Modello consigliato: SG90 o MG996R  
- Installato davanti al pulsante della stufa  
- Esegue una pressione controllata quando riceve il comando remoto

### Sensore di Temperatura
Possibili scelte:
- DHT22  
- DS18B20  
- BME280  

Il sensore fornisce:
- Temperatura attuale  
- Storico della giornata  
- Variazioni utili a capire se la stufa si è accesa

### Interfaccia Remota
Può essere implementata tramite:
- Bot Telegram  
- Pagina web ospitata sul microcontrollore  
- API REST  
- Integrazione con Home Assistant  

## Funzionamento del Sistema

### Accensione Remota
1. L’utente invia un comando (es. “Accendi stufa”).  
2. Il microcontrollore riceve il comando via Wi‑Fi.  
3. Il servo si muove e preme il pulsante della stufa.  
4. Il sistema registra l’orario dell’azione.

### Monitoraggio della Temperatura
Il sensore invia letture periodiche (es. ogni 1–5 minuti):
- Temperatura attuale  
- Storico della giornata  
- Andamento e variazioni

### Verifica dell’Accensione
La stufa, una volta accesa, aumenta la temperatura della stanza.  
Il sistema confronta:
- Temperatura prima dell’accensione  
- Temperatura dopo 10–20 minuti  

Se la temperatura sale, la stufa è accesa.  
Se rimane stabile, potrebbe non essersi attivata.

## Esempio di Dati Registrati

| Orario | Temperatura | Note |
|-------|-------------|------|
| 08:00 | 17.2°C | Prima dell'accensione |
| 08:05 | 17.3°C | Servo attivato |
| 08:20 | 18.1°C | Stufa accesa correttamente |
| 09:00 | 20.4°C | Temperatura stabile |

## Possibili Estensioni Future
- Sensore di fiamma o vibrazione per conferma diretta  
- Notifiche automatiche (Telegram, email)  
- Controllo della potenza della stufa (se supportato)  
- Integrazione con sistemi di domotica  
- Alimentazione di backup

## Considerazioni sulla Sicurezza
- Montare il servo in modo stabile e sicuro  
- Evitare pressioni eccessive sul pulsante  
- Assicurarsi che la stufa possa essere accesa senza rischi  
- Implementare un timeout per evitare attivazioni ripetute
