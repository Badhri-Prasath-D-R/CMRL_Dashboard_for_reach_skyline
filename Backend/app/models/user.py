from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

class UserInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    empID: str
    name: str
    role: str
    team: Optional[str] = None
    email: str
    hashed_password: str
    is_admin: bool = False  # new field

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}