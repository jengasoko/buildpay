from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models import ApplicationStatus, UserRole


# --- Auth ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# --- User ---
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole = UserRole.EMPLOYEE
    phone: str | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str | None
    last_name: str | None
    role: UserRole
    phone: str | None
    is_active: bool
    created_at: datetime
    employer_id: int | None = None
    employer_username: str = ""

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    is_active: bool
    employer_id: int | None = None
    employer_username: str = ""

    model_config = {"from_attributes": True}


# --- Project ---
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    location: str = Field(min_length=1, max_length=255)
    description: str | None = None
    start_date: datetime
    expected_completion: datetime
    actual_completion: datetime | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    description: str | None = None
    start_date: datetime | None = None
    expected_completion: datetime | None = None
    actual_completion: datetime | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    location: str
    description: str | None
    start_date: datetime
    expected_completion: datetime
    actual_completion: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- House ---
class HouseCreate(BaseModel):
    project_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    bedrooms: int = Field(default=0, ge=0)
    bathrooms: int = Field(default=0, ge=0)
    area_sqft: float = Field(default=0, ge=0)
    location: str = Field(min_length=1, max_length=255)
    rent_price: float = Field(gt=0)
    price: float = Field(default=0, ge=0)
    image_url: str | None = None
    available: bool = True


class HouseUpdate(BaseModel):
    title: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    area_sqft: float | None = None
    location: str | None = None
    rent_price: float | None = None
    price: float | None = None
    image_url: str | None = None
    available: bool | None = None
    project_id: int | None = None


class HouseResponse(BaseModel):
    id: int
    project_id: int | None
    title: str
    bedrooms: int
    bathrooms: int
    area_sqft: float
    location: str
    rent_price: float
    price: float
    image_url: str | None
    available: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Application ---
class ApplicationCreate(BaseModel):
    employee_id: int
    house_id: int


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None


class ApplicationResponse(BaseModel):
    id: int
    employee_id: int
    house_id: int
    status: ApplicationStatus
    created_at: datetime
    house_title: str
    employee_username: str
    employer_username: str = ""

    model_config = {"from_attributes": True}


# --- Payment ---
class PaymentCreate(BaseModel):
    application_id: int | None = None
    amount: float = Field(gt=0)
    reference: str | None = Field(default=None, max_length=100)


class PaymentUpdate(BaseModel):
    application_id: int | None = None
    amount: float | None = None
    reference: str | None = None


class PaymentResponse(BaseModel):
    id: int
    application_id: int | None
    amount: float
    payment_date: datetime
    reference: str | None
    created_at: datetime
    application_house_title: str = ""
    application_employee_username: str = ""

    model_config = {"from_attributes": True}


# --- Health ---
class HealthResponse(BaseModel):
    status: str
    environment: str


class ReadyResponse(BaseModel):
    status: str
    database: str


# --- Error ---
class ErrorResponse(BaseModel):
    error: dict


# --- System Log ---
class SystemLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity_type: str | None
    entity_id: int | None
    details: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


# --- Employment ---
class EmploymentCreate(BaseModel):
    employer_id: int
    employee_id: int


class EmploymentResponse(BaseModel):
    id: int
    employer_id: int
    employee_id: int
    created_at: datetime
    employer_username: str = ""
    employee_username: str = ""

    model_config = {"from_attributes": True}


# --- Occupancy ---
class OccupancyResponse(BaseModel):
    id: int
    application_id: int
    house_id: int
    employee_id: int
    started_at: datetime
    ended_at: datetime | None
    house_title: str = ""
    employee_username: str = ""

    model_config = {"from_attributes": True}


# --- Notification ---
class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationUnreadCount(BaseModel):
    count: int


# --- Dashboard ---
class DashboardCounts(BaseModel):
    users: int
    employees: int
    employers: int
    projects: int
    houses: int
    available_houses: int
    occupied_houses: int
    applications: int
    pending_applications: int
    employer_approved_applications: int
    financial_approved_applications: int
    rejected_applications: int
    payments: int
    active_occupancies: int


class DashboardStatsResponse(BaseModel):
    counts: DashboardCounts
    total_payment_amount: float
    recent_applications: list[ApplicationResponse]


# --- Pagination ---
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
