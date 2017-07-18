"""
$Id: apiurls.py 78844 2016-12-20 10:41:49Z$
"""
from __future__ import unicode_literals
from django.conf.urls import url
import acs.api

urlpatterns = [
    url(r'^acs/?$', acs.api.acs_settings_api,
        name = 'acs_settings_api'),
]

acs_models = [ ( "acsconfig", acs.api.acsconfig_api),
           ]

for prefix, handler in acs_models:
    urlpatterns.append(url(r'^%s/?$' % prefix, handler, name = prefix + '_api'))
    urlpatterns.append(url(r'^%s/(?P<id>\d+)/?$' % prefix, handler, name=prefix + '_api'))
