from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.rover import Rover
from app.models.mine import Mine, Zone
from app.models.user import User
from app.schemas.rover import RoverResponse, RoverCreate, RoverUpdate
from app.services.audit_service import audit_service

router = APIRouter(prefix="/rovers", tags=["Rovers & Fleet"])

@router.get("", response_model=List[RoverResponse])
def list_rovers(mine_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Rover)
    if mine_id:
        query = query.filter(Rover.mine_id == mine_id)
    rovers = query.all()

    cutoff = datetime.utcnow() - timedelta(seconds=20)
    results = []
    for r in rovers:
        res = RoverResponse.from_orm(r)
        if r.mine: res.mine_name = r.mine.name
        if r.current_zone:
            res.current_zone_code = r.current_zone.code
            res.current_zone_name = r.current_zone.name
        res.is_online = (r.last_ping_at and r.last_ping_at >= cutoff and r.status != "OFFLINE")
        results.append(res)
    return results

@router.get("/{rover_id}", response_model=RoverResponse)
def get_rover(rover_id: int, db: Session = Depends(get_db)):
    rover = db.query(Rover).filter(Rover.id == rover_id).first()
    if not rover:
        raise HTTPException(status_code=404, detail="Rover not found")
    
    cutoff = datetime.utcnow() - timedelta(seconds=20)
    res = RoverResponse.from_orm(rover)
    if rover.mine: res.mine_name = rover.mine.name
    if rover.current_zone:
        res.current_zone_code = rover.current_zone.code
        res.current_zone_name = rover.current_zone.name
    res.is_online = (rover.last_ping_at and rover.last_ping_at >= cutoff and rover.status != "OFFLINE")
    return res

@router.post("", response_model=RoverResponse)
def create_rover(req: RoverCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    new_rover = Rover(**req.dict())
    db.add(new_rover)
    db.commit()
    db.refresh(new_rover)
    audit_service.log(
        db=db,
        action="ROVER_CREATED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="ROVER",
        resource_id=str(new_rover.id)
    )
    return get_rover(new_rover.id, db)
