import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from backend.app.config import API_TITLE, API_VERSION, API_DESCRIPTION, ALLOWED_ORIGINS
from backend.app.database import engine, Base, SessionLocal
from backend.app.services.seeder import run_seed
from backend.app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    print("--------------------------------------------------")
    print(f"Starting {API_TITLE} ({API_VERSION})")
    print("Initializing SQLite database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed database if empty
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    
    print("System ready. Swagger UI available at /docs")
    print("--------------------------------------------------")
    yield
    print("Shutting down Soil Health Monitoring Backend...")

def create_app() -> FastAPI:
    app = FastAPI(
        title=API_TITLE,
        version=API_VERSION,
        description=API_DESCRIPTION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # CORS Middleware to allow React frontend on port 5173
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API Router
    app.include_router(api_router)

    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": "Welcome to TerraPulse Soil Health Monitoring Backend",
            "docs": "/docs",
            "health": "/api/v1/health",
            "version": API_VERSION
        }

    return app

app = create_app()
