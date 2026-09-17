import csv
import io

from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.services import analytics_service, billing_service


def _csv(filename: str, headers: list[str], rows: list[list]) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    bytes_io = buf.getvalue().encode("utf-8")
    return StreamingResponse(
        iter([bytes_io]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def financial_report_csv(db: Session, year: int, month: int) -> StreamingResponse:
    report = billing_service.financial_report(db, year, month)
    rows: list[list] = [
        [f"{report.year}-{report.month:02d}", ""],
        ["Metric", "Value"],
        ["Collected", report.collected],
        ["Outstanding", report.outstanding],
        ["Overdue", report.overdue],
        ["Open Invoices", report.open_invoices],
        ["Active Leases", report.active_leases],
    ]
    for bucket in report.arrears:
        rows.append([f"Arrears {bucket.bucket} days (count)", bucket.count])
        rows.append([f"Arrears {bucket.bucket} days (amount)", bucket.amount])
    return _csv(f"financial_report_{year}_{month:02d}.csv", ["Field", "Value"], rows)


def occupancy_report_csv(db: Session) -> StreamingResponse:
    report = billing_service.occupancy_report(db)
    rows = [
        [h["house_id"], h["title"], h["occupants"], "Available" if h["available"] else "Occupied"]
        for h in report.by_house
    ]
    return _csv("occupancy_report.csv", ["House ID", "Title", "Occupants", "Status"], rows)


def revenue_trend_csv(db: Session, months: int = 12) -> StreamingResponse:
    data = analytics_service.revenue_trend(db, months)["data"]
    rows = [[p["month"], p["value"]] for p in data]
    return _csv("revenue_trend.csv", ["Month", "Collected"], rows)
