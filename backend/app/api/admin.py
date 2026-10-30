from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, text

from app.api.deps import get_db, require_admin
from app.models.user import User, Role
from app.models.mine import Mine, Zone
from app.models.rover import Rover
from app.models.sensor import SensorReading
from app.models.alert import Alert
from app.models.patrol import Patrol, PatrolEvent
from app.models.ml import MLPrediction
from app.models.report import Report
from app.models.audit import AuditLog
from app.schemas.auth import UserResponse, UserCreate, UserUpdate, RoleResponse
from app.schemas.admin import DatabaseStatsResponse, TableDataResponse, AuditLogResponse
from app.core.security import get_password_hash
from app.services.audit_service import audit_service

router = APIRouter(prefix="/admin", tags=["Admin Management & Database Monitor"])

# --- User Management ---

@router.get("/users", response_model=List[UserResponse])
def list_users(search: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    return query.order_by(User.id).all()

@router.post("/users", response_model=UserResponse)
def create_user(req: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter((User.email == req.email) | (User.username == req.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_pw = get_password_hash(req.password)
    user = User(
        email=req.email,
        username=req.username,
        full_name=req.full_name,
        hashed_password=hashed_pw,
        role_id=req.role_id,
        assigned_mine_id=req.assigned_mine_id,
        is_active=req.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit_service.log(
        db=db,
        action="USER_CREATED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="USER",
        resource_id=str(user.id),
        details={"created_username": user.username, "role_id": user.role_id}
    )
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.email is not None: user.email = req.email
    if req.username is not None: user.username = req.username
    if req.full_name is not None: user.full_name = req.full_name
    if req.role_id is not None: user.role_id = req.role_id
    if req.assigned_mine_id is not None: user.assigned_mine_id = req.assigned_mine_id
    if req.is_active is not None: user.is_active = req.is_active
    if req.password: user.hashed_password = get_password_hash(req.password)

    db.commit()
    db.refresh(user)

    audit_service.log(
        db=db,
        action="USER_UPDATED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="USER",
        resource_id=str(user.id),
        details={"updated_username": user.username}
    )
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete current active admin session")

    # Soft delete / deactivate
    user.is_active = False
    db.commit()

    audit_service.log(
        db=db,
        action="USER_DEACTIVATED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="USER",
        resource_id=str(user.id)
    )
    return {"status": "SUCCESS", "message": f"User {user.username} deactivated"}

@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

# --- Database Monitor ---

@router.get("/database/stats", response_model=DatabaseStatsResponse)
def get_database_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    table_map = {
        "users": User,
        "roles": Role,
        "mines": Mine,
        "zones": Zone,
        "rovers": Rover,
        "sensor_readings": SensorReading,
        "alerts": Alert,
        "patrols": Patrol,
        "patrol_events": PatrolEvent,
        "ml_predictions": MLPrediction,
        "reports": Report,
        "audit_logs": AuditLog
    }

    table_counts = []
    total_records = 0
    for name, model_cls in table_map.items():
        count = db.query(model_cls).count()
        table_counts.append({"table_name": name, "record_count": count})
        total_records += count

    latest_sensor = db.query(func.max(SensorReading.timestamp)).scalar()
    latest_alert = db.query(func.max(Alert.created_at)).scalar()
    latest_patrol = db.query(func.max(Patrol.start_time)).scalar()

    return {
        "database_type": "PostgreSQL / SQLite (SQLAlchemy ORM)",
        "status": "ONLINE (HEALTHY)",
        "tables": table_counts,
        "total_records": total_records,
        "latest_sensor_reading_time": latest_sensor,
        "latest_alert_time": latest_alert,
        "latest_patrol_time": latest_patrol
    }

@router.get("/database/table/{table_name}", response_model=TableDataResponse)
def get_table_data(
    table_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    table_map = {
        "users": User,
        "roles": Role,
        "mines": Mine,
        "zones": Zone,
        "rovers": Rover,
        "sensor_readings": SensorReading,
        "alerts": Alert,
        "patrols": Patrol,
        "patrol_events": PatrolEvent,
        "ml_predictions": MLPrediction,
        "reports": Report,
        "audit_logs": AuditLog
    }

    if table_name not in table_map:
        raise HTTPException(status_code=404, detail=f"Table {table_name} not recognized")

    model_cls = table_map[table_name]
    query = db.query(model_cls)

    total_count = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    # Extract column names and serialized dict rows
    columns = [c.name for c in model_cls.__table__.columns]
    rows = []
    for item in items:
        row_dict = {}
        for col in columns:
            val = getattr(item, col)
            if hasattr(val, "isoformat"):
                val = val.isoformat()
            row_dict[col] = val
        rows.append(row_dict)

    return {
        "table_name": table_name,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "columns": columns,
        "rows": rows
    }

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    return query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
