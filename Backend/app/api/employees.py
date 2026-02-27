from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.database import db
from app.core.dependencies import get_current_user, get_current_admin_user
from bson import ObjectId
from app.core.security import get_password_hash

router = APIRouter(prefix="/employees", tags=["Employees"])

# Dependency to ensure admin
async def get_current_admin_user(current_user = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.get("/", response_model=List[UserOut])
async def get_employees(team: str = None, current_user = Depends(get_current_user)):
    query = {}
    if team:
        query["team"] = team
    cursor = db.db["users"].find(query, {"hashed_password": 0})
    users = await cursor.to_list(length=None)
    for u in users:
        u["id"] = str(u["_id"])
    return users

@router.get("/{emp_id}", response_model=UserOut)
async def get_employee(emp_id: str, current_user = Depends(get_current_user)):
    user = await db.db["users"].find_one({"empID": emp_id}, {"hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    user["id"] = str(user["_id"])
    return user

# Admin-only endpoints
@router.post("/", response_model=UserOut)
async def create_employee(employee: UserCreate, current_admin = Depends(get_current_admin_user)):
    # Check if empID or email already exists
    existing = await db.db["users"].find_one({"$or": [{"empID": employee.empID}, {"email": employee.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID or email already exists")
    # Hash password
    hashed = get_password_hash(employee.password)
    user_dict = employee.dict(exclude={"password"})
    user_dict["hashed_password"] = hashed
    user_dict["is_admin"] = employee.is_admin or False
    result = await db.db["users"].insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

@router.put("/{emp_id}", response_model=UserOut)
async def update_employee(emp_id: str, update_data: UserUpdate, current_admin = Depends(get_current_admin_user)):
    obj_id = ObjectId(emp_id)
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items() if v is not None}
    if "password" in update_dict:
        update_dict["hashed_password"] = get_password_hash(update_dict.pop("password"))
    if update_dict:
        await db.db["users"].update_one({"_id": obj_id}, {"$set": update_dict})
    updated = await db.db["users"].find_one({"_id": obj_id}, {"hashed_password": 0})
    updated["id"] = str(updated["_id"])
    return updated

@router.delete("/{emp_id}")
async def delete_employee(emp_id: str, current_admin = Depends(get_current_admin_user)):
    obj_id = ObjectId(emp_id)
    await db.db["users"].delete_one({"_id": obj_id})
    return {"message": "Employee deleted"}