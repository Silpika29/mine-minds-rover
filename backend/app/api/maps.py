import os
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.api.deps import get_db, require_admin, get_current_user
from app.models.user import User
from app.services.audit_service import audit_service
from app.database.session import Base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text

# ---------- Model ----------
class MapVersion(Base):
    __tablename__ = "map_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    file_path = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=False)

# ---------- Schemas ----------
class MapVersionOut(BaseModel):
    id: int
    name: str
    version: int
    file_path: str
    description: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# ---------- Router ----------
router = APIRouter(prefix="/maps", tags=["Mine Maps"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "maps")


@router.get("", response_model=List[MapVersionOut])
def list_map_versions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(MapVersion).order_by(desc(MapVersion.uploaded_at)).all()
    out = []
    for r in rows:
        out.append(MapVersionOut(
            id=r.id, name=r.name, version=r.version,
            file_path=r.file_path,
            description=r.description,
            uploaded_by=r.uploaded_by,
            uploaded_at=r.uploaded_at.isoformat() if r.uploaded_at else None,
            is_active=r.is_active,
        ))
    return out


@router.get("/active", response_model=Optional[MapVersionOut])
def get_active_map(db: Session = Depends(get_db)):
    row = db.query(MapVersion).filter(MapVersion.is_active == True).first()
    if not row:
        return None
    return MapVersionOut(
        id=row.id, name=row.name, version=row.version,
        file_path=row.file_path,
        description=row.description,
        uploaded_by=row.uploaded_by,
        uploaded_at=row.uploaded_at.isoformat() if row.uploaded_at else None,
        is_active=row.is_active,
    )


@router.post("/upload")
async def upload_map(
    name: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    allowed = (".png", ".jpg", ".jpeg", ".svg")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Allowed: {', '.join(allowed)}")

    # Calculate next version
    latest = db.query(MapVersion).order_by(desc(MapVersion.version)).first()
    next_version = (latest.version + 1) if latest else 1

    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"mine_map_v{next_version}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
    with open(file_path, "wb") as f:
        f.write(content)

    new_map = MapVersion(
        name=name,
        version=next_version,
        file_path=f"/uploads/maps/{filename}",
        description=description,
        uploaded_by=current_user.username,
        is_active=False,
    )
    db.add(new_map)
    db.commit()
    db.refresh(new_map)

    audit_service.log(
        db=db,
        action="MAP_UPLOADED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="MAP",
        resource_id=str(new_map.id),
        details={"name": name, "version": next_version, "filename": filename},
    )
    return {"status": "SUCCESS", "map_id": new_map.id, "version": next_version}


@router.put("/{map_id}/activate")
def activate_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    target = db.query(MapVersion).filter(MapVersion.id == map_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Map version not found")

    # Deactivate all
    db.query(MapVersion).update({MapVersion.is_active: False})
    target.is_active = True
    db.commit()

    audit_service.log(
        db=db,
        action="MAP_ACTIVATED",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="MAP",
        resource_id=str(target.id),
        details={"name": target.name, "version": target.version},
    )
    return {"status": "SUCCESS", "activated_map_id": target.id}
