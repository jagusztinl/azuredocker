from django.db import models

# Create your models here.


    # Yeah


class File(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    DATATYPES=(
        ('L', 'Location CSV'),
        ('A', 'Accelerometer CSV'),
    )
    name = models.CharField(max_length=256)
    datatype = models.CharField(max_length=1, choices=DATATYPES)
    data = models.BinaryField()

    @property
    def size(self):
        if self.data:
            return self.data.nbytes
        else:
            return 0


class JsonData(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.BinaryField()
    source = models.OneToOneField(
        File, null=True, on_delete=models.CASCADE, parent_link=True)


#class FileToJsonData(models.Model):
#    file = models.ForeignKey(File, on_delete=models.CASCADE)
#    jsondata = models.ForeignKey(JsonData, on_delete=models.CASCADE)




