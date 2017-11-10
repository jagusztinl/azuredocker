from django.db import models
import json
# Create your models here.


    # Yeah


class File(models.Model):
    """
    Stores an uploaded file. Related to :model:`collector.JsonData` which
    stores the derived JSON data if CSV parsing was successful.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    DATATYPES=(
        ('L', 'Location CSV'),
        ('A', 'Accelerometer CSV'),
    )
    name = models.CharField(max_length=256)
    datatype = models.CharField(max_length=1, choices=DATATYPES)
    data = models.BinaryField()
    size = models.BigIntegerField(default=-1)

    def save(self, *args, **kwargs):
        if self.size < 0 and self.__dict__.get('data'):
            if hasattr(self.data, 'nbytes'):
                # If we have read from the database
                self.size = self.data.nbytes
            else:
                # If have only bytes
                self.size = len(self.data)

        super().save(*args, **kwargs)


    @property
    def jsondata_meta(self):
        return [jd.as_json() for jd in JsonData.objects.filter(source=self.id)]

    def as_json(self):
        """
        :returns: a json representation of the model
        """
        ret = {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'jsondata': None,
        }
        try:
            ret['jsondata'] = self.jsondata.id
        except:
            pass

        return ret


class JsonData(models.Model):
    """
    Stores json data derived from a :model:`collector.File`
    """
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.BinaryField()
    source = models.OneToOneField(
        File, null=True, on_delete=models.CASCADE, parent_link=True)

    def as_json(self):
        """
        :returns: a json representation of the model
        """
        return {
            'id': self.id,
            'size': self.data.nbytes,
            'data': json.loads(str(self.data.tobytes(), 'utf-8'))
        }





