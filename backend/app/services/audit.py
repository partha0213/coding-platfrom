from sqlalchemy.orm import Session
from app.models.learning import AdminAuditLog
from typing import Any, Optional

def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None
):
    """
    Log an admin action to the audit logs table.
    """
    log_entry = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
