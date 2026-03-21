from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Detection Models
class DetectionStartRequest(BaseModel):
    camera_id: int
    frame_interval_minutes: float = 3.0
    # НОВЫЕ параметры для email уведомлений:
    email_interval_minutes: int = 15
    threshold_multiplier: float = 1.5
    send_to_email: Optional[str] = None

class DetectionStopRequest(BaseModel):
    camera_id: int

class DetectionStatusRequest(BaseModel):
    camera_id: int

class DetectionStartResponse(BaseModel):
    status: str
    message: str
    request_id: str

class DetectionStopResponse(BaseModel):
    status: str
    message: str

class DetectionStatusResponse(BaseModel):
    camera_id: int
    camera_name: str
    running: bool
    status: str
    timestamp: datetime

# Forecast Models
class ForecastRequest(BaseModel):
    camera_id: int
    days_ahead: int = 3
    send_email: bool = False
    email: Optional[str] = None

class ForecastResponse(BaseModel):
    status: str
    message: str
    data: Dict[str, Any]


# Camera Models
class CameraCreateRequest(BaseModel):
    name: str
    venue_id: str  # UUID as string
    rtsp_url: Optional[str] = None

class CameraUpdateRequest(BaseModel):
    name: Optional[str] = None
    venue_id: Optional[str] = None
    rtsp_url: Optional[str] = None

class CameraResponse(BaseModel):
    id: int
    name: str
    venue_id: str
    rtsp_url: Optional[str]
    created_at: datetime

class CameraListResponse(BaseModel):
    status: str
    message: str
    cameras: List[CameraResponse]

# General Models
class StatusResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
