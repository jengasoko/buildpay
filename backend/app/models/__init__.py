import enum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(enum.StrEnum):
    ADMIN = "ADMIN"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    FINANCIAL_OFFICER = "FINANCIAL_OFFICER"
    EMPLOYER = "EMPLOYER"
    EMPLOYEE = "EMPLOYEE"


class ApplicationStatus(enum.StrEnum):
    PENDING = "PENDING"
    EMPLOYER_APPROVED = "EMPLOYER_APPROVED"
    FINANCIAL_APPROVED = "FINANCIAL_APPROVED"
    REJECTED = "REJECTED"


class ProjectStatus(enum.StrEnum):
    PLANNED = "PLANNED"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"


class LeaseStatus(enum.StrEnum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"


class BlockType(enum.StrEnum):
    PRIVATE = "PRIVATE"
    SHARED = "SHARED"
    DORMITORY = "DORMITORY"
    OTHER = "OTHER"


class InvoiceStatus(enum.StrEnum):
    OPEN = "OPEN"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class ChargeType(enum.StrEnum):
    RENT = "RENT"
    UTILITY = "UTILITY"
    MESS = "MESS"
    OTHER = "OTHER"


class PaymentMethod(enum.StrEnum):
    CASH = "CASH"
    EFT = "EFT"
    CARD = "CARD"
    PAYROLL_DEDUCTION = "PAYROLL_DEDUCTION"


class MaintenanceStatus(enum.StrEnum):
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class MaintenanceCategory(enum.StrEnum):
    PLUMBING = "PLUMBING"
    ELECTRICAL = "ELECTRICAL"
    STRUCTURAL = "STRUCTURAL"
    FURNITURE = "FURNITURE"
    OTHER = "OTHER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    applications: Mapped[list["Application"]] = relationship(
        "Application", foreign_keys="Application.employee_id", back_populates="employee"
    )
    employment_as_employer: Mapped[list["Employment"]] = relationship(
        "Employment", foreign_keys="Employment.employer_id", back_populates="employer"
    )
    employment_as_employee: Mapped[list["Employment"]] = relationship(
        "Employment", foreign_keys="Employment.employee_id", back_populates="employee"
    )
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user")

    @property
    def employer_id(self) -> int | None:
        if self.employment_as_employee:
            return self.employment_as_employee[0].employer_id
        return None

    @property
    def employer_username(self) -> str:
        if self.employment_as_employee:
            employer = self.employment_as_employee[0].employer
            return employer.username if employer else ""
        return ""


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    expected_completion: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_completion: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), default=ProjectStatus.ONGOING, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    houses: Mapped[list["House"]] = relationship("House", back_populates="project")


class House(Base):
    __tablename__ = "houses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("projects.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    bedrooms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bathrooms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    area_sqft: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    rent_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project: Mapped["Project | None"] = relationship("Project", back_populates="houses")
    applications: Mapped[list["Application"]] = relationship("Application", back_populates="house")
    occupancies: Mapped[list["Occupancy"]] = relationship("Occupancy", back_populates="house")
    rooms: Mapped[list["Room"]] = relationship("Room", back_populates="house")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    house_id: Mapped[int] = mapped_column(Integer, ForeignKey("houses.id"), nullable=False, index=True)
    room_number: Mapped[str] = mapped_column(String(50), nullable=False)
    block_type: Mapped[BlockType] = mapped_column(Enum(BlockType), default=BlockType.OTHER, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    house: Mapped["House"] = relationship("House", back_populates="rooms")
    leases: Mapped[list["Lease"]] = relationship("Lease", back_populates="room")

    @property
    def house_title(self) -> str:
        return self.house.title if self.house else ""


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    house_id: Mapped[int] = mapped_column(Integer, ForeignKey("houses.id"), nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], back_populates="applications")
    house: Mapped["House"] = relationship("House", back_populates="applications")
    reviewer: Mapped["User | None"] = relationship("User", foreign_keys=[reviewed_by_id])
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="application")
    occupancy: Mapped["Occupancy | None"] = relationship("Occupancy", back_populates="application", uselist=False)

    @property
    def house_title(self) -> str:
        return self.house.title if self.house else ""

    @property
    def employee_username(self) -> str:
        return self.employee.username if self.employee else ""

    @property
    def employer_username(self) -> str:
        if self.employee and self.employee.employment_as_employee:
            return self.employee.employment_as_employee[0].employer_username
        return ""

    @property
    def reviewed_by(self) -> str:
        return self.reviewer.username if self.reviewer else ""


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("applications.id"), nullable=True)
    invoice_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("invoices.id"), nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    payment_date: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["Application | None"] = relationship("Application", back_populates="payments")
    invoice: Mapped["Invoice | None"] = relationship("Invoice", back_populates="payments")

    @property
    def application_house_title(self) -> str:
        if self.application and self.application.house:
            return self.application.house.title
        return ""

    @property
    def application_employee_username(self) -> str:
        if self.application and self.application.employee:
            return self.application.employee.username
        return ""


