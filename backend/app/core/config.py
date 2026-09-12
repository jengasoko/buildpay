from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    APP_NAME: str = "HMS - BuildPay"
    ENVIRONMENT: str = Field(default="development", description="Application environment")
    DEBUG: bool = Field(default=False, description="Enable debug mode")

    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL connection URL, e.g. postgresql+psycopg2://user:pass@host:5432/db",
    )

    JWT_SECRET_KEY: str = Field(
        ...,
        description="Secret key for JWT token signing",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="JWT access token expiration in minutes")

    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173"],
        description="Allowed CORS origins",
    )

    DB_ECHO: bool = Field(default=False, description="Enable SQL query logging")


settings = Settings()
