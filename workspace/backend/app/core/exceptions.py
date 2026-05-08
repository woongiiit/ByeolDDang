from fastapi import HTTPException, status


class AppError(HTTPException):
    code: str = "INTERNAL"
    default_status: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str, *, details: dict | None = None, status_code: int | None = None):
        super().__init__(
            status_code=status_code or self.default_status,
            detail={"code": self.code, "message": message, "details": details or {}},
        )


class NotFound(AppError):
    code = "NOT_FOUND"
    default_status = status.HTTP_404_NOT_FOUND


class Unauthenticated(AppError):
    code = "UNAUTHENTICATED"
    default_status = status.HTTP_401_UNAUTHORIZED


class Forbidden(AppError):
    code = "FORBIDDEN"
    default_status = status.HTTP_403_FORBIDDEN


class Conflict(AppError):
    code = "CONFLICT"
    default_status = status.HTTP_409_CONFLICT


class Unprocessable(AppError):
    code = "UNPROCESSABLE"
    default_status = status.HTTP_422_UNPROCESSABLE_ENTITY
