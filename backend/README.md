# HMS BuildPay Backend

Housing Management System - Backend API built with FastAPI, SQLAlchemy, and PostgreSQL.

## Architecture

```
API Endpoints → Services → Repositories → Database
```

- **API** (`app/api/`): HTTP routing, request/response handling
- **Services** (`app/services/`): Business logic
- **Repositories** (`app/repositories/`): Database access
- **Models** (`app/models/`): SQLAlchemy ORM models
- **Schemas** (`app/schemas/`): Pydantic validation models
- **Core** (`app/core/`): Config, security, database, exceptions

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Docker (optional)

### Local Development

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Seed initial data
python scripts/seed_db.py

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Compose

```bash
cd backend
docker compose up --build
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 8000

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | Yes | - |
| `JWT_SECRET_KEY` | Secret for JWT signing | Yes | - |
| `JWT_ALGORITHM` | JWT algorithm | No | HS256 |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | No | 30 |
| `CORS_ORIGINS` | Allowed CORS origins | No | http://localhost:5173 |
| `ENVIRONMENT` | App environment | No | development |
| `DEBUG` | Debug mode | No | false |

## API Endpoints

### Health
- `GET /health` - Liveness check
- `GET /health/ready` - Readiness check (DB)

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login (returns JWT)

### Users
- `GET /api/v1/users/me` - Current user profile
- `GET /api/v1/users/` - List users
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user

### Projects
- `POST /api/v1/projects` - Create
- `GET /api/v1/projects` - List
- `GET /api/v1/projects/{id}` - Get
- `PUT /api/v1/projects/{id}` - Update
- `DELETE /api/v1/projects/{id}` - Delete

### Houses
- `POST /api/v1/houses` - Create
- `GET /api/v1/houses` - List
- `GET /api/v1/houses/{id}` - Get
- `PUT /api/v1/houses/{id}` - Update
- `DELETE /api/v1/houses/{id}` - Delete

### Applications
- `POST /api/v1/applications` - Create
- `GET /api/v1/applications` - List
- `GET /api/v1/applications/{id}` - Get
- `PUT /api/v1/applications/{id}` - Update status

### Payments
- `POST /api/v1/payments/` - Create
- `GET /api/v1/payments/` - List
- `GET /api/v1/payments/{id}` - Get
- `PUT /api/v1/payments/{id}` - Update

## Testing

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v
```

## Code Quality

```bash
# Lint
ruff check app/ tests/

# Format
ruff format app/ tests/

# Both
ruff check app/ tests/ && ruff format --check app/ tests/
```

## Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Production

```bash
# Set production environment
export ENVIRONMENT=production
export DEBUG=false
export JWT_SECRET_KEY=<strong-random-secret>
export DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db

# Run
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Documentation

- API docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`
- Architecture: [docs/architecture.md](docs/architecture.md)
- Deployment: [docs/deployment.md](docs/deployment.md)
