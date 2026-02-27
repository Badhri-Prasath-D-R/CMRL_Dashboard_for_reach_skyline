from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserLogin, Token, UserOut
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.database import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.db["users"].find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user["empID"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user = Depends(get_current_user)):
    current_user["id"] = str(current_user["_id"])
    return current_user