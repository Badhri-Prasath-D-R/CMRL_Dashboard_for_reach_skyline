from pydantic import BaseModel, Field
from typing import Optional, Dict
from bson import ObjectId

class ClientInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    clientID: str
    clientName: str
    industry: str
    deliveryDate: str  # YYYY-MM-DD
    phone: str
    email: str
    totalAmount: int = 0
    isArchived: bool = False
    # Service fields – could be stored as dynamic dict, but we can define known keys
    Web: Optional[Dict] = None
    SEO: Optional[Dict] = None
    Campaign: Optional[Dict] = None
    Calls: Optional[Dict] = None
    Posters: Optional[Dict] = None
    Reels: Optional[Dict] = None
    Shorts: Optional[Dict] = None
    Longform: Optional[Dict] = None
    Carousel: Optional[Dict] = None
    EventDay: Optional[Dict] = None
    Blog: Optional[Dict] = None
    activityCodes: Optional[Dict[str, str]] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}