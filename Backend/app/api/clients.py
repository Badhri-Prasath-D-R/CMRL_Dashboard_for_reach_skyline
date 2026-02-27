from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.schemas.client import ClientCreate, ClientOut
from app.database import db
from app.core.dependencies import get_current_user
from app.utils.helpers import generate_client_id
from bson import ObjectId
from app.utils.helpers import generate_activity_code

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("/", response_model=List[ClientOut])
async def get_clients(archived: Optional[bool] = False, current_user=Depends(get_current_user)):
    query = {"isArchived": archived}
    cursor = db.db["clients"].find(query)
    clients = await cursor.to_list(length=None)
    # Convert _id to id for response
    for c in clients:
        c["id"] = str(c["_id"])
    return clients

@router.post("/", response_model=ClientOut)
async def create_client(client_data: ClientCreate, current_user=Depends(get_current_user)):
    # Check if client exists with same name and phone (not archived)
    print("Received client data:", client_data)
    existing = await db.db["clients"].find_one({
        "clientName": client_data.clientName,
        "phone": client_data.phone,
        "isArchived": False
    })
    if existing:
        # Merge logic: update existing client with new deliverables
        # For simplicity, we'll just update the existing record with new counts added.
        # We'll need to sum counts/amounts/minutes.
        updated = dict(existing)
        for key in ["Web", "SEO", "Campaign", "Calls", "Posters", "Reels", "Shorts", "Longform", "Carousel", "EventDay", "Blog"]:
            if getattr(client_data, key) is not None:
                new_item = getattr(client_data, key)
                old_item = updated.get(key, {})
                # For checked/unchecked? In frontend, if checked is true, we add.
                # Since we don't have "checked" in schema, we assume if present and has count>0, it's selected.
                if new_item and new_item.get("count", 0) > 0:
                    # Merge counts, amounts, mins
                    old_count = old_item.get("count", 0)
                    old_amount = old_item.get("amount", 0) or old_item.get("amo", 0)
                    old_min = old_item.get("min", 0)
                    new_count = new_item.get("count", 0)
                    new_amount = new_item.get("amount", 0) or new_item.get("amo", 0)
                    new_min = new_item.get("min", 0)
                    updated[key] = {
                        "count": old_count + new_count,
                        "amount": old_amount + new_amount,
                        "min": old_min + new_min,
                        "description": new_item.get("description", old_item.get("description", ""))
                    }
                    # Also update activity codes? We'll generate new codes for the new items.
                    # But activityCodes is a dict, we may need to append. For now, skip.
        # Recalculate totalAmount
        total = 0
        for k in updated:
            if isinstance(updated[k], dict) and "amount" in updated[k]:
                total += updated[k]["amount"]
        updated["totalAmount"] = total
        # Keep clientID unchanged
        updated["isArchived"] = False
        await db.db["clients"].replace_one({"_id": existing["_id"]}, updated)
        updated["id"] = str(updated["_id"])
        return updated
    else:
        # New client
        client_id = await generate_client_id(db.db)
        # Compute totalAmount from deliverables
        total_amount = 0
        # We'll build the client document from client_data
        client_dict = client_data.dict()
        for key in ["Web", "SEO", "Campaign", "Calls", "Posters", "Reels", "Shorts", "Longform", "Carousel", "EventDay", "Blog"]:
            if key in client_dict and client_dict[key] and client_dict[key].get("count", 0) > 0:
                # Ensure amount field is set (use 'amount' or 'amo')
                item = client_dict[key]
                if "amo" in item and "amount" not in item:
                    item["amount"] = item["amo"]
                total_amount += item.get("amount", 0)
        client_dict["clientID"] = client_id
        client_dict["totalAmount"] = total_amount
        client_dict["isArchived"] = False
        # Generate activity codes for each selected service
        activity_codes = {}
        for key in client_dict:
            if key in ["Web", "SEO", "Campaign", "Calls", "Posters", "Reels", "Shorts", "Longform", "Carousel", "EventDay", "Blog"] and client_dict[key] and client_dict[key].get("count", 0) > 0:
                # Count sequence? For now, we'll just use 1 because each service appears once per client.
                activity_codes[key] = generate_activity_code(client_id, key, 1)
        client_dict["activityCodes"] = activity_codes

        result = await db.db["clients"].insert_one(client_dict)
        client_dict["id"] = str(result.inserted_id)
        return client_dict

@router.put("/{client_id}")
async def update_client(client_id: str, update_data: dict, current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(client_id)
        await db.db["clients"].update_one({"_id": obj_id}, {"$set": update_data})
        updated = await db.db["clients"].find_one({"_id": obj_id})
        if not updated:
            raise HTTPException(status_code=404, detail="Client not found")
        # Convert ObjectId to string and remove it
        updated["id"] = str(updated["_id"])
        del updated["_id"]  # <-- critical: remove the ObjectId
        return updated
    except Exception as e:
        print(f"Error updating client {client_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{client_id}")
async def delete_client(client_id: str, current_user=Depends(get_current_user)):
    obj_id = ObjectId(client_id)
    # Also delete associated tasks? Not required; tasks may remain but should be handled.
    await db.db["clients"].delete_one({"_id": obj_id})
    return {"message": "Client deleted"}