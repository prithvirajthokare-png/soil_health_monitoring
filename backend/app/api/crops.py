from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.crop import CropStageTarget
from backend.app.schemas.crop import (
    CropStageTargetResponse, 
    CropProfileResponse
)

router = APIRouter(prefix="/crops", tags=["Crop Library"])

@router.get("", response_model=List[CropProfileResponse])
def get_all_crops(
    category: Optional[str] = Query(None, description="Filter crops by category (e.g. vegetable, cereal, plantation)"),
    db: Session = Depends(get_db)
):
    """Retrieve all crops from the library with their full stage target profiles."""
    query = db.query(CropStageTarget)
    if category:
        query = query.filter(CropStageTarget.category == category.lower().strip())

    all_targets = query.order_by(CropStageTarget.plant_type, CropStageTarget.growth_stage).all()

    # Group by plant_type
    crops_dict = {}
    for target in all_targets:
        pt = target.plant_type
        if pt not in crops_dict:
            crops_dict[pt] = {
                "plant_type": pt,
                "category": target.category,
                "stages": [],
                "primary_reference_link": target.primary_reference_link
            }
        crops_dict[pt]["stages"].append(CropStageTargetResponse.model_validate(target))

    return [CropProfileResponse(**data) for data in crops_dict.values()]

@router.get("/categories", response_model=List[str])
def get_crop_categories(db: Session = Depends(get_db)):
    """List all available crop categories in the database."""
    categories = db.query(CropStageTarget.category).distinct().order_by(CropStageTarget.category).all()
    return [c[0] for c in categories if c[0]]

@router.get("/{plant_type}", response_model=CropProfileResponse)
def get_crop_by_plant_type(plant_type: str, db: Session = Depends(get_db)):
    """Get the full agronomic profile and all growth stages for a specific crop."""
    targets = db.query(CropStageTarget).filter(
        CropStageTarget.plant_type == plant_type.lower().strip()
    ).order_by(CropStageTarget.growth_stage).all()

    if not targets:
        raise HTTPException(status_code=404, detail=f"Crop '{plant_type}' not found in crop library.")

    return CropProfileResponse(
        plant_type=targets[0].plant_type,
        category=targets[0].category,
        stages=[CropStageTargetResponse.model_validate(t) for t in targets],
        primary_reference_link=targets[0].primary_reference_link
    )

@router.get("/{plant_type}/stages/{growth_stage}", response_model=CropStageTargetResponse)
def get_crop_stage_target(plant_type: str, growth_stage: int, db: Session = Depends(get_db)):
    """Get target parameters (NPK, pH min/max, moisture trigger %, salinity limit) for a specific crop and stage."""
    target = db.query(CropStageTarget).filter(
        CropStageTarget.plant_type == plant_type.lower().strip(),
        CropStageTarget.growth_stage == growth_stage
    ).first()

    if not target:
        raise HTTPException(
            status_code=404, 
            detail=f"Stage {growth_stage} for crop '{plant_type}' not found."
        )

    return CropStageTargetResponse.model_validate(target)
