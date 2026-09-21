from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models import House, Project
from app.schemas import (
    PublicHouseResponse,
    PublicProjectResponse,
    PublicSiteContact,
    PublicSiteResponse,
    PublicSiteStats,
)

BRAND_NAME = "BuildPay"
TAGLINE = "Build smarter. Deliver stronger."
CONTACT_EMAIL = "info@constructors.co.tz"
CONTACT_PHONE = "+255 700 000 000"
CONTACT_ADDRESS = "Dar es Salaam, Tanzania"


def get_public_site(db: Session) -> PublicSiteResponse:
    projects_total = db.query(Project).count()
    houses_total = db.query(House).count()
    available_houses = db.query(House).filter(House.available.is_(True)).count()
    return PublicSiteResponse(
        brand_name=BRAND_NAME,
        tagline=TAGLINE,
        stats=PublicSiteStats(
            projects=projects_total,
            houses=houses_total,
            available_houses=available_houses,
        ),
        contact=PublicSiteContact(
            email=CONTACT_EMAIL,
            phone=CONTACT_PHONE,
            address=CONTACT_ADDRESS,
        ),
    )


def list_public_projects(db: Session, featured_only: bool = False, limit: int = 100) -> list[PublicProjectResponse]:
    query = db.query(Project)
    if featured_only:
        query = query.filter(Project.is_featured.is_(True))
    projects = query.order_by(Project.is_featured.desc(), Project.id.desc()).limit(limit).all()
    return [PublicProjectResponse.model_validate(project) for project in projects]


def get_public_project(db: Session, project_id: int) -> PublicProjectResponse:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project")
    return PublicProjectResponse.model_validate(project)


def list_public_houses(db: Session, limit: int = 100) -> list[PublicHouseResponse]:
    houses = db.query(House).filter(House.available.is_(True)).order_by(House.id.desc()).limit(limit).all()
    return [PublicHouseResponse.model_validate(house) for house in houses]


def get_public_house(db: Session, house_id: int) -> PublicHouseResponse:
    house = db.query(House).filter(House.id == house_id, House.available.is_(True)).first()
    if not house:
        raise NotFoundException("House")
    return PublicHouseResponse.model_validate(house)
