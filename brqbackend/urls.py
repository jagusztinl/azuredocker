"""brqbackend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from django.contrib.auth import views as auth_views

from collector.views import views as collector_views
from collector import api

from brqbackend import settings

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^login/$', auth_views.login, {'template_name': 'login.html'}, name='login'),
    url(r'^logout/$', auth_views.logout, name='logout'),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]

if settings.USE_DOCS:
    urlpatterns.insert(
        0, url(r'^admin/doc/', include('django.contrib.admindocs.urls')))


def build_urls(handlers, prefix=None):
    ret = []
    for handler in handlers:
        if not callable(handler):
            continue

        name = handler.__name__
        if name == 'index':
            if prefix:
                m = '^' + prefix + '$'
            else:
                m = '^$'
        else:
            if prefix:
                m = '^' + prefix + '/' + name
            else:
                m = '^' + name

        ret.append(url(m, handler, name=name))
    return ret

urlpatterns += build_urls(collector_views)
urlpatterns += api.urlpatterns
