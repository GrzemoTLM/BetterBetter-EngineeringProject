# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiuj pliki konfiguracyjne
COPY package*.json ./

# Instaluj zależności
RUN npm ci

# Kopiuj resztę kodu
COPY . .

# Ustaw zmienne środowiskowe dla builda
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_TELEGRAM_BOT_USERNAME=BetterBetter_bot

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_TELEGRAM_BOT_USERNAME=$VITE_TELEGRAM_BOT_USERNAME

# Buduj aplikację
RUN npm run build

# Stage 2: Production - nginx
FROM nginx:alpine

# Kopiuj zbudowaną aplikację
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiuj konfigurację nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

