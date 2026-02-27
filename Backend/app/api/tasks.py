from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.database import db
from app.core.dependencies import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[TaskOut])
async def get_tasks(
    team: Optional[str] = None,
    assignedTo: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    query = {}
    if team:
        query["team"] = team
    if assignedTo:
        query["assignedTo"] = assignedTo
    cursor = db.db["tasks"].find(query)
    tasks = await cursor.to_list(length=None)
    for t in tasks:
        t["id"] = str(t["_id"])
    return tasks

@router.post("/", response_model=TaskOut)
async def create_task(task_data: TaskCreate, current_user = Depends(get_current_user)):
    task_dict = task_data.dict()
    # Default status
    task_dict["status"] = "Pending"
    task_dict["remarks"] = ""
    task_dict["submissionLink"] = ""
    result = await db.db["tasks"].insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    # Optionally, update client to archived (if task is created from dashboard)
    # The frontend currently archives the client after sending to a team.
    # We'll handle that in a separate call from frontend or do it automatically.
    # For now, we'll not auto-archive; frontend will call update client.
    return task_dict

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, update_data: TaskUpdate, current_user = Depends(get_current_user)):
    obj_id = ObjectId(task_id)
    # Only update fields that are set
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if not update_dict:
        # nothing to update
        task = await db.db["tasks"].find_one({"_id": obj_id})
        task["id"] = str(task["_id"])
        return task
    await db.db["tasks"].update_one({"_id": obj_id}, {"$set": update_dict})
    updated = await db.db["tasks"].find_one({"_id": obj_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user = Depends(get_current_user)):
    obj_id = ObjectId(task_id)
    # Get task to retrieve clientID and amounts
    task = await db.db["tasks"].find_one({"_id": obj_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Subtract task amount from client's totalAmount
    client = await db.db["clients"].find_one({"clientID": task["clientID"]})
    if client:
        # Calculate total amount of task (sum of amount values)
        task_total = 0
        if task.get("amount"):
            task_total = sum(task["amount"].values())
        # Update client: subtract amount and reset the relevant service fields
        new_total = max(0, client.get("totalAmount", 0) - task_total)
        await db.db["clients"].update_one(
            {"_id": client["_id"]},
            {"$set": {"totalAmount": new_total}}
        )
        # Also reset service fields for that team? The frontend resets specific fields.
        # We'll need to identify which service fields correspond to this task's team.
        # For simplicity, we'll just update totalAmount; resetting service fields can be done later if needed.
    # Delete task
    await db.db["tasks"].delete_one({"_id": obj_id})
    return {"message": "Task deleted"}