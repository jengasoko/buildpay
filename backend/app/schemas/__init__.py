from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import (
    ApplicationStatus,
    BlockType,
    ChargeType,
    InvoiceStatus,
    LeaseStatus,
    MaintenanceCategory,
    MaintenanceStatus,
    PaymentMethod,
    UserRole,
)


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
    review_note: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    employee_id: int
    house_id: int
    status: ApplicationStatus
    review_note: str | None = None
    reviewed_by: str = ""
    reviewed_at: datetime | None = None
    created_at: datetime
    house_title: str
    employee_username: str
    employer_username: str = ""

    model_config = {"from_attributes": True}


# --- Payment ---
class PaymentCreate(BaseModel):
    application_id: int | None = None
    invoice_id: int | None = None
    amount: float = Field(gt=0)
    method: PaymentMethod = PaymentMethod.CASH
    reference: str | None = Field(default=None, max_length=100)


class PaymentUpdate(BaseModel):
    application_id: int | None = None
    invoice_id: int | None = None
    amount: float | None = None
    method: PaymentMethod | None = None
    reference: str | None = None


class PaymentResponse(BaseModel):
    id: int
    application_id: int | None
    invoice_id: int | None
    amount: float
    method: PaymentMethod
    payment_date: datetime
    reference: str | None
    created_at: datetime
    application_house_title: str = ""
    application_employee_username: str = ""

    model_config = {"from_attributes": True}


# --- Room ---
class RoomCreate(BaseModel):
    house_id: int
    room_number: str = Field(min_length=1, max_length=50)
    block_type: BlockType = BlockType.OTHER
    capacity: int = Field(default=1, ge=1)
    is_available: bool = True
    notes: str | None = None


class RoomUpdate(BaseModel):
    room_number: str | None = None
    block_type: BlockType | None = None
    capacity: int | None = None
    is_available: bool | None = None
    notes: str | None = None


class RoomResponse(BaseModel):
    id: int
    house_id: int
    room_number: str
    block_type: BlockType
    capacity: int
    is_available: bool
    notes: str | None
    created_at: datetime
    house_title: str = ""

    model_config = {"from_attributes": True}


# --- Lease ---
class LeaseCreate(BaseModel):
    occupancy_id: int
    rent_amount: float = Field(gt=0)
    deposit_amount: float = Field(default=0, ge=0)
    start_date: datetime
    end_date: datetime | None = None
    billing_day: int = Field(default=1, ge=1, le=28)
    late_fee_amount: float = Field(default=0, ge=0)
    room_id: int | None = None


class LeaseUpdate(BaseModel):
    rent_amount: float | None = Field(default=None, gt=0)
    deposit_amount: float | None = Field(default=None, ge=0)
    deposit_paid: bool | None = None
    end_date: datetime | None = None
    billing_day: int | None = Field(default=None, ge=1, le=28)
    room_id: int | None = None


class LeaseResponse(BaseModel):
    id: int
    occupancy_id: int
    employee_id: int
    house_id: int
    room_id: int | None
    rent_amount: float
    deposit_amount: float
    deposit_paid: bool
    start_date: datetime
    end_date: datetime | None
    billing_day: int
    late_fee_amount: float
    status: LeaseStatus
    signed_at: datetime | None
    created_at: datetime
    house_title: str = ""
    employee_username: str = ""
    room_number: str = ""

    model_config = {"from_attributes": True}


# --- Charge ---
class ChargeCreate(BaseModel):
    charge_type: ChargeType = ChargeType.RENT
    label: str = Field(min_length=1, max_length=255)
    amount: float = Field(gt=0)


class ChargeResponse(BaseModel):
    id: int
    invoice_id: int
    charge_type: ChargeType
    label: str
    amount: float

    model_config = {"from_attributes": True}


# --- Invoice ---
class InvoiceCreate(BaseModel):
    lease_id: int
    period_start: datetime
    period_end: datetime
    due_date: datetime
    charges: list[ChargeCreate] = Field(default_factory=list)
    notes: str | None = None


class InvoiceResponse(BaseModel):
    id: int
    lease_id: int
    period_start: datetime
    period_end: datetime
    due_date: datetime
    total_amount: float
    paid_amount: float
    late_fee_amount: float
    status: InvoiceStatus
    notes: str | None
    created_at: datetime
    balance_due: float
    house_title: str = ""
    employee_username: str = ""
    charges: list[ChargeResponse] = []

    model_config = {"from_attributes": True}


