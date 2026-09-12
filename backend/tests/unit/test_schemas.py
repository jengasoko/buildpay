from pydantic import ValidationError

from app.models import UserRole
from app.schemas import HouseCreate, PaymentCreate, ProjectCreate, UserCreate


class TestUserCreateSchema:
    def test_valid_user(self):
        user = UserCreate(
            username="testuser",
            email="test@example.com",
            password="securepass123",
            role=UserRole.EMPLOYEE,
        )
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == UserRole.EMPLOYEE

    def test_invalid_email(self):
        try:
            UserCreate(
                username="testuser",
                email="not-an-email",
                password="securepass123",
            )
            raise AssertionError("Should have raised ValidationError")
        except ValidationError:
            pass


class TestHouseCreateSchema:
    def test_valid_house(self):
        house = HouseCreate(
            title="Test House",
            location="Nairobi",
            rent_price=1500.00,
            price=50000.00,
        )
        assert house.title == "Test House"
        assert house.bedrooms == 0
        assert house.available is True

    def test_invalid_rent_price(self):
        try:
            HouseCreate(
                title="Test House",
                location="Nairobi",
                rent_price=-100,
            )
            raise AssertionError("Should have raised ValidationError")
        except ValidationError:
            pass


class TestPaymentCreateSchema:
    def test_valid_payment(self):
        payment = PaymentCreate(amount=1000.00, reference="PAY-001")
        assert payment.amount == 1000.00
        assert payment.reference == "PAY-001"

    def test_zero_amount_fails(self):
        try:
            PaymentCreate(amount=0)
            raise AssertionError("Should have raised ValidationError")
        except ValidationError:
            pass


class TestProjectCreateSchema:
    def test_valid_project(self):
        from datetime import datetime

        project = ProjectCreate(
            name="Test Project",
            location="Lagos",
            start_date=datetime(2025, 1, 1),
            expected_completion=datetime(2025, 12, 31),
        )
        assert project.name == "Test Project"
