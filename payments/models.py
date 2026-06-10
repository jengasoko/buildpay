from django.db import models

# Create your models here.

class Payment(models.Model):

    application = models.ForeignKey(
                'applications.Application',
          on_delete=models.CASCADE,
            related_name='payments',
            null=True,
            blank=True
            )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    reference = models.CharField(
                max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

   


    def __str__(self):
        return self.reference