from django.db import models

# Create your models here.
class Project(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    expected_completion = models.DateField()
    actual_completion = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.name
