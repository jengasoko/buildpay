# Architecture

## Dependency Flow

```
API Endpoints → Services → Repositories → Database
```

## Layers

### API Layer (`app/api/`)
- Handles HTTP concerns (routing, request parsing, response formatting)
- Validates input via Pydantic schemas
- Delegates business logic to services
- Uses dependency injection for database sessions and auth

### Service Layer (`app/services/`)
- Contains business logic
- Orchestrates repository calls
- Handles validation rules beyond schema validation
- Raises domain-specific exceptions

### Repository Layer (`app/repositories/`)
- Handles database access
- Encapsulates SQLAlchemy queries
- No business logic, pure data access

### Model Layer (`app/models/`)
- SQLAlchemy ORM models
- Define database schema and relationships
- No business logic

### Schema Layer (`app/schemas/`)
- Pydantic models for request/response validation
- Separate from database models
- API contract definition

### Core Layer (`app/core/`)
- Configuration (pydantic-settings)
- Security (JWT, password hashing)
- Database engine and sessions
- Exception definitions
- Logging setup

### Middleware (`app/middleware/`)
- CORS configuration
- Request ID tracking
- Request logging

### Tasks (`app/tasks/`)
- Background operations (email, payment notifications)
- Uses FastAPI BackgroundTasks

## Database

PostgreSQL with SQLAlchemy ORM. Migrations managed by Alembic.

## Authentication

JWT-based. Tokens contain user ID and role. Protected endpoints verify token and user status.
