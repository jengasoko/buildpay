from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ConflictException, ForbiddenException, NotFoundException
from app.models import Employment, User, UserRole
from app.repositories import employment_repository
from app.schemas import EmploymentCreate, EmploymentResponse
from app.services.logs import log_event


def create_employment(db: Session, data: EmploymentCreate, current_user: User | None = None) -> EmploymentResponse:
    employer = db.query(User).filter(User.id == data.employer_id).first()
    if employer is None:
        raise NotFoundException("Employer")
    if employer.role != UserRole.EMPLOYER:
        raise BadRequestException("Employer must be an EMPLOYER user")

    employee = db.query(User).filter(User.id == data.employee_id).first()
    if employee is None:
        raise NotFoundException("Employee")
    if employee.role != UserRole.EMPLOYEE:
        raise BadRequestException("Employee must be an EMPLOYEE user")

    if employment_repository.get_employment_by_employee(db, data.employee_id):
        raise ConflictException("Employee is already assigned to an employer")

    employment = employment_repository.create_employment(db, data.model_dump())
    log_event(
        db,
        action="EMPLOYMENT.CREATED",
        entity_type="EMPLOYMENT",
        entity_id=employment.id,
        details={"employer_id": data.employer_id, "employee_id": data.employee_id},
        user_id=current_user.id if current_user else None,
    )
    return EmploymentResponse.model_validate(employment)


def get_employment(db: Session, employment_id: int, current_user: User | None = None) -> EmploymentResponse:
    employment = employment_repository.get_employment_by_id(db, employment_id)
    if not employment:
        raise NotFoundException("Employment")
    if (
        current_user is not None
        and current_user.role == UserRole.EMPLOYER
        and employment.employer_id != current_user.id
    ):
        raise ForbiddenException("Employers may only access their own employment records")
    return EmploymentResponse.model_validate(employment)


def list_employments(db: Session, page: int = 1, page_size: int = 100, current_user: User | None = None) -> dict:
    skip = (page - 1) * page_size
    employer_id = None
    if current_user is not None and current_user.role == UserRole.EMPLOYER:
        employer_id = current_user.id
    employments = employment_repository.get_employments(db, skip=skip, limit=page_size, employer_id=employer_id)
    total = employment_repository.count_employments(db, employer_id=employer_id)
    return {
        "items": [EmploymentResponse.model_validate(e) for e in employments],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def delete_employment(db: Session, employment_id: int, current_user: User | None = None) -> None:
    employment = employment_repository.get_employment_by_id(db, employment_id)
    if not employment:
        raise NotFoundException("Employment")
    if (
        current_user is not None
        and current_user.role == UserRole.EMPLOYER
        and employment.employer_id != current_user.id
    ):
        raise ForbiddenException("Employers may only remove their own employment records")
    employment_repository.delete_employment(db, employment)
    log_event(
        db,
        action="EMPLOYMENT.DELETED",
        entity_type="EMPLOYMENT",
        entity_id=employment_id,
        details={"employer_id": employment.employer_id, "employee_id": employment.employee_id},
        user_id=current_user.id if current_user else None,
    )


def get_employer_team_ids(db: Session, employer_id: int) -> list[int]:
    employments = employment_repository.get_employments(db, employer_id=employer_id, limit=1000)
    return [e.employee_id for e in employments]


def get_employment_by_employee(db: Session, employee_id: int) -> Employment | None:
    return employment_repository.get_employment_by_employee(db, employee_id)
