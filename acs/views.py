"""
$Id: views.py 78844 2016-12-20 10:41:49Z$
"""
from __future__ import unicode_literals
from django.shortcuts import render
from django.http import HttpResponse
from security.decorators import permission_required
from models import SystemConfig, LogEntry, SystemSettings
from lib import watch
from lib.djangoweb import TableRenderer, timeFilter
from lib.templatetags.misc import fmt_date
from lib.views import settings_view
from collections import namedtuple
from django.conf import settings

@permission_required("acs_admin")
def index(request, view_mode):
    system_configs = SystemConfig.objects.all()
    system_params = SystemSettings.objects.all()
    system_settings = SystemSettings.SETTINGS
    Element = namedtuple('Element', ['val','fullname'])
    elements = {}
    for data in system_params:
        for name, value in system_settings.iteritems():
            if data.name in name:
                elements[data.name] = Element(data.value, value[0])

    sysval = {'system_configs': system_configs, 'system_params': elements}

    sycon = {
        "type": "FeatureCollection",
        "features": [ {
            "type": "Feature",
                "properties": {
                    "loc" : r.geolocation,
                    "name" : r.name,
                    "id" : r.id,
                    "hardware_id" : r.hardware_id,
                    "location" : r.location,
                    "ip4_addr" : r.ip4_addr,
                    "ip4_prefix" : r.ip4_prefix,
                    "ip4_gateway" : r.ip4_gateway,
                    "ip4_nameserver" : r.ip4_nameserver,
                    "vlandata" : r.vlandata,
                    "vlanmanagement" : r.vlanmanagement, },
                "geometry": {
                    "type": "Point",
                    "coordinates": r.geolocation.split(','), }
    } for r in system_configs if r.geolocation]}
    request.page_data["geoDialog"] = sycon
    request.page_data["map_center"] = settings.MAP_CENTER_VIEW

    if view_mode == 'acsadmin':
        template = 'acs/index.html'
        if settings.MAP_SOURCE_OFL != '':
            request.page_data["map_source"] = settings.MAP_SOURCE_OFL
        else:
            request.page_data["map_source"] = settings.MAP_SOURCE_ONL
    else:
        template = 'acs/maps.html'
        if settings.MAP_SOURCE_ONL != '':
            request.page_data["map_source"] = settings.MAP_SOURCE_ONL
        else:
            request.page_data["map_source"] = settings.MAP_SOURCE_OFL

    return render(request, template, sysval)


@permission_required("acs_admin")
def logs(request):
    request.page_data["acs_watch_uri"] = watch.watchTypeURI(LogEntry)
    return render(request, 'acs/logs.html', {})

@permission_required("acs_admin")
def logs_data(req):
    row_desc = (TableRenderer.getTableColumnDescriptor("Time", column = "timestamp", renderer = fmt_date, filter = timeFilter("timestamp")),
                TableRenderer.getTableColumnDescriptor("Hardware ID"),
                TableRenderer.getTableColumnDescriptor("System Type"),
                TableRenderer.getTableColumnDescriptor("Source"),
                TableRenderer.getTableColumnDescriptor("Message"))
    table_renderer = TableRenderer(row_desc, req.GET)
    query_set = LogEntry.objects.all()
    return HttpResponse(table_renderer.render(query_set), content_type="application/json")

global_settings = permission_required("acs_admin")(settings_view(SystemSettings, lambda req: SystemSettings.objects.all(), 'acs_settings_api', 'acs/settings.html'))
