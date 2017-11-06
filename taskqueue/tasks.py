from .celery_app import app
import time
import sys
import os
sys.path += os.path.abspath(os.path.join(__file__, "../../"))
from procs import location_csv  # noqa


@app.task
def mock_task(sleep_seconds=1):
    print("task start")
    time.sleep(sleep_seconds)
    print("Task end")
    return "Slept {} seconds.".format(sleep_seconds)

@app.task
def blob_to_dict(blob):
    return location_csv.blob_to_dict(blob)
