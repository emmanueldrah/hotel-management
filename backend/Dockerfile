FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install pydantic-settings httpx pytest reportlab python-jose[cryptography] passlib[bcrypt]

COPY . .

# Script to wait for DB and seed
RUN echo "#!/bin/bash\npython app/db/seed.py\nuvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" > /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
