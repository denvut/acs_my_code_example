"""
$Id: serverurls.py 78844 2016-12-20 10:41:49Z$
"""
from __future__ import unicode_literals
from django.conf.urls import url
import acs.server

urlpatterns = [url(r'^$', acs.server.acs, name='acs')]
