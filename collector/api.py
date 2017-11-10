from django.shortcuts import render
#from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import django.db.models as models

from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    JsonResponse,
    Http404,
)
from django.conf.urls import url
from rest_framework.decorators import api_view
from rest_framework.response import Response

import datetime
import time
import collector.filehandler as filehandler
from .models import File
import logging as log

BASE_URL = "API/"


def annotate_url(items, request=None, tpl=None):
    host = request.get_host()
    tpl = "http://{}/{}{}".format(host, BASE_URL, tpl)
    for item in items:
        item['url'] = tpl.format(**item)


# Create your views here.



class Timer(object):
    def __init__(self):
        self.start = time.time()

    def __str__(self):
        return "{:3.0f}ms".format((time.time() - self.start) * 1000.0)


@api_view(['GET'])
@login_required
@csrf_exempt
def file_all(request):
    # TODO: Count() can probably be replaced with something quicker
#    files = File.objects.annotate(processed=Count('jsondata')).order_by('id')
    startTimer = Timer()

    files = File.objects.values(
        'id', 'name', 'created_at', 'jsondata', 'size').order_by('id')

    annotate_url(files, request=request, tpl="files/{id}")

#    files = [f.as_json() for f in File.objects.all().order_by('id')]

#    log.info("query: {}".format(files.query))

    log.debug("host: {}".format(request.get_host()))

    log.debug("Time for querying files: {}".format(startTimer))

    log.debug("Time in file_all before serializing: {}".format(startTimer))

    return Response(list(files))

@api_view(['GET', 'DELETE'])
@login_required
@csrf_exempt
def file_single(request, item_id=None):
    try:
        file = File.objects.get(id=item_id)
    except File.DoesNotExist:
        raise Http404()
    method = request.method
    if method == 'GET':
        return Response(file.as_json())
    if method == 'DELETE':
        file.delete()
        return Response({
            'success': True
        })

@api_view(['GET'])
@login_required
@csrf_exempt
def file_single_jsondata(request, item_id=None):
    try:
        file = File.objects.get(id=item_id)
    except File.DoesNotExist:
        raise Http404()

    if not file.jsondata_meta:
        raise Http404()

    return Response(file.jsondata.as_json()['data'])

@csrf_exempt
@login_required
def task_state(request, task_id=None):
    return JsonResponse({
        "success": True,
        "state": filehandler.get_task_state(task_id)
    })


urlpatterns = [
    url(r'^{}files/$'.format(BASE_URL), file_all),
    url(r'^{}files/(?P<item_id>[0-9]+)$'.format(BASE_URL), file_single),
    url(r'^{}files/(?P<item_id>[0-9]+)/jsondata$'.format(BASE_URL),
        file_single_jsondata),
    url(r'^{}tasks/(?P<task_id>[a-z0-9\-]+)$'.format(BASE_URL), task_state),
]