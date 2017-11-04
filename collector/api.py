from django.shortcuts import render
#from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count
from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    JsonResponse,
)
import datetime
import re
import collector.filehandler as filehandler
from .models import File

# Create your views here.

@csrf_exempt
def files(request):
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


views = [files]
