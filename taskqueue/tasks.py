from .celery_app import app
import time
import sys
import os
import json
sys.path += os.path.abspath(os.path.join(__file__, "../../"))
from brqbackend.wsgi import application  # noqa
from collector.models import File, Track  # noqa
from procs import parser


def json_to_bytes(jsondata):
    return bytes(str(json.dumps(jsondata)), 'utf-8')


def process_blob(file):
    try:
        blob = str(file.data.tobytes(), 'utf-8')
        ret = parser.try_parse(blob, filename=file.name)

        if not ret:
            file.error = "No matching parser found"
            file.save()
            return

    except Exception as e:
        file.error = str(e)
        file.save()
        raise

    jd = Track.objects.create(
        data=json_to_bytes(ret),
        source=file)
    jd.save()

    file.error = ''
    file.save()


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
        process_blob(file)
        return True
    return False