from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.mine import Mine, Zone
from app.models.rover import Rover
from app.models.alert import Alert
from app.models.user import User
from app.schemas.mine import MineResponse, ZoneResponse, MineCreate, ZoneCreate

router = APIRouter(prefix="/mines", tags=["Mines & Zones"])

@router.get("", response_model=List[MineResponse])
def list_mines(db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    results = []
    for m in mines:
        res = MineResponse.from_orm(m)
        res.active_rovers_count = db.query(Rover).filter(Rover.mine_id == m.id, Rover.is_active == True).count()
        res.active_alerts_count = db.query(Alert).filter(Alert.mine_id == m.id, Alert.status == "ACTIVE").count()
        
        # Calculate status
        crit_count = db.query(Alert).filter(Alert.mine_id == m.id, Alert.status == "ACTIVE", Alert.severity == "CRITICAL").count()
        warn_count = db.query(Alert).filter(Alert.mine_id == m.id, Alert.status == "ACTIVE", Alert.severity == "WARNING").count()
        if crit_count > 0:
            res.overall_safety_status = "CRITICAL"
        elif warn_count > 0:
            res.overall_safety_status = "ANOMALOUS"
        else:
            res.overall_safety_status = "NORMAL"

        results.append(res)
    return results

@router.get("/{mine_id}", response_model=MineResponse)
def get_mine(mine_id: int, db: Session = Depends(get_db)):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
    
    res = MineResponse.from_orm(mine)
    res.active_rovers_count = db.query(Rover).filter(Rover.mine_id == mine.id, Rover.is_active == True).count()
    res.active_alerts_count = db.query(Alert).filter(Alert.mine_id == mine.id, Alert.status == "ACTIVE").count()
    return res

@router.post("", response_model=MineResponse)
def create_mine(req: MineCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    new_mine = Mine(**req.dict())
    db.add(new_mine)
    db.commit()
    db.refresh(new_mine)
    return new_mine

@router.get("/{mine_id}/zones", response_model=List[ZoneResponse])
def list_mine_zones(mine_id: int, db: Session = Depends(get_db)):
    zones = db.query(Zone).filter(Zone.mine_id == mine_id).order_by(Zone.order_index).all()
    results = []
    for z in zones:
        z_res = ZoneResponse.from_orm(z)
        z_res.hazard_count = db.query(Alert).filter(Alert.zone_id == z.id).count()
        results.append(z_res)
    return results
