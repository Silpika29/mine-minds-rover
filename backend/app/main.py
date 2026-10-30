import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import Base, engine
from app.websocket.manager import ws_manager
from app.simulator.rover_simulator import simulator

# Import API routers
from app.api.auth import router as auth_router
from app.api.mines import router as mines_router
from app.api.rovers import router as rovers_router
from app.api.sensors import router as sensors_router
from app.api.alerts import router as alerts_router
from app.api.patrols import router as patrols_router
from app.api.analytics import router as analytics_router
from app.api.ml import router as ml_router
from app.api.reports import router as reports_router
from app.api.admin import router as admin_router
from app.api.simulator import router as simulator_router
from app.api.health import router as health_router
from app.api.settings import router as settings_router
from app.api.maps import router as maps_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not present
    Base.metadata.create_all(bind=engine)
    print("Database tables verified.")
    await simulator.start()
    print("Autonomous patrol simulator started.")
    yield
    await simulator.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Mining Safety Rover - AI-Powered Underground Safety Monitoring & Patrol System API",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(mines_router, prefix=settings.API_V1_STR)
app.include_router(rovers_router, prefix=settings.API_V1_STR)
app.include_router(sensors_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(patrols_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ml_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(simulator_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(maps_router, prefix=settings.API_V1_STR)

# Serve uploaded maps as static files
import os
upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "maps")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads/maps", StaticFiles(directory=upload_dir), name="map_uploads")

# Centralized WebSocket Live Endpoint
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive and receive any client-side commands or ping
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "system": "MINING SAFETY ROVER - AI-POWERED PATROL & SAFETY MONITORING",
        "status": "OPERATIONAL",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs",
        "websocket_url": "/ws/live"
    }
