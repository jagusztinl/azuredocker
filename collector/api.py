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
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

import datetime
import time
import collector.filehandler as filehandler
from .models import File
import logging as log


BASE_URL = "API/"


def annotate_urls(items, request=None, tpl=None, key='url'):
    """
    Returns a new list from dicts with annotation. This does

    :param items: list of dicts to be annotated (left untouched)
    :param request: the request object used to derive hostname etc
    :param tpl: template with named objects like {id}
    :param key: key to add, defaults to 'url'
    :returns: a list of annotated dicts.
    """
    host = request.get_host()
    tpl = "http://{}/{}{}".format(host, BASE_URL, tpl)
    ret = []
    for item in items:
        item_copy = {}
        item_copy.update(item)
        item_copy[key] = tpl.format(**item)
        ret.append(item_copy)
    return ret

def annotate_url(item, request=None, tpl=None, key='url'):
    """
    Convinience function for a single item, see @annotate_urls
    """
    return annotate_urls([item], request=request, tpl=tpl, key=key)[0]

# Create your views here.



class Timer(object):
    def __init__(self):
        self.start = time.time()

    def __str__(self):
        return "{:3.0f}ms".format((time.time() - self.start) * 1000.0)


@api_view(['GET', 'POST'])
@parser_classes((MultiPartParser,))
@login_required
def file_all(request):
    """Lists all files readable by the current user"""
    method = request.method

    if method == 'POST':
        ret = []
        for key in request.FILES.keys():
            for file in request.FILES.getlist(key):
                ret.append(filehandler.save_request_file(file, request.user))
        return Response({
            'success': True,
            'files': annotate_urls(ret, request=request, tpl='files/{id}')
        })


    file_filter = request.GET.get('filter')

    if file_filter:
        # TODO: candidate for refactoring out
        file_ids = [int(file_id) for file_id in file_filter.split(",")]
    else:
        file_ids = []

    if file_ids:
        query = File.objects.filter(id__in=file_ids)
    else:
        query = File.objects.all()

    files = [f.as_json() for f in query.order_by('-created_at')]

    annotated_files = annotate_urls(files, request=request, tpl="files/{id}")

    return Response(annotated_files)

@api_view(['GET', 'DELETE'])
@login_required
def file_single(request, item_id=None):
    """Shows details of a single file"""
    try:
        file = File.objects.get(id=item_id)
    except File.DoesNotExist:
        raise Http404()
    method = request.method
    if method == 'GET':
        ret = file.as_json()
        if ret.get('jsondata'):
            ret = annotate_url(
                ret,
                request=request,
                tpl='files/{id}/jsondata',
                key='jsondata_url',
            )
        else:
            ret['jsondata_url'] = None

        ret = annotate_url(
            ret,
            request=request,
            tpl='files/{id}/data',
            key='data_url'
        )

        return Response(ret)

    if method == 'DELETE':
        file.delete()
        return Response({
            'success': True
        })

@api_view(['GET'])
@login_required
def file_single_jsondata(request, item_id=None):
    try:
        file = File.objects.get(id=item_id)
    except File.DoesNotExist:
        raise Http404()

    if not file.jsondata_meta:
        raise Http404()

    return Response(file.jsondata.as_json()['data'])


#@api_view(['GET'])
@login_required
def file_data(request, item_id=None):
    try:
        file = File.objects.get(id=item_id)
    except File.DoesNotExist:
        raise Http404()

    response = HttpResponse(file.data)
    response['Content-Type'] = "binary/octet-stream"
    response['Content-Disposition'] = "attachment; filename='{}'".format(
        # TODO: urlencode
        file.name
    )
#    response['X-Sendfile'] = file.data

#    if not file.:
#        raise Http404()
#    return HttpResponse()
    return response

#    return Response(file.jsondata.as_json()['data'])


@api_view(['GET'])
@login_required
def task_all(request):
    task_filter = request.GET.get('filter')

    if task_filter:
        task_ids = task_filter.split(",")
    else:
        task_ids = []

    ret = {}
    for task_id in task_ids:
        ret[task_id] = filehandler.get_task_state(task_id)

    return JsonResponse({
        "success": True,
        "status": ret,
#        "state": filehandler.get_task_state(task_id)
    })


@api_view(['GET'])
@login_required
def task_single(request, task_id=None):
    return JsonResponse({
        "id": task_id,
        "success": True,
        "state": filehandler.get_task_state(task_id)
    })


urlpatterns = [
    url(r'^{}files/$'.format(BASE_URL), file_all),
    url(r'^{}files/(?P<item_id>[0-9]+)$'.format(BASE_URL), file_single),
    url(r'^{}files/(?P<item_id>[0-9]+)/data$'.format(BASE_URL), file_data),
    url(r'^{}files/(?P<item_id>[0-9]+)/jsondata$'.format(BASE_URL),
        file_single_jsondata),
    url(r'^{}tasks/$'.format(BASE_URL), task_all),
    url(r'^{}tasks/(?P<task_id>[a-z0-9\-]+)$'.format(BASE_URL), task_single),
]