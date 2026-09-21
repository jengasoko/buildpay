from app.core.rate_limit import InMemoryRateLimiter


class TestInMemoryRateLimiter:
    def test_allows_requests_up_to_the_limit(self):
        limiter = InMemoryRateLimiter()
        for _ in range(3):
            assert limiter.hit("key", limit=3, window_seconds=60) is True

    def test_blocks_once_the_limit_is_exceeded(self):
        limiter = InMemoryRateLimiter()
        for _ in range(3):
            limiter.hit("key", limit=3, window_seconds=60)
        assert limiter.hit("key", limit=3, window_seconds=60) is False

    def test_keys_are_independent(self):
        limiter = InMemoryRateLimiter()
        for _ in range(3):
            limiter.hit("a", limit=3, window_seconds=60)
        assert limiter.hit("b", limit=3, window_seconds=60) is True

    def test_old_hits_fall_out_of_the_window(self, monkeypatch):
        limiter = InMemoryRateLimiter()
        current_time = [1000.0]
        monkeypatch.setattr("app.core.rate_limit.time.monotonic", lambda: current_time[0])

        for _ in range(3):
            limiter.hit("key", limit=3, window_seconds=60)
        assert limiter.hit("key", limit=3, window_seconds=60) is False

        current_time[0] += 61
        assert limiter.hit("key", limit=3, window_seconds=60) is True
