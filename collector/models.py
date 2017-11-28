from django.db import models
from django.contrib.auth.models import User
import json
# Create your models here.


    # Yeah


class File(models.Model):
    """
    Stores an uploaded file. Related to :model:`collector.Track` which
    stores the derived JSON data if CSV parsing was successful.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.BinaryField(help_text='The file contents')
    error = models.CharField(
        max_length=255,
        help_text='Last error message',
        default='',
    )
    name = models.CharField(
        max_length=256,
        help_text='File name'
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        help_text='User owning this file',
    )
    size = models.BigIntegerField(
        default=-1,
        help_text='The size of the file, derived from the data field '
                  'and stored for speed'
    )

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
        return [jd.as_json() for jd in Track.objects.filter(source=self.id)]

    def as_json(self):
        """
        :returns: a json representation of the model
        """
        ret = {
            'id': self.id,
            'created_at': self.created_at,
            'name': self.name,
            'size': self.size,
            'owner': self.owner.id,
            'error': self.error,
            'track': None,
        }
        try:
            track = Track.objects.filter(source=self.id).first()
            if track:
                ret['track'] = track.id
        except Exception as e:
            ret['track_error'] = str(e)
            pass

        return ret


class Track(models.Model):
    """
    Stores json data derived from a :model:`collector.File`
    """
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.BinaryField()
#    source = models.OneToOneField(
#        File, null=True, on_delete=models.CASCADE, parent_link=True)
    source = models.ForeignKey(
        File,
        on_delete=models.CASCADE,
        help_text='File this track was extracted from',
    )
    bla = models.BigIntegerField()

    def as_json(self):
        """
        :returns: a json representation of the model
        """
        return {
            'id': self.id,
            'created_at': self.created_at,
            'source_name': self.source.name,
            'size': self.data.nbytes,
            'data': json.loads(str(self.data.tobytes(), 'utf-8'))
        }
