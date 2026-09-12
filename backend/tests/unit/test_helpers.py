from datetime import datetime

from app.utils.helpers import utc_now


class TestHelpers:
    def test_utc_now(self):
        result = utc_now()
        assert isinstance(result, datetime)
        assert result.tzinfo is not None
