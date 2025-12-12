# BetBetter - Docker Setup

## 🚀 Szybki start

```bash
# Przejdź do głównego katalogu projektu
cd /home/grzegorz/Desktop/Engineering-project

# Zbuduj i uruchom wszystkie kontenery
docker compose up -d --build
```

---

## 📦 Budowanie kontenerów

### Zbuduj wszystkie kontenery (z przeładowaniem kodu)
```bash
docker compose build --no-cache
docker compose up -d
```

### Zbuduj i uruchom jednocześnie (najczęściej używane)
```bash
docker compose up -d --build
```

### Zbuduj tylko konkretny serwis
```bash
docker compose build backend
docker compose build frontend
docker compose build telegram_bot
```

---

## ▶️ Uruchamianie

### Uruchom wszystkie serwisy
```bash
docker compose up -d
```

### Uruchom konkretny serwis
```bash
docker compose up -d backend
docker compose up -d frontend
```

### Uruchom z logami na żywo
```bash
docker compose up
```

---

## ⏹️ Zatrzymywanie

### Zatrzymaj wszystkie kontenery (zwalnia porty)
```bash
docker compose down
```

### Zatrzymaj i usuń dane (UWAGA: usuwa bazę danych!)
```bash
docker compose down -v
```

### Zatrzymaj konkretny serwis
```bash
docker compose stop backend
docker compose stop telegram_bot
```

---

## 🔄 Restart po zmianach w kodzie

### Backend (Django) - przebuduj po zmianach
```bash
docker compose up -d --build backend
```

### Frontend (React) - przebuduj po zmianach
```bash
docker compose up -d --build frontend
```

### Telegram Bot - przebuduj po zmianach
```bash
docker compose up -d --build telegram_bot
```

### Przebuduj wszystko od zera
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 📋 Logi

### Wszystkie logi
```bash
docker compose logs -f
```

### Logi konkretnego serwisu
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f telegram_bot
docker compose logs -f db
```

### Ostatnie N linii logów
```bash
docker compose logs --tail 50 backend
```

---

## 🔧 Zarządzanie

### Status kontenerów
```bash
docker compose ps
```

### Wejdź do kontenera (shell)
```bash
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB
```

### Restart serwisu
```bash
docker compose restart backend
docker compose restart telegram_bot
```

---

## 🗄️ Migracje Django

### Utwórz nową migrację
```bash
docker compose exec backend python manage.py makemigrations
```

### Zastosuj migracje
```bash
docker compose exec backend python manage.py migrate
```

### Utwórz superusera
```bash
docker compose exec backend python manage.py createsuperuser
```

---

## 🌐 Dostęp do aplikacji

| Serwis | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Swagger Docs | http://localhost:8000/swagger/ |
| PostgreSQL | localhost:5433 |
| PgAdmin (opcjonalnie) | http://localhost:5050 |

---

## 🐛 Troubleshooting

### Konflikt nazw kontenerów
```bash
# Błąd: "container name is already in use"
# Usuń stare kontenery:
docker rm -f betbetter_postgres betbetter_backend betbetter_frontend betbetter_telegram_bot

# Następnie uruchom ponownie:
docker compose up -d --build
```

### Port zajęty
```bash
# Sprawdź co używa portu
sudo lsof -i :8000
sudo lsof -i :3000

# Zatrzymaj wszystkie kontenery
docker compose down
```

### Kontener się restartuje
```bash
# Sprawdź logi
docker compose logs telegram_bot --tail 50
```

### Wyczyść wszystko i zacznij od nowa
```bash
docker compose down -v
docker system prune -f
docker compose up -d --build
```

---

## 📁 Struktura plików Docker

```
Engineering-project/
├── docker-compose.yml          # Główny plik compose
├── .env.example                # Przykładowa konfiguracja
├── DOCKER.md                   # Ta instrukcja
├── backend/
│   ├── Dockerfile              # Telegram bot (Alpine, bez OCR)
│   ├── Dockerfile.server       # Backend API (Debian, z PaddleOCR)
│   ├── requirements.txt        # Zależności backendu (z PaddleOCR)
│   ├── requirements-bot.txt    # Zależności bota (bez PaddleOCR)
│   ├── .env                    # Zmienne środowiskowe
│   └── pg_data/                # Dane PostgreSQL
└── frontend/
    ├── Dockerfile              # Multi-stage: Node → Nginx
    └── nginx.conf              # Konfiguracja Nginx
```

