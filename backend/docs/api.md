# API Documentation

## Base URL

```
http://localhost:8000
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/v1/auth/login`.

## Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Application liveness check |
| GET | `/health/ready` | No | Readiness check (verifies DB) |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register a new user |
| POST | `/api/v1/auth/login` | No | Login and receive JWT |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users/me` | Yes | Get current user profile |
| GET | `/api/v1/users/` | Yes | List users (paginated) |
| GET | `/api/v1/users/{id}` | Yes | Get user by ID |
| PUT | `/api/v1/users/{id}` | Yes | Update user |

### Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/projects` | Yes | Create project |
| GET | `/api/v1/projects` | Yes | List projects |
| GET | `/api/v1/projects/{id}` | Yes | Get project |
| PUT | `/api/v1/projects/{id}` | Yes | Update project |
| DELETE | `/api/v1/projects/{id}` | Yes | Delete project |

### Houses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/houses` | Yes | Create house |
| GET | `/api/v1/houses` | Yes | List houses |
| GET | `/api/v1/houses/{id}` | Yes | Get house |
| PUT | `/api/v1/houses/{id}` | Yes | Update house |
| DELETE | `/api/v1/houses/{id}` | Yes | Delete house |

### Applications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/applications` | Yes | Create application |
| GET | `/api/v1/applications` | Yes | List applications |
| GET | `/api/v1/applications/{id}` | Yes | Get application |
| PUT | `/api/v1/applications/{id}` | Yes | Update application status |

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/payments/` | Yes | Create payment |
| GET | `/api/v1/payments/` | Yes | List payments |
| GET | `/api/v1/payments/{id}` | Yes | Get payment |
| PUT | `/api/v1/payments/{id}` | Yes | Update payment |

## Error Responses

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found"
  }
}
```

## Swagger UI

Available at `http://localhost:8000/docs`.
