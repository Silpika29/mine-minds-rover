from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertAcknowledgeRequest, AlertResolveRequest
from app.services.alert_service import alert_service
from app.services.audit_service import audit_service
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/alerts", tags=["Alerts & Safety Management"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    mine_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if mine_id:
        query = query.filter(Alert.mine_id == mine_id)

    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    
    # Format with relations
    results = []
    for a in alerts:
        res = AlertResponse.from_orm(a)
        if a.rover:
            res.rover_code = a.rover.code
        if a.mine:
            res.mine_name = a.mine.name
        if a.zone:
            res.zone_code = a.zone.code
            res.zone_name = a.zone.name
        results.append(res)
    return results

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = alert_service.acknowledge_alert(
        db=db,
        alert_id=alert_id,
        username=current_user.username,
        notes=req.notes
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    audit_service.log(
        db=db,
        action="ALERT_ACKNOWLEDGED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="ALERT",
        resource_id=str(alert.id),
        details={"hazard_type": alert.hazard_type, "severity": alert.severity}
    )

    await ws_manager.broadcast("alert_updated", {
        "id": alert.id,
        "status": alert.status,
        "acknowledged_by": alert.acknowledged_by
    })

    res = AlertResponse.from_orm(alert)
    if alert.rover: res.rover_code = alert.rover.code
    if alert.zone:
        res.zone_code = alert.zone.code
        res.zone_name = alert.zone.name
    return res

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: int,
    req: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = alert_service.resolve_alert(
        db=db,
        alert_id=alert_id,
        username=current_user.username,
        resolution_notes=req.resolution_notes
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    audit_service.log(
        db=db,
        action="ALERT_RESOLVED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="ALERT",
        resource_id=str(alert.id),
        details={"resolution": req.resolution_notes}
    )

    await ws_manager.broadcast("alert_updated", {
        "id": alert.id,
        "status": alert.status,
        "resolved_by": alert.resolved_by
    })

    res = AlertResponse.from_orm(alert)
    if alert.rover: res.rover_code = alert.rover.code
    if alert.zone:
        res.zone_code = alert.zone.code
        res.zone_name = alert.zone.name
    return res
