from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


class TestPasswordHashing:
    def test_hash_password(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed)

    def test_verify_wrong_password(self):
        hashed = hash_password("correct_password")
        assert not verify_password("wrong_password", hashed)

    def test_same_password_different_hashes(self):
        h1 = hash_password("test")
        h2 = hash_password("test")
        assert h1 != h2


class TestJWT:
    def test_create_and_decode_token(self):
        data = {"sub": "1", "role": "ADMIN"}
        token = create_access_token(data)
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["role"] == "ADMIN"

    def test_decode_invalid_token(self):
        result = decode_access_token("invalid.token.here")
        assert result is None

    def test_decode_empty_token(self):
        result = decode_access_token("")
        assert result is None
