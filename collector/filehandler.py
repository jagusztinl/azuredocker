from .models import File, JsonData
from procs import location_csv
import json

def json_to_bytes(jsondata):
    return bytes(str(json.dumps(jsondata)), 'utf-8')

def save_request_file(request_file):
    """ Save a file from a request """
    rf = request_file
    fileModel = File(
        name=rf.name,
        data=rf.read(),
        size=rf.size,
    )
    fileModel.save()
    return dict(
        size=rf.size,
        name=rf.name,
    )


def delete_file(id_):
    file = File.objects.filter(id=id_).first()
    if file:
        file.delete()
        return True
    return False


def _process_file(file):
    print("processing file!")
    blob = str(file.data.tobytes(), 'utf-8')
    ret = location_csv.blob_to_dict(blob)
    jd = JsonData.objects.create(
        data=json_to_bytes(ret),
        source=file)
    jd.save()
    print("saved JsonData with id #{}".format(jd.id))



def process_file(id_):
    file = File.objects.filter(id=id_).first()
    if file:
        _process_file(file)
        return True
    return False
