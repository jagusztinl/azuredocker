from .models import File, Track
from celery.result import AsyncResult
import json


def json_to_bytes(jsondata):
    return bytes(str(json.dumps(jsondata)), 'utf-8')

def save_request_file(request_file, owner):
    """ Save a file from a request """
    rf = request_file
    fileModel = File(
        name=rf.name,
        data=rf.read(),
        owner=owner,
    )
    fileModel.save()
#    process_file(fileModel.id);
    return dict(
        id=fileModel.id,
        size=fileModel.size,
        name=fileModel.name,
    )

def save_request_body(body, owner):
    """ Save a file from a request """
    fileModel = File(
        name="posted file",
        data=bytes(body, 'utf-8'),
        owner=owner,
    )
    fileModel.save()
#    process_file(fileModel.id);
    return dict(
        id=fileModel.id,
        size=fileModel.size,
        name=fileModel.name,
    )


def delete_file(id_):
    file = File.objects.filter(id=id_).first()
    if file:
        file.delete()
        return True
    return False

def process_file(id_):
    from taskqueue import tasks
    result = tasks.blob_to_dict.delay(id_)
    if result:
        return result.id
    return None

def get_task_state(task_id):
    from taskqueue import tasks
    res = AsyncResult(task_id, app=tasks.app)
    return res.state