class SystemLog(Base):
    __tablename__ = "system_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", name="fk_system_logs_user_id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User | None"] = relationship("User")


class Employment(Base):
    __tablename__ = "employments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employer: Mapped["User"] = relationship("User", foreign_keys=[employer_id], back_populates="employment_as_employer")
    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id], back_populates="employment_as_employee")

    @property
    def employer_username(self) -> str:
        return self.employer.username if self.employer else ""

    @property
    def employee_username(self) -> str:
        return self.employee.username if self.employee else ""


class Occupancy(Base):
    __tablename__ = "occupancies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    house_id: Mapped[int] = mapped_column(Integer, ForeignKey("houses.id"), nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    room_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("rooms.id"), nullable=True)
    lease_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("leases.id"), nullable=True)
    started_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["Application"] = relationship("Application", back_populates="occupancy")
    house: Mapped["House"] = relationship("House", back_populates="occupancies")
    employee: Mapped["User"] = relationship("User")
    room: Mapped["Room | None"] = relationship("Room")
    lease: Mapped["Lease | None"] = relationship("Lease", foreign_keys=[lease_id])

    @property
    def house_title(self) -> str:
        return self.house.title if self.house else ""

    @property
    def employee_username(self) -> str:
        return self.employee.username if self.employee else ""


class Lease(Base):
    __tablename__ = "leases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    occupancy_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("occupancies.id", use_alter=True, name="fk_leases_occupancy_id"),
        unique=True,
        nullable=False,
    )
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    house_id: Mapped[int] = mapped_column(Integer, ForeignKey("houses.id"), nullable=False, index=True)
    room_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("rooms.id"), nullable=True)
    rent_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    deposit_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    start_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    billing_day: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[LeaseStatus] = mapped_column(Enum(LeaseStatus), default=LeaseStatus.ACTIVE, nullable=False)
    late_fee_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    signed_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    signed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    occupancy: Mapped["Occupancy"] = relationship("Occupancy", foreign_keys=[occupancy_id])
    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id])
    house: Mapped["House"] = relationship("House")
    room: Mapped["Room | None"] = relationship("Room", back_populates="leases")
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="lease")

    @property
    def house_title(self) -> str:
        return self.house.title if self.house else ""

    @property
    def employee_username(self) -> str:
        return self.employee.username if self.employee else ""

    @property
    def room_number(self) -> str:
        return self.room.room_number if self.room else ""


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lease_id: Mapped[int] = mapped_column(Integer, ForeignKey("leases.id"), nullable=False, index=True)
    period_start: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    due_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    late_fee_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.OPEN, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    lease: Mapped["Lease"] = relationship("Lease", back_populates="invoices")
    charges: Mapped[list["Charge"]] = relationship("Charge", back_populates="invoice")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="invoice")

    @property
    def balance_due(self) -> float:
        return float(self.total_amount) - float(self.paid_amount)

    @property
    def house_title(self) -> str:
        return self.lease.house_title if self.lease else ""

    @property
    def employee_username(self) -> str:
        return self.lease.employee_username if self.lease else ""


class Charge(Base):
    __tablename__ = "charges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    charge_type: Mapped[ChargeType] = mapped_column(Enum(ChargeType), default=ChargeType.RENT, nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="charges")


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    house_id: Mapped[int] = mapped_column(Integer, ForeignKey("houses.id"), nullable=False, index=True)
    room_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("rooms.id"), nullable=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reported_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    category: Mapped[MaintenanceCategory] = mapped_column(
        Enum(MaintenanceCategory), default=MaintenanceCategory.OTHER, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    photos: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus), default=MaintenanceStatus.SUBMITTED, nullable=False
    )
    priority: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)
    assigned_to_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    house: Mapped["House"] = relationship("House")
    room: Mapped["Room | None"] = relationship("Room")
    employee: Mapped["User"] = relationship("User", foreign_keys=[employee_id])
    reported_by: Mapped["User | None"] = relationship("User", foreign_keys=[reported_by_id])
    assigned_to: Mapped["User | None"] = relationship("User", foreign_keys=[assigned_to_id])

    @property
    def house_title(self) -> str:
        return self.house.title if self.house else ""

    @property
    def employee_username(self) -> str:
        return self.employee.username if self.employee else ""

    @property
    def room_number(self) -> str:
        return self.room.room_number if self.room else ""

    @property
    def assigned_to_username(self) -> str:
        return self.assigned_to.username if self.assigned_to else ""


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
