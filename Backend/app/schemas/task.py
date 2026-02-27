from pydantic import BaseModel
from typing import Optional, Dict

class TaskBase(BaseModel):
    team: str
    clientID: str
    client: str
    activityCode: str
    deliveryDate: str

class TaskCreate(TaskBase):
    # optional fields that may come from dashboard
    count: Optional[Dict[str, int]] = None
    minutes: Optional[Dict[str, int]] = None
    amount: Optional[Dict[str, int]] = None
    description: str = ""
    callsDescription: str = ""

class TaskUpdate(BaseModel):
    assignedTo: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    submissionLink: Optional[str] = None
    # allow updating other fields if needed

class TaskOut(TaskBase):
    id: str
    assignedTo: Optional[str] = None
    status: str
    remarks: str
    submissionLink: str
    count: Optional[Dict[str, int]] = None
    minutes: Optional[Dict[str, int]] = None
    amount: Optional[Dict[str, int]] = None
    description: str
    callsDescription: str

    class Config:
        from_attributes = True