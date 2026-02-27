from pydantic import BaseModel, Field
from typing import Optional, Dict
from bson import ObjectId

class TaskInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    team: str  # branding, website, seo, campaign, telecaller
    assignedTo: Optional[str] = None
    clientID: str
    client: str
    activityCode: str
    deliveryDate: str
    status: str = "Pending"
    remarks: str = ""
    submissionLink: str = ""
    # Service-specific data
    count: Optional[Dict[str, int]] = None
    minutes: Optional[Dict[str, int]] = None
    amount: Optional[Dict[str, int]] = None
    description: str = ""          # for Web/SEO/Campaign
    callsDescription: str = ""      # for Telecaller

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}