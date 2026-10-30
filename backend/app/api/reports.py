import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.models.report import Report
from app.models.patrol import Patrol
from app.models.user import User
from app.schemas.report import ReportResponse, ReportGenerateRequest
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Inspection Reports"])

@router.get("", response_model=List[ReportResponse])
def list_reports(limit: int = 50, db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(desc(Report.created_at)).limit(limit).all()
    return reports

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patrol = db.query(Patrol).filter(Patrol.id == req.patrol_id).first()
    if not patrol:
        raise HTTPException(status_code=404, detail="Patrol record not found")

    if req.format.upper() == "PDF":
        file_path, report_record = report_service.generate_patrol_pdf(
            db, req.patrol_id, generated_by=current_user.username
        )
        return report_record
    elif req.format.upper() == "CSV":
        csv_content = report_service.generate_patrol_csv(db, req.patrol_id)
        report_code = f"CSV-{patrol.patrol_number}"
        report_record = db.query(Report).filter(Report.report_code == report_code).first()
        if not report_record:
            report_record = Report(
                patrol_id=patrol.id,
                report_code=report_code,
                title=f"Telemetry CSV Export - {patrol.patrol_number}",
                format="CSV",
                generated_by=current_user.username,
                summary_json={"patrol_number": patrol.patrol_number},
            )
            db.add(report_record)
            db.commit()
            db.refresh(report_record)
        return report_record
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Choose PDF or CSV.")

@router.get("/{report_id}/download")
def download_pdf_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        # Generate on the fly if file missing
        if report and report.patrol_id:
            file_path, _ = report_service.generate_patrol_pdf(db, report.patrol_id)
            return FileResponse(file_path, media_type="application/pdf", filename=f"{report.report_code}.pdf")
        raise HTTPException(status_code=404, detail="PDF report file not found on disk")

    return FileResponse(
        report.file_path,
        media_type="application/pdf",
        filename=f"{report.report_code}.pdf"
    )

@router.get("/{report_id}/csv")
def download_csv_export(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    csv_data = report_service.generate_patrol_csv(db, report.patrol_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report.report_code}.csv"}
    )
