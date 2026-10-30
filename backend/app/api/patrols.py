from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.models.patrol import Patrol, PatrolEvent
from app.models.rover import Rover
from app.models.user import User
from app.schemas.patrol import PatrolResponse, PatrolDetailResponse, PatrolEventResponse, PatrolControlRequest
from app.services.patrol_service import patrol_service
from app.services.report_service import report_service
from app.services.audit_service import audit_service
from app.simulator.rover_simulator import simulator
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/patrols", tags=["Patrols & Digital Logs"])

@router.get("", response_model=List[PatrolResponse])
def list_patrols(mine_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Patrol)
    if mine_id:
        query = query.filter(Patrol.mine_id == mine_id)
    patrols = query.order_by(desc(Patrol.start_time)).limit(limit).all()

    results = []
    for p in patrols:
        res = PatrolResponse.from_orm(p)
        if p.rover: res.rover_code = p.rover.code
        if p.mine: res.mine_name = p.mine.name
        results.append(res)
    return results

@router.get("/{patrol_id}", response_model=PatrolDetailResponse)
def get_patrol_detail(patrol_id: int, db: Session = Depends(get_db)):
    patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
    if not patrol:
        raise HTTPException(status_code=404, detail="Patrol not found")

    events = db.query(PatrolEvent).filter(PatrolEvent.patrol_id == patrol_id).order_by(PatrolEvent.timestamp).all()

    res = PatrolDetailResponse.from_orm(patrol)
    if patrol.rover: res.rover_code = patrol.rover.code
    if patrol.mine: res.mine_name = patrol.mine.name

    event_responses = []
    for e in events:
        e_res = PatrolEventResponse.from_orm(e)
        if e.zone:
            e_res.zone_code = e.zone.code
            e_res.zone_name = e.zone.name
        event_responses.append(e_res)
    res.events = event_responses

    return res

@router.post("/control", response_model=PatrolResponse)
async def control_patrol(
    req: PatrolControlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rover = db.query(Rover).filter(Rover.code == req.rover_id).first()
    if not rover:
        raise HTTPException(status_code=404, detail="Rover not found")

    if req.action == "START":
        patrol = patrol_service.start_patrol(db, rover.id, rover.mine_id)
        audit_service.log(
            db=db,
            action="PATROL_START",
            user_id=current_user.id,
            username=current_user.username,
            resource_type="PATROL",
            resource_id=str(patrol.id)
        )
        await ws_manager.broadcast("patrol_update", {
            "patrol_id": patrol.id,
            "status": "STARTED",
            "patrol_number": patrol.patrol_number
        })
    elif req.action in ["STOP", "ABORT", "RETURN"]:
        active = db.query(Patrol).filter(
            Patrol.rover_id == rover.id,
            Patrol.final_status == "IN_PROGRESS"
        ).first()
        if not active:
            raise HTTPException(status_code=400, detail="No active patrol in progress")
        
        status_target = "ABORTED" if req.action == "ABORT" else "NORMAL"
        patrol = patrol_service.finish_patrol(db, active.id, status=status_target)
        
        # Automatically generate PDF report upon completion
        try:
            report_service.generate_patrol_pdf(db, patrol.id, generated_by=current_user.username)
        except Exception as e:
            print(f"[REPORT ERROR] {e}")

        audit_service.log(
            db=db,
            action=f"PATROL_{req.action}",
            user_id=current_user.id,
            username=current_user.username,
            resource_type="PATROL",
            resource_id=str(patrol.id)
        )
        await ws_manager.broadcast("patrol_update", {
            "patrol_id": patrol.id,
            "status": "FINISHED",
            "final_status": patrol.final_status
        })
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    res = PatrolResponse.from_orm(patrol)
    if patrol.rover: res.rover_code = patrol.rover.code
    return res
