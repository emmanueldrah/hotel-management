#!/bin/bash
# Wait for postgres
echo "Waiting for postgres..."
sleep 5
# Run migrations
# alembic upgrade head || true # Commented out as I use create_all in seed.py for simplicity in this demo
# Seed database
python app/db/seed.py
# Start application
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
