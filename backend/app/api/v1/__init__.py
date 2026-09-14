from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    dashboard,
    employments,
    entities,
    health,
    logs,
    notifications,
    occupancies,
    payments,
    users,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(payments.router)
api_router.include_router(entities.router)
api_router.include_router(logs.router)
api_router.include_router(dashboard.router)
api_router.include_router(employments.router)
api_router.include_router(occupancies.router)
api_router.include_router(notifications.router)
