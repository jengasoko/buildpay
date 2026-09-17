from calendar import monthrange
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models import House, Invoice, Lease, LeaseStatus, Payment


def _month_key(d: datetime) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def _month_start(key: str) -> datetime:
    return datetime.strptime(f"{key}-01", "%Y-%m-%d")


def _month_end(key: str) -> datetime:
    y, m = int(key[:4]), int(key[5:7])
    return datetime(y, m, monthrange(y, m)[1])


def _next_month(key: str) -> str:
    y, m = int(key[:4]), int(key[5:7])
    if m == 12:
        return f"{y + 1:04d}-01"
    return f"{y:04d}-{m + 1:02d}"


def _last_n_month_keys(months: int) -> list[str]:
    now = datetime.now(UTC).replace(tzinfo=None)
    cur = datetime(now.year, now.month, 1)
    keys: list[str] = []
    for _ in range(months):
        keys.append(_month_key(cur))
        cur = datetime(cur.year - 1, 12, 1) if cur.month == 1 else datetime(cur.year, cur.month - 1, 1)
    return keys[::-1]


def _naive(d: datetime) -> datetime:
    return d.replace(tzinfo=None) if d.tzinfo else d


def _month_key_from(dt) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"


def revenue_trend(db: Session, months: int = 12) -> dict:
    keys = _last_n_month_keys(months)
    since = _month_start(keys[0])
    payments = db.query(Payment).filter(Payment.payment_date >= since).all()
    totals = dict.fromkeys(keys, 0.0)
    for p in payments:
        k = _month_key_from(p.payment_date)
        if k in totals:
            totals[k] = round(totals[k] + float(p.amount), 2)
    return {"data": [{"month": k, "value": totals[k]} for k in keys]}


def occupancy_trend(db: Session, months: int = 12) -> dict:
    keys = _last_n_month_keys(months)
    houses = db.query(House).all()
    leases = db.query(Lease).all()
    points: list[dict] = []
    for k in keys:
        month_end = _month_end(k)
        total = sum(1 for h in houses if _naive(h.created_at) <= month_end)
        occupied = 0
        for lease in leases:
            if lease.status != LeaseStatus.ACTIVE:
                continue
            start = _naive(lease.start_date)
            end = _naive(lease.end_date) if lease.end_date else None
            if start <= month_end and (end is None or end >= _month_start(k)):
                occupied += 1
        points.append({"month": k, "occupied": occupied, "total": total})
    return {"data": points}


def collection_rate(db: Session, months: int = 12) -> dict:
    keys = _last_n_month_keys(months)
    since = _month_start(keys[0])
    invoices = db.query(Invoice).filter(Invoice.period_end >= since).all()
    payments = db.query(Payment).filter(Payment.payment_date >= since).all()

    invoiced = dict.fromkeys(keys, 0.0)
    collected = dict.fromkeys(keys, 0.0)
    for inv in invoices:
        k = _month_key_from(inv.period_end)
        if k in invoiced:
            invoiced[k] = round(invoiced[k] + float(inv.total_amount), 2)
    for p in payments:
        k = _month_key_from(p.payment_date)
        if k in collected:
            collected[k] = round(collected[k] + float(p.amount), 2)

    points: list[dict] = []
    for k in keys:
        billed = invoiced[k]
        received = collected[k]
        rate = round(received / billed * 100, 2) if billed > 0 else 0.0
        points.append({"month": k, "invoiced": billed, "collected": received, "rate": rate})
    return {"data": points}
