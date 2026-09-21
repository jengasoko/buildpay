from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.error_code = code
        self.error_message = message
        super().__init__(status_code=status_code, detail={"error": {"code": code, "message": message}})


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(
            code="BAD_REQUEST",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            code="CONFLICT",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
        )


class TooManyRequestsException(AppException):
    def __init__(self, message: str = "Too many requests, please try again later"):
        super().__init__(
            code="TOO_MANY_REQUESTS",
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )
