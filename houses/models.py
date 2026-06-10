from django.db import models

# Create your models here.

class House(models.Model):
    
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='houses', null=True, blank=True)

    title = models.CharField(max_length=255)

    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)

    area_sqft = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    location = models.CharField(max_length=255)
    rent_price = models.DecimalField(max_digits=10, decimal_places=2)

    price = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    image = models.ImageField(upload_to='house_images/', blank=True, null=True)

    available = models.BooleanField(default=True)


    def __str__(self):
        return self.title
