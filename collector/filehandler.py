from .models import File, JsonData
from taskqueue import tasks
from celery.result import AsyncResult
import json

def json_to_bytes(jsondata):
    return bytes(str(json.dumps(jsondata)), 'utf-8')

def save_request_file(request_file):
    """ Save a file from a request """
    rf = request_file
    fileModel = File(
        name=rf.name,
        data=rf.read(),
    )
    fileModel.save()
#    process_file(fileModel.id);
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

def process_file(id_):
    result = tasks.blob_to_dict.delay(id_)
    if result:
        return result.id
    return None

def get_task_state(task_id):
    res = AsyncResult(task_id, app=tasks.app)
    return res.state

