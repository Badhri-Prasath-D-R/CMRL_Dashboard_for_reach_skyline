from pydantic import BaseModel
from typing import Optional, Dict

class ClientBase(BaseModel):
    clientName: str
    industry: str
    deliveryDate: str
    phone: str
    email: str

class ClientCreate(ClientBase):
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

class ClientUpdate(BaseModel):
    isArchived: Optional[bool] = None

class ClientOut(ClientBase):
    clientID: str
    totalAmount: int
    isArchived: bool
    id: str  # MongoDB ObjectId as string
    # Include all deliverable fields
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

    class Config:
        from_attributes = True