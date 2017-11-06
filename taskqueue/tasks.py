from .celery_app import app
import time
import sys
import os
import json
sys.path += os.path.abspath(os.path.join(__file__, "../../"))
from brqbackend.wsgi import application  # noqa
from procs import location_csv  # noqa
from collector.models import File, JsonData  # noqa


def json_to_bytes(jsondata):
    return bytes(str(json.dumps(jsondata)), 'utf-8')

def _process_file(file):
    blob = str(file.data.tobytes(), 'utf-8')
    ret = location_csv.blob_to_dict(blob)
    jd = JsonData.objects.create(
        data=json_to_bytes(ret),
        source=file)
    jd.save()


@app.task
def mock_task(sleep_seconds=1):
    print("task start")
    time.sleep(sleep_seconds)
    print("Task end")
    return "Slept {} seconds.".format(sleep_seconds)

@app.task
def blob_to_dict(id_):
    file = File.objects.filter(id=id_).first()
    if file:
        _process_file(file)
        return True
    return False