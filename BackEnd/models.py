# A model is a representation of data, Object Oriented Data
# for user data, create a userModel
# A mdoel has a name, and some properties
#Define classes for models as such, and call them in the main file
#but for the class system, there is no data validation, so then use pydantic
#With pydantic, there is no need for the constructor/ def __init__(self) function

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Student(BaseModel):
    name: str
    email: str
    country: str
    phone: int
    loginActivity: str
    applicationStatus: str
    documentsSubmitted: str
    communicationLog: str
    lastActive: int
    prefMajor: str
    prefStates: str
    prefTuitionBudget: int
    prefClassSize: int
    testScores: str
    essayTopics: str
    activities: str
    resume: str
    colleges: str
    chatHistorySummary: str #This is the AI questions asked
    #notes: List[str] = []
    notes: str
    userId: Optional[str] = None  # backend sets this

class Reminder(BaseModel):
    title: str
    description: Optional[str] = ""
    dueDate: datetime
    assignedTo: Optional[List[str]] = []  # user IDs
    createdBy: Optional[str] = None
    status: str = "pending"  # pending / done / archived

class AdminMetrics(BaseModel):
    adminId: str
    activeContacts7Days: int = 0
    remindersCreated: int = 0
    profileUpdates: int = 0
    followUpsSent: int = 0
    score: int = 0
    lastUpdated: Optional[datetime] = None
