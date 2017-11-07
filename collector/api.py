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
import time
import re
import collector.filehandler as filehandler
from .models import File
import logging as log

# Create your views here.


class Timer(object):
    def __init__(self):
        self.start = time.time()

    def __str__(self):
        return "{:3.0f}ms".format((time.time() - self.start) * 1000.0)


@csrf_exempt
def file_all(request):
    # TODO: Count() can probably be replaced with something quicker
#    files = File.objects.annotate(processed=Count('jsondata')).order_by('id')
    startTimer = Timer()

    files = File.objects.values('id', 'name', 'created_at', 'jsondata', 'size').order_by('id')
#    files = [f.as_json() for f in File.objects.all().order_by('id')]

#    log.info("query: {}".format(files.query))

    log.debug("Time for querying files: {}".format(startTimer))

    log.debug("Time in file_all before serializing: {}".format(startTimer))

    return JsonResponse(list(files), safe=False)

@csrf_exempt
def file_single(request, item_id=None):
    file = File.objects.get(id=item_id)
    method = request.method
    if method == 'GET':
        return JsonResponse(file.as_json(), safe=False)
    if method == 'DELETE':
        file.delete()
        return JsonResponse({
            'success': True
        })

@csrf_exempt
def file_single_jsondata(request, item_id=None):
    if request.method != 'GET':
        return HttpResponse(status=405)
    try:
        file = File.objects.get(id=item_id)
    except File.DoesNotExist:
        return HttpResponse(status=404)

    if not file.jsondata_meta:
        return HttpResponse(status=404)

    return JsonResponse(file.jsondata.as_json()['data'], safe=False)

@csrf_exempt
def task_state(request, task_id=None):
    return JsonResponse({
        "success": True,
        "state": filehandler.get_task_state(task_id)
    })


urlpatterns = [
    url(r'^API/files/$', file_all),
    url(r'^API/files/(?P<item_id>[0-9]+)$', file_single),
    url(r'^API/files/(?P<item_id>[0-9]+)/jsondata$', file_single_jsondata),
    url(r'^API/tasks/(?P<task_id>[a-z0-9\-]+)$', task_state),
]