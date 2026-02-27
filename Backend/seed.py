import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import get_password_hash
from app.config import settings

INITIAL_USERS = [
    {
        "empID": "E001",
        "name": "Rahul Mehta",
        "role": "Graphic Designer",
        "team": "branding",
        "email": "rahul@example.com",
        "hashed_password": get_password_hash("admin123")
    },
    {
        "empID": "E002",
        "name": "Priya Sharma",
        "role": "SEO Specialist",
        "team": "seo",
        "email": "priya@example.com",
        "hashed_password": get_password_hash("admin123")
    },
    {
        "empID": "E003",
        "name": "Admin User",
        "role": "Manager",
        "team": "admin",
        "email": "admin@reachskyline.com",
        "hashed_password": get_password_hash("supersecret"),   # <-- comma added here
        "is_admin": True
    }
]

async def seed_db():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DB_NAME]

    for user in INITIAL_USERS:
        existing = await db.users.find_one({"empID": user["empID"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"Added user: {user['name']} ({user['empID']})")
        else:
            print(f"User {user['empID']} already exists. Skipping.")

    print("Seeding completed.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_db())