from fastapi import APIRouter
from backend.app.api import health, locations, crops, readings, analytics, webhooks, auth, users, ai

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(health.router)
api_router.include_router(locations.router)
api_router.include_router(crops.router)
api_router.include_router(readings.router)
api_router.include_router(analytics.router)
api_router.include_router(analytics.comparison_router)
api_router.include_router(webhooks.router)
api_router.include_router(ai.router)
