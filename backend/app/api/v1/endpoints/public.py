from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import PublicHouseResponse, PublicProjectResponse, PublicSiteResponse
from app.services import public_service

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/site", response_model=PublicSiteResponse)
def get_public_site(db: Session = Depends(get_db)):
    return public_service.get_public_site(db)


@router.get("/projects", response_model=list[PublicProjectResponse])
def list_public_projects(
    featured_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return public_service.list_public_projects(db, featured_only=featured_only, limit=limit)


@router.get("/projects/{project_id}", response_model=PublicProjectResponse)
def get_public_project(project_id: int, db: Session = Depends(get_db)):
    return public_service.get_public_project(db, project_id)


@router.get("/houses", response_model=list[PublicHouseResponse])
def list_public_houses(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return public_service.list_public_houses(db, limit=limit)


@router.get("/houses/{house_id}", response_model=PublicHouseResponse)
def get_public_house(house_id: int, db: Session = Depends(get_db)):
    return public_service.get_public_house(db, house_id)
