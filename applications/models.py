from django.db import models
from django.conf import settings

# Create your models here.
class Application(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('EMPLOYER_APPROVED', 'Employer Approved'),
        ('FINANCIAL_APPROVED', 'Financial Approved'),
        ('REJECTED', 'Rejected'),
    )

    employee = models.ForeignKey(settings.AUTH_USER_MODEL,
                                  on_delete=models.CASCADE,
                                  related_name='applications'
                                )
    house = models.ForeignKey(
        'houses.House',
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'

    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} - {self.house}"
