from django.shortcuts import render
from django.template import Context
#from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    JsonResponse,
)
from django.conf import settings
import logging
import collector.filehandler as filehandler


# Create your views here.


@login_required
def mapview(request):

    return HttpResponse(render(
        request,
        'mapview.html',
        dict(GOOGLEMAPS_APIKEY=settings.GOOGLEMAPS_APIKEY))
    )

views = [mapview]
