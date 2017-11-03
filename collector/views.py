from django.shortcuts import render
from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.http import (
    HttpResponse,
    HttpResponseRedirect
)
import datetime
from .filehandler import handle_file
from .models import File

# Create your views here.

def time(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)

def index(request):
    template = get_template('collector.html')
    num_files = File.objects.count()
    files = File.objects.all()


    return HttpResponse(template.render(dict(
        num_files=num_files,
        files=files,
    )))

@csrf_exempt
def upload(request):
    ret = []
    if request.method == 'POST':
        for key in request.FILES.keys():
            for file in request.FILES.getlist(key):
                ret.append(handle_file(file))

#        return HttpResponseRedirect('..')
        return HttpResponse('files: {}'.format(ret))
    else:
        return HttpResponseRedirect('..')

views = [index, time, upload]
