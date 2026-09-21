import contextlib
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.v1 import api_router
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AppException
from app.middleware import RequestIDMiddleware, setup_cors

logger = logging.getLogger("hms")

_docs_enabled = settings.ENVIRONMENT != "production"

app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

setup_cors(app)
app.add_middleware(RequestIDMiddleware)

app.include_router(api_router)


@app.get("/health", tags=["Health"])
def root_health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/health/ready", tags=["Health"])
def root_readiness_check():
    from sqlalchemy.orm import Session

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    with contextlib.suppress(StopIteration):
        next(db_gen)
    return {"status": "ok" if db_status == "healthy" else "degraded", "database": db_status}


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.error_code, "message": exc.error_message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        loc = " -> ".join(str(part) for part in error["loc"])
        errors.append({"field": loc, "message": error["msg"]})
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Invalid request data", "details": errors}},
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"error": {"code": "CONFLICT", "message": "Data integrity constraint violated"}},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "DATABASE_ERROR", "message": "An unexpected database error occurred"}},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unexpected error")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
    )
