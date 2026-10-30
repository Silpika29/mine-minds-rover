from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, require_admin, get_current_user
from app.models.setting import SystemSetting
from app.models.user import User
from app.services.audit_service import audit_service

router = APIRouter(prefix="/settings", tags=["System Settings"])


from datetime import datetime

class SettingOut(BaseModel):
    id: int
    key: str
    name: Optional[str] = None
    value: Any
    unit: Optional[str] = None
    description: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


PARAM_METADATA = {
    "ch4_warning_threshold": {"name": "Methane (CH4) Warning Threshold", "unit": "ppm"},
    "ch4_critical_threshold": {"name": "Methane (CH4) Critical Evacuation Limit", "unit": "ppm"},
    "co_warning_threshold": {"name": "Carbon Monoxide (CO) Warning Threshold", "unit": "ppm"},
    "co_critical_threshold": {"name": "Carbon Monoxide (CO) Lethal Critical Limit", "unit": "ppm"},
    "lora_frequency": {"name": "LoRa Channel Carrier Frequency", "unit": "MHz"},
    "uart_baud_rate": {"name": "Serial / UART Baud Rate", "unit": "bps"},
}


class SettingItem(BaseModel):
    key: str
    value: Any
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None


class SettingUpdateRequest(BaseModel):
    settings: Dict[str, Any]  # key -> value or dict


@router.get("", response_model=List[SettingOut])
def get_all_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(SystemSetting).all()
    out = []
    for r in rows:
        meta = PARAM_METADATA.get(r.key, {})
        out.append(SettingOut(
            id=r.id,
            key=r.key,
            name=r.name or meta.get("name", r.key),
            value=r.value,
            unit=r.unit or meta.get("unit"),
            description=r.description,
            updated_by=r.updated_by,
            updated_at=r.updated_at.isoformat() if r.updated_at else None,
        ))
    return out


@router.put("")
def update_settings(
    req: SettingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    updated_keys = []
    now = datetime.utcnow()
    for key, new_val in req.settings.items():
        # Handle if new_val is primitive or dict
        val = new_val.get("value") if isinstance(new_val, dict) and "value" in new_val else new_val
        meta = PARAM_METADATA.get(key, {})
        param_name = meta.get("name", key)
        param_unit = meta.get("unit")

        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            old_value = setting.value
            setting.value = val
            setting.name = param_name
            setting.unit = param_unit
            setting.updated_by = current_user.username
            setting.updated_at = now
            audit_service.log(
                db=db,
                action="PARAMETER_UPDATED",
                user_id=current_user.id,
                username=current_user.username,
                resource_type="SETTING",
                resource_id=key,
                details={
                    "parameter": key,
                    "parameter_name": param_name,
                    "previous_value": old_value,
                    "new_value": val,
                    "unit": param_unit,
                    "updated_by": current_user.username
                },
            )
            updated_keys.append(key)
        else:
            new_setting = SystemSetting(
                key=key,
                name=param_name,
                value=val,
                unit=param_unit,
                updated_by=current_user.username,
                updated_at=now
            )
            db.add(new_setting)
            audit_service.log(
                db=db,
                action="PARAMETER_CREATED",
                user_id=current_user.id,
                username=current_user.username,
                resource_type="SETTING",
                resource_id=key,
                details={
                    "parameter": key,
                    "parameter_name": param_name,
                    "previous_value": None,
                    "new_value": val,
                    "unit": param_unit,
                    "updated_by": current_user.username
                },
            )
            updated_keys.append(key)
    db.commit()
    return {"status": "SUCCESS", "updated_keys": updated_keys}

