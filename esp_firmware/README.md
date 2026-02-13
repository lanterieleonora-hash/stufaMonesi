\# stufaMonesi

\# Sistema di Accensione e Spegnimento Remoto per Stufa con Monitoraggio della Temperatura



\## Panoramica del Progetto

Questo progetto permette di accendere e spegnere una stufa da remoto tramite una \*\*web app\*\*, anche se la stufa non dispone di funzionalità smart.  

Il sistema utilizza un servo motore per premere fisicamente il pulsante della stufa e un sensore di temperatura per monitorare l’ambiente e verificare automaticamente se l’accensione è avvenuta con successo.  

In ogni momento, dalla web app è possibile visualizzare la \*\*temperatura attuale rilevata dal sensore\*\*.



\## Componenti Principali



\### Microcontrollore

\- ESP8266 o ESP32  

\- Connessione Wi‑Fi integrata  

\- Gestisce servo, sensore, notifiche e comunicazione con la web app



\### Servo Motore

\- Modello consigliato: SG90 o MG996R  

\- Installato davanti al pulsante della stufa  





\### Sensore di Temperatura

Possibili scelte:

\- DHT22  

\- DS18B20  

\- BME280  



Il sensore fornisce:

\- Temperatura attuale  

\- Storico della giornata  

\- Variazioni utili a verificare l’accensione



\### Web App di Controllo

La web app permette di:

\- Accendere la stufa  

\- Spegnere la stufa  

\- Visualizzare \*\*in ogni momento\*\* la temperatura attuale del sensore  

\- Consultare il grafico delle variazioni giornaliere  

\- Ricevere notifiche automatiche sullo stato dell’accensione



La web app può essere ospitata:

\- Direttamente sull’ESP (mini server)  

\- Oppure su un server esterno che comunica con l’ESP tramite API



\## Funzionamento del Sistema



\### Accensione Remota

1\. L’utente apre la web app e preme “Accendi stufa”.  

2\. L’ESP registra la temperatura attuale (T0).  

3\. Il servo preme il pulsante di accensione.  

4\. L’ESP attende 20 minuti.  

5\. Dopo 20 minuti, il sensore rileva una nuova temperatura (T20).  

6\. Il sistema confronta T20 con T0:

&nbsp;  - Se T20 > T0 → \*\*Accensione riuscita\*\*  

&nbsp;  - Se T20 ≤ T0 → \*\*Accensione fallita\*\*  

7\. La web app riceve una notifica con l’esito.



\### Spegnimento Remoto

1\. L’utente preme “Spegni stufa” nella web app.  

2\. Il servo preme il pulsante di spegnimento.  

3\. L’azione viene registrata nella web app.  

4\. (Opzionale) Il sistema può monitorare il raffreddamento per confermare lo spegnimento.



\### Monitoraggio della Temperatura

Il sensore invia letture periodiche (es. ogni 1–5 minuti):

\- Temperatura attuale  

\- Storico della giornata  

\- Andamento e variazioni



La web app mostra:

\- Temperatura in tempo reale  

\- Grafico giornaliero  

\- Notifiche automatiche



\## Logica di Verifica dell’Accensione



| Fase | Azione |

|------|--------|

| T0 | Lettura temperatura al momento del comando |

| +20 min | Lettura temperatura T20 |

| Confronto | Se T20 > T0 → stufa accesa |

| Notifica | Inviata alla web app |



\### Esempio di Notifiche

\- \*\*Accensione riuscita:\*\* “Temperatura salita da 17.2°C a 18.4°C. La stufa è accesa.”  

\- \*\*Accensione fallita:\*\* “Temperatura invariata (17.2°C). La stufa non si è accesa.”



\## Esempio di Dati Registrati



| Orario | Temperatura | Note |

|-------|-------------|------|

| 08:00 | 17.2°C | Comando di accensione inviato |

| 08:20 | 18.4°C | Accensione riuscita |

| 09:00 | 20.1°C | Temperatura in aumento |





\## Considerazioni sulla Sicurezza

\- Montare il servo in modo stabile e sicuro  

\- Evitare pressioni eccessive sui pulsanti  

\- Assicurarsi che la stufa possa essere accesa senza rischi  

\- Implementare un timeout per evitare attivazioni ripetute

