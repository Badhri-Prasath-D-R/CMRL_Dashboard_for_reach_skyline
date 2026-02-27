from fastapi import APIRouter, HTTPException
from app.database import db

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("/")
async def health_check():
    health_status = {
        "status": "online",
        "database": "disconnected"
    }
    
    try:
        # We try to ping the MongoDB server
        # 'ping' is a low-latency command to check connectivity
        await db.client.admin.command('ping')
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["error"] = str(e)
        # We return a 503 Service Unavailable if the DB is down
        raise HTTPException(status_code=503, detail=health_status)
        
    return health_status