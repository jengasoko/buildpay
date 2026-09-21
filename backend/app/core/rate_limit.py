import threading
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.exceptions import TooManyRequestsException


class InMemoryRateLimiter:
    """Fixed-window request limiter keyed per-process.

    In-memory and per-worker: under gunicorn with N workers the effective
    global limit is up to N times what's configured here. That's enough to
    blunt naive brute-force/credential-stuffing bots; a shared store (e.g.
    Redis, like the TODO already noted on InMemoryCache) would be needed for
    strict enforcement across workers.
    """

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> bool:
        """Records a hit for `key`. Returns False if it exceeds the limit."""
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True


rate_limiter = InMemoryRateLimiter()


def rate_limit(key_prefix: str, limit: int, window_seconds: int):
    """FastAPI dependency factory: caps requests per client IP per window."""

    def dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.hit(f"{key_prefix}:{client_ip}", limit, window_seconds):
            raise TooManyRequestsException()

    return dependency
