from app.core.cache import cache


class TestCache:
    def test_set_and_get(self):
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_missing_key(self):
        assert cache.get("nonexistent") is None

    def test_delete(self):
        cache.set("key2", "value2")
        cache.delete("key2")
        assert cache.get("key2") is None

    def test_clear(self):
        cache.set("a", 1)
        cache.set("b", 2)
        cache.clear()
        assert cache.get("a") is None
        assert cache.get("b") is None

    def test_overwrite(self):
        cache.set("k", "old")
        cache.set("k", "new")
        assert cache.get("k") == "new"
