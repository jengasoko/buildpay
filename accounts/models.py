from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
  ROLE_CHOICES = (
    ('ADMIN', 'Admin'),
    ('PROJECT_MANAGER', 'Project Manager'),
    ('FINANCIAL_OFFICER', 'Financial Officer'),
    ('EMPLOYER', 'Employer'),
    ('EMPLOYEE', 'Employee'),
  )    

  role = models.CharField(max_length=20, choices=ROLE_CHOICES)
  phone = models.CharField(max_length=20, blank=True, null=True)
  
  def __str__(self):
    return f"{self.username} ({self.role})"
