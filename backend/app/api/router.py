from fastapi import APIRouter
from backend.app.api import health, locations, crops, readings, analytics

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(locations.router)
api_router.include_router(crops.router)
api_router.include_router(readings.router)
api_router.include_router(analytics.router)
