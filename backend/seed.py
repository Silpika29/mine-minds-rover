import random
from datetime import datetime, timedelta
from app.database.session import SessionLocal, Base, engine
from app.models import Role, User, Mine, Zone, Rover, SensorReading, Alert, Patrol, PatrolEvent, Report, AuditLog
from app.core.security import get_password_hash
from app.services.report_service import report_service

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Role).count() > 0:
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Roles...")
        role_admin = Role(name="admin", description="Full system access, user management, and configuration")
        role_supervisor = Role(name="supervisor", description="Mine supervisor, rover and alert management")
        role_authority = Role(name="authority", description="Higher safety authority, multi-site compliance & reports")
        db.add_all([role_admin, role_supervisor, role_authority])
        db.commit()

        print("Seeding Mine & Zones...")
        mine = Mine(
            code="MINE-ALPHA",
            name="Silver Peak Deep Colliery",
            location="Sector 7, Sub-Level 4, North Shaft",
            description="Active underground anthracite extraction mine with automated patrol routes.",
            status="ACTIVE"
        )
        db.add(mine)
        db.commit()

        zones = [
            Zone(mine_id=mine.id, code="ENTRY", name="Main Portal & Shaft Base", order_index=0, x_coord=80, y_coord=180, length_meters=80),
            Zone(mine_id=mine.id, code="ZONE-01", name="Main Adit & Haulage Tunnel", order_index=1, x_coord=240, y_coord=180, length_meters=120),
            Zone(mine_id=mine.id, code="ZONE-02", name="Conveyor Transfer Station", order_index=2, x_coord=420, y_coord=180, length_meters=110),
            Zone(mine_id=mine.id, code="ZONE-03", name="Tunnel B Longwall Heading", order_index=3, x_coord=600, y_coord=300, length_meters=150),
            Zone(mine_id=mine.id, code="ZONE-04", name="Deep Extraction Face", order_index=4, x_coord=780, y_coord=300, length_meters=140),
        ]
        db.add_all(zones)
        db.commit()

        print("Seeding Users...")
        admin_user = User(
            email="admin@miningrover.com",
            username="admin",
            full_name="Chief Safety Officer (Admin)",
            hashed_password=get_password_hash("admin123"),
            role_id=role_admin.id,
            is_active=True
        )
        supervisor_user = User(
            email="supervisor@miningrover.com",
            username="supervisor",
            full_name="Marcus Vance (Shift Supervisor)",
            hashed_password=get_password_hash("supervisor123"),
            role_id=role_supervisor.id,
            assigned_mine_id=mine.id,
            is_active=True
        )
        authority_user = User(
            email="authority@miningrover.com",
            username="authority",
            full_name="Dr. Elena Rostova (Mine Safety Inspector)",
            hashed_password=get_password_hash("authority123"),
            role_id=role_authority.id,
            is_active=True
        )
        db.add_all([admin_user, supervisor_user, authority_user])
        db.commit()

        print("Seeding Rover...")
        rover = Rover(
            code="ROVER-01",
            name="RoboMiner Autonomous Scout",
            mine_id=mine.id,
            current_zone_id=zones[3].id,
            battery_level=88.5,
            status="PATROLLING",
            hazard_status="NORMAL",
            firmware_version="v2.4.1-esp32-lora",
            last_ping_at=datetime.utcnow()
        )
        db.add(rover)
        db.commit()

        print("Seeding Patrols...")
        patrol_1 = Patrol(
            patrol_number="PATROL-001",
            rover_id=rover.id,
            mine_id=mine.id,
            start_time=datetime.utcnow() - timedelta(hours=2),
            end_time=datetime.utcnow() - timedelta(hours=1),
            duration_seconds=3600,
            distance_meters=600.0,
            zones_inspected=["ENTRY", "ZONE-01", "ZONE-02", "ZONE-03"],
            normal_events_count=18,
            anomalies_count=1,
            critical_events_count=0,
            final_status="NORMAL",
            notes="Routine automated sector patrol completed successfully."
        )
        db.add(patrol_1)
        db.commit()

        print("Seeding Audit Trail...")
        audit_entries = [
            AuditLog(user_id=admin_user.id, username=admin_user.username, action="SYSTEM_INITIALIZED", resource_type="SYSTEM", status="SUCCESS", timestamp=datetime.utcnow()),
        ]
        db.add_all(audit_entries)
        db.commit()

        print("Database seeded successfully with realistic demonstration records!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
