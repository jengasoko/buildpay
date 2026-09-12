from fastapi import APIRouter

from app.api.v1.endpoints import auth, entities, health, payments, users

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(payments.router)
api_router.include_router(entities.router)
