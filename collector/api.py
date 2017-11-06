from django.shortcuts import render
#from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count
from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    JsonResponse,
)
from django.conf.urls import url

import datetime
import re
import collector.filehandler as filehandler
from .models import File

# Create your views here.

@csrf_exempt
def file_all(request):
    # TODO: Count() can probably be replaced with something quicker
    files = File.objects.annotate(processed=Count('jsondata')).order_by('id')

    ret = []
    for file in files:
        ret.append(dict(
            id=file.id,
            name=file.name,
            size=file.size,
            processed=file.processed,
        ))

    return JsonResponse(ret, safe=False)

@csrf_exempt
def file_single(request, item_id=None):
    file = File.objects.filter(id=item_id).first()
    method = request.method
    if method == 'GET':
        return JsonResponse(file.as_json(), safe=False)
    if method == 'DELETE':
        file.delete()
        return JsonResponse({
            'success': True
        })

@csrf_exempt
def task_state(request, task_id=None):
    return JsonResponse({
        "success": True,
        "state": filehandler.get_task_state(task_id)
    })


urlpatterns = [
    url(r'^API/files/$', file_all),
    url(r'^API/files/(?P<item_id>[0-9]+)$', file_single),
    url(r'^API/tasks/(?P<task_id>[a-z0-9\-]+)$', task_state),
]