class InvoiceAllocateRequest(BaseModel):
    payment_id: int | None = None
    amount: float = Field(gt=0)
    method: PaymentMethod = PaymentMethod.CASH
    reference: str | None = Field(default=None, max_length=100)


# --- Maintenance ---
class MaintenanceCreate(BaseModel):
    house_id: int
    room_id: int | None = None
    employee_id: int | None = None
    category: MaintenanceCategory = MaintenanceCategory.OTHER
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    priority: str = Field(default="normal", pattern="^(low|normal|high)$")
    photos: list[str] | None = None


class MaintenanceUpdate(BaseModel):
    room_id: int | None = None
    category: MaintenanceCategory | None = None
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: MaintenanceStatus | None = None
    assigned_to_id: int | None = None
    resolution_note: str | None = None


class MaintenanceResponse(BaseModel):
    id: int
    house_id: int
    room_id: int | None
    employee_id: int
    reported_by_id: int | None
    category: MaintenanceCategory
    title: str
    description: str
    photos: list[str] = []
    status: MaintenanceStatus
    priority: str
    assigned_to_id: int | None
    assigned_to_username: str = ""
    resolution_note: str | None
    created_at: datetime
    closed_at: datetime | None
    house_title: str = ""
    employee_username: str = ""
    room_number: str = ""

    @field_validator("photos", mode="before")
    @classmethod
    def _parse_photos(cls, v):
        if isinstance(v, str):
            import json

            try:
                return json.loads(v)
            except Exception:
                return [v] if v else []
        return v or []

    model_config = {"from_attributes": True}


# --- Arrears / dashboard / reports ---
class ArrearsBucket(BaseModel):
    bucket: str
    count: int
    amount: float


class ArrearsSummary(BaseModel):
    total_outstanding: float
    total_overdue: float
    buckets: list[ArrearsBucket]


class EmployeeDashboardResponse(BaseModel):
    counts: dict[str, int]
    application: ApplicationResponse | None = None
    lease: LeaseResponse | None = None
    account_balance: float
    next_invoice_due: datetime | None = None
    recent_invoices: list[InvoiceResponse] = []
    open_maintenance: int = 0


class FinancialReport(BaseModel):
    month: int
    year: int
    collected: float
    outstanding: float
    overdue: float
    open_invoices: int
    active_leases: int
    arrears: list[ArrearsBucket]


class OccupancyReport(BaseModel):
    total_houses: int
    available_houses: int
    occupied_houses: int
    active_leases: int
    by_house: list[dict[str, object]]


class TrendPoint(BaseModel):
    month: str
    value: float


class OccupancyTrendPoint(BaseModel):
    month: str
    occupied: int
    total: int


class CollectionRatePoint(BaseModel):
    month: str
    invoiced: float
    collected: float
    rate: float


class RevenueTrendResponse(BaseModel):
    data: list[TrendPoint]


class OccupancyTrendResponse(BaseModel):
    data: list[OccupancyTrendPoint]


class CollectionRateResponse(BaseModel):
    data: list[CollectionRatePoint]


class StatementEntry(BaseModel):
    date: datetime
    type: str
    description: str
    amount: float
    running_balance: float


class StatementOfAccount(BaseModel):
    lease: LeaseResponse
    balance: float
    entries: list[StatementEntry]


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


class EmployerStaffSummary(BaseModel):
    total: int
    with_lease: int
    pending_approval: int


class EmployerTeamLease(BaseModel):
    employee_username: str
    house_title: str
    room_number: str | None = None
    start_date: datetime | None = None
    status: str


class EmployerDashboardResponse(BaseModel):
    staff: EmployerStaffSummary
    team_houses: int
    pending_applications: int
    active_leases: int
    open_maintenance: int
    recent_applications: list[ApplicationResponse] = []
    team_leases: list[EmployerTeamLease] = []


class FinancialDashboardResponse(BaseModel):
    month: int
    year: int
    collected_this_month: float
    collected_all_time: float
    outstanding: float
    overdue: float
    collection_rate: float
    open_invoices: int
    active_leases: int
    recent_payments: list[PaymentResponse] = []
    arrears: list[ArrearsBucket] = []


# --- Pagination ---
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
