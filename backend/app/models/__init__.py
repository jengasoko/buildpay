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

    applications: Mapped[list["Application"]] = relationship("Application", back_populates="employee")
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


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    house_id: Mapped[int] = mapped_column(Integer, ForeignKey("houses.id"), nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False
    )
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    employee: Mapped["User"] = relationship("User", back_populates="applications")
    house: Mapped["House"] = relationship("House", back_populates="applications")
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


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("applications.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    payment_date: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["Application | None"] = relationship("Application", back_populates="payments")

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
    started_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped["Application"] = relationship("Application", back_populates="occupancy")
    house: Mapped["House"] = relationship("House", back_populates="occupancies")
    employee: Mapped["User"] = relationship("User")

    @property
    def house_title(self) -> str:
        return self.house.title if self.house else ""

    @property
    def employee_username(self) -> str:
        return self.employee.username if self.employee else ""


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
