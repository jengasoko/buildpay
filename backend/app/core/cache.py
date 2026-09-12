import logging

logger = logging.getLogger("hms.cache")


class InMemoryCache:
    """Simple in-memory cache. Replace with Redis when caching requirements justify it."""

    def __init__(self) -> None:
        self._store: dict[str, object] = {}

    def get(self, key: str) -> object | None:
        return self._store.get(key)

    def set(self, key: str, value: object, ttl: int | None = None) -> None:
        self._store[key] = value
        if ttl is not None:
            logger.debug("Cache set with ttl=%d (ttl expiry not implemented in-memory)", ttl)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


cache = InMemoryCache()
