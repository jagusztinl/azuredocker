from django.db import models

# Create your models here.

class File(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    DATATYPES=(
        ('L', 'Location CSV'),
        ('A', 'Accelerometer CSV'),
    )
    name = models.CharField(max_length=256)
    datatype = models.CharField(max_length=1, choices=DATATYPES)
    data = models.BinaryField()
    size = models.BigIntegerField()

    # Yeah
