FROM python:3.12-alpine

WORKDIR /app

# Zainstaluj build tools potrzebne dla psutil
RUN apk add --no-cache gcc python3-dev musl-dev linux-headers

# Użyj requirements-bot.txt (bez PaddleOCR)
COPY requirements-bot.txt .
RUN pip install --no-cache-dir -r requirements-bot.txt

# Usuń build tools po instalacji żeby zmniejszyć rozmiar obrazu
RUN apk del gcc python3-dev musl-dev linux-headers

COPY . .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD ["python", "bot/main.py"]


