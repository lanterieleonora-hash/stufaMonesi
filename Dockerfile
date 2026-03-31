# Usa un'immagine Nginx leggera basata su Alpine Linux
FROM nginx:alpine

# Rimuove la pagina di default di Nginx per fare spazio ai nostri file
RUN rm -rf /usr/share/nginx/html/*

# Copia i file necessari per la web app nella cartella pubblica del server
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Indica che il container ascolterà le connessioni sulla porta 80 (HTTP)
EXPOSE 80

# Avvia il server Nginx
CMD ["nginx", "-g", "daemon off;"]