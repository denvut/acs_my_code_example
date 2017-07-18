"""
$Id: urls.py 78844 2016-12-20 10:41:49Z$
"""
from __future__ import unicode_literals
from acs import views
from django.conf.urls import include, url


urlpatterns = [
    url(r'^config/?$', views.index, kwargs={"view_mode": "acsadmin"}, name='acsadmin'),
    url(r'^logs/?$', views.logs, name='acslogs'),
    url(r'^logs_data/?$', views.logs_data, name='acslogs_data'),
    url(r'^settings/?$', views.global_settings, name='acs_settings'),
    url(r'^api/', include('acs.apiurls')),
    url(r'^maps/?$', views.index, kwargs={"view_mode": "maps"}, name='maps'),
]

