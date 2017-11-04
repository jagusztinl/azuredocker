from django.shortcuts import render
from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count
from django.http import (
    HttpResponse,
    HttpResponseRedirect
)
import datetime
import re
from .filehandler import save_request_file, delete_file
from .models import File

# Create your views here.

def time(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)

def index(request):
    num_files = File.objects.count()
    # TODO: Count() can probably be replaced with something quicker
    files = File.objects.annotate(processed=Count('jsondata')).order_by('id')
    return HttpResponse(render(
        request,
        'collector.html', dict(
        num_files=num_files,
        files=files,
    )))

@csrf_exempt
def upload(request):
    ret = []
    if request.method == 'POST':
        for key in request.FILES.keys():
            for file in request.FILES.getlist(key):
                ret.append(save_request_file(file))

        return HttpResponseRedirect('..')
#        return HttpResponse('files: {}'.format(ret))
    else:
        return HttpResponseRedirect('..')

def delete_files(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    ret = []
    for key, value in request.POST.items():
        if re.match('[0-9]+$', key):
            success = delete_file(int(key))
            ret.append(dict(id=key, success=success))

#    return HttpResponse('deleted: {}'.format(ret))
    return HttpResponseRedirect('..')




views = [index, time, upload, delete_files]
