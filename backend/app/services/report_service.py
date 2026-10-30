import os
import csv
import io
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

# Fix Python 3.8 hashlib compatibility for ReportLab on Windows
try:
    _orig_md5 = hashlib.md5
    hashlib.md5 = lambda *args, **kwargs: _orig_md5(*args, **{k: v for k, v in kwargs.items() if k != "usedforsecurity"})
except Exception:
    pass

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.models.patrol import Patrol, PatrolEvent
from app.models.sensor import SensorReading
from app.models.alert import Alert
from app.models.report import Report
from app.core.config import settings

class ReportService:
    @staticmethod
    def generate_patrol_pdf(db: Session, patrol_id: int, generated_by: str = "SYSTEM") -> Tuple[str, Report]:
        patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
        if not patrol:
            raise ValueError(f"Patrol #{patrol_id} not found")

        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        report_code = f"RPT-{patrol.patrol_number}"
        filename = f"{report_code}.pdf"
        file_path = os.path.join(settings.REPORTS_DIR, filename)

        # Retrieve related data
        events = db.query(PatrolEvent).filter(PatrolEvent.patrol_id == patrol_id).all()
        alerts = db.query(Alert).filter(Alert.patrol_id == patrol_id).all()

        # Build PDF Document
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#0B132B"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            "SubTitleStyle",
            parent=styles["Normal"],
            fontSize=11,
            textColor=colors.HexColor("#3A506B"),
            spaceAfter=14
        )
        h2_style = ParagraphStyle(
            "H2Style",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#1C2541"),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyStyle",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#1F2937"),
            leading=12
        )

        elements = []

        # Header Title
        elements.append(Paragraph("MINING SAFETY ROVER - DIGITAL PATROL REPORT", title_style))
        elements.append(Paragraph(
            f"Autonomous Inspection Log & AI Safety Assessment | Report Ref: {report_code} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#3A506B"), spaceAfter=14))

        # 1. Executive Summary Table
        status_color = colors.HexColor("#10B981") # Green
        if patrol.final_status == "ALERT":
            status_color = colors.HexColor("#EF4444") # Red
        elif patrol.final_status == "ANOMALOUS":
            status_color = colors.HexColor("#F59E0B") # Amber

        summary_data = [
            [
                Paragraph("<b>Patrol ID:</b>", body_style), Paragraph(patrol.patrol_number, body_style),
                Paragraph("<b>Rover Assigned:</b>", body_style), Paragraph(patrol.rover.code if patrol.rover else "ROVER-01", body_style)
            ],
            [
                Paragraph("<b>Mine Site:</b>", body_style), Paragraph(patrol.mine.name if patrol.mine else "Alpha Underground", body_style),
                Paragraph("<b>Final Safety Status:</b>", body_style), Paragraph(f"<b>{patrol.final_status}</b>", body_style)
            ],
            [
                Paragraph("<b>Start Time:</b>", body_style), Paragraph(patrol.start_time.strftime('%Y-%m-%d %H:%M:%S'), body_style),
                Paragraph("<b>End Time:</b>", body_style), Paragraph(patrol.end_time.strftime('%Y-%m-%d %H:%M:%S') if patrol.end_time else "In Progress", body_style)
            ],
            [
                Paragraph("<b>Duration:</b>", body_style), Paragraph(f"{patrol.duration_seconds // 60}m {patrol.duration_seconds % 60}s", body_style),
                Paragraph("<b>Distance Covered:</b>", body_style), Paragraph(f"{patrol.distance_meters:.0f} meters", body_style)
            ],
            [
                Paragraph("<b>Inspected Zones:</b>", body_style), Paragraph(", ".join(patrol.zones_inspected or ["None"]), body_style),
                Paragraph("<b>Hazard Events:</b>", body_style), Paragraph(f"{patrol.critical_events_count} Critical, {patrol.anomalies_count} Anomalies", body_style)
            ]
        ]

        summary_table = Table(summary_data, colWidths=[100, 160, 110, 170])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F3F4F6")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 14))

        # 2. Patrol Chronological Timeline
        elements.append(Paragraph("Chronological Patrol Timeline & AI Observations", h2_style))
        timeline_rows = [
            [
                Paragraph("<b>Timestamp</b>", body_style),
                Paragraph("<b>Event Type</b>", body_style),
                Paragraph("<b>Risk Score</b>", body_style),
                Paragraph("<b>Description</b>", body_style)
            ]
        ]
        for evt in events[:12]:
            t_str = evt.timestamp.strftime('%H:%M:%S')
            timeline_rows.append([
                Paragraph(t_str, body_style),
                Paragraph(f"<b>{evt.event_type}</b>", body_style),
                Paragraph(f"{evt.risk_score:.0f}/100", body_style),
                Paragraph(evt.description, body_style)
            ])

        timeline_table = Table(timeline_rows, colWidths=[70, 95, 65, 310])
        timeline_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1C2541")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(timeline_table)
        elements.append(Spacer(1, 14))

        # 3. Hazard & Alert Summary (if any)
        if alerts:
            elements.append(Paragraph("Safety Alerts & Rule Violations Generated", h2_style))
            alert_rows = [
                [
                    Paragraph("<b>Time</b>", body_style),
                    Paragraph("<b>Severity</b>", body_style),
                    Paragraph("<b>Hazard Type</b>", body_style),
                    Paragraph("<b>Title & Factors</b>", body_style),
                    Paragraph("<b>Status</b>", body_style)
                ]
            ]
            for alt in alerts:
                factors_str = " | ".join(alt.contributing_factors or [])
                alert_rows.append([
                    Paragraph(alt.created_at.strftime('%H:%M:%S'), body_style),
                    Paragraph(f"<b>{alt.severity}</b>", body_style),
                    Paragraph(alt.hazard_type, body_style),
                    Paragraph(f"{alt.title}<br/><font color='#6B7280'>{factors_str}</font>", body_style),
                    Paragraph(alt.status, body_style)
                ])
            alert_table = Table(alert_rows, colWidths=[60, 65, 95, 250, 70])
            alert_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#991B1B")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(alert_table)
            elements.append(Spacer(1, 14))

        # 4. Mandatory System Safety & Synthetic Data Note
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#9CA3AF"), spaceBefore=10, spaceAfter=8))
        elements.append(Paragraph(
            "<b>Compliance Notice:</b> This report was generated by the Mining Safety Rover decision support system. "
            "Layer 1 deterministic rules enforce immediate safety bounds, while Layer 2 Random Forest ML provides early warning trend analysis. "
            "Telemetry models utilize synthetic baseline patterns for prototype validation.",
            ParagraphStyle("FooterNotice", parent=styles["Normal"], fontSize=7, textColor=colors.HexColor("#6B7280"))
        ))

        # Build PDF
        doc.build(elements)

        # Record in database
        report_record = db.query(Report).filter(Report.report_code == report_code).first()
        if not report_record:
            report_record = Report(
                patrol_id=patrol_id,
                report_code=report_code,
                title=f"Patrol Report - {patrol.patrol_number}",
                file_path=file_path,
                format="PDF",
                generated_by=generated_by,
                summary_json={
                    "patrol_number": patrol.patrol_number,
                    "final_status": patrol.final_status,
                    "duration_seconds": patrol.duration_seconds,
                    "distance_meters": patrol.distance_meters,
                    "critical_events": patrol.critical_events_count,
                    "anomalies": patrol.anomalies_count,
                },
                created_at=datetime.utcnow()
            )
            db.add(report_record)
            db.commit()
            db.refresh(report_record)

        return file_path, report_record

    @staticmethod
    def generate_patrol_csv(db: Session, patrol_id: int) -> str:
        patrol = db.query(Patrol).filter(Patrol.id == patrol_id).first()
        if not patrol:
            raise ValueError(f"Patrol #{patrol_id} not found")

        readings = db.query(SensorReading).filter(
            SensorReading.rover_id == patrol.rover_id,
            SensorReading.timestamp >= patrol.start_time,
            SensorReading.timestamp <= (patrol.end_time or datetime.utcnow())
        ).order_by(SensorReading.timestamp).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "timestamp", "rover_id", "zone_id", "methane_ppm", "co_ppm", 
            "temperature_c", "humidity_pct", "water_detected", "vibration_g", 
            "battery_pct", "rule_status", "ml_status", "risk_score"
        ])
        for r in readings:
            writer.writerow([
                r.timestamp.isoformat(), r.rover_id, r.zone_id, r.methane_ppm,
                r.co_ppm, r.temperature_c, r.humidity_pct, r.water_detected,
                r.vibration_g, r.battery_pct, r.rule_status, r.ml_status, r.risk_score
            ])
        return output.getvalue()

report_service = ReportService()
