from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.api import auth, clients, tasks, employees, efficiency
from app.api import auth, clients, tasks, employees, efficiency, health # Add health here

app = FastAPI(title="Reach Skyline CRM API")

# CORS - allow frontend origin (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://localhost:5173",
                   "http://127.0.0.1:5173"],  # React default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event handlers for DB connection
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(efficiency.router, prefix="/api")
app.include_router(health.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Reach Skyline CRM API"}