# Deployment

## Local Development

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials

# Start with Docker Compose
docker compose up --build

# Or run directly
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker build -t hms-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db \
  -e JWT_SECRET_KEY=your-secret-key \
  hms-backend
```

## Production

1. Set all environment variables (see `.env.example`)
2. Use a strong `JWT_SECRET_KEY` (minimum 32 characters)
3. Set `ENVIRONMENT=production`
4. Set `DEBUG=false`
5. Configure `CORS_ORIGINS` with your frontend domain
6. Run database migrations: `alembic upgrade head`
7. Seed initial admin: `python scripts/seed_db.py`
8. Run with gunicorn: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Testing

```bash
pytest tests/ -v --cov=app
```
