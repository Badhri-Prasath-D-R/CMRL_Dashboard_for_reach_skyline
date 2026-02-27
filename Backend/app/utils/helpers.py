import re
from datetime import datetime

async def generate_client_id(db):
    # Get all clients, find max numeric part of clientID
    cursor = db["clients"].find({}, {"clientID": 1}).sort("clientID", -1).limit(1)
    last_client = await cursor.to_list(length=1)
    if not last_client:
        return "C001"
    last_id = last_client[0]["clientID"]
    match = re.search(r"C(\d+)", last_id)
    if match:
        num = int(match.group(1)) + 1
        return f"C{num:03d}"
    return "C001"

def generate_activity_code(clientID, service_type, sequence=1):
    date = datetime.now()
    year_digit = str(date.year)[-1]
    month = date.month
    # Extract numeric part from clientID
    match = re.search(r"C(\d+)", clientID)
    client_num = match.group(1) if match else "0"
    type_map = {
        "Web": "W", "SEO": "S", "Campaign": "CA", "Calls": "CL",
        "Posters": "P", "Reels": "R", "Shorts": "S", "Longform": "L",
        "Carousel": "C", "EventDay": "ED", "Blog": "B"
    }
    type_code = type_map.get(service_type, "GEN")
    return f"{year_digit}{month}{client_num}{type_code}{sequence}"