from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin as admin_router
from app.routers import auth as auth_router
from app.routers import properties as properties_router
from app.routers import purchase as purchase_router
from app.routers import reviews as reviews_router
from app.routers import wallet as wallet_router


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.2.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    async def health():
        return {"status": "ok", "env": settings.app_env}

    api_v1 = "/v1"
    app.include_router(auth_router.router, prefix=api_v1)
    app.include_router(auth_router.me_router, prefix=api_v1)
    app.include_router(properties_router.router, prefix=api_v1)
    app.include_router(properties_router.broker_router, prefix=api_v1)
    app.include_router(reviews_router.router, prefix=api_v1)
    app.include_router(reviews_router.appraiser_router, prefix=api_v1)
    app.include_router(wallet_router.router, prefix=api_v1)
    app.include_router(purchase_router.router, prefix=api_v1)
    app.include_router(admin_router.router, prefix=api_v1)

    return app


app = create_app()
