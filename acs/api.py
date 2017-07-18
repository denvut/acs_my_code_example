"""
$Id: api.py 78844 2016-12-20 10:41:49Z$
"""

from __future__ import unicode_literals
from django.contrib import messages
from lib.api import ConcurrentAwareHandler, SettingsHandlerBase
from lib.generic import updateObjProperties
from security.audit import log as audit_log
from piston.handler import BaseHandler
from piston.utils import rc
from acs.models import SystemConfig, SystemSettings
from lib import ValidationError

@ConcurrentAwareHandler
class SystemConfigHandler(BaseHandler):
    add_perm = 'acs_admin'
    edit_perm = 'acs_admin'
    delete_perm = 'acs_admin'

    def read(self, req, id=None):
        if id is None:
            return (obj.properties() for obj in SystemConfig.objects.all())
        else:
            return SystemConfig.objects.get(pk=id).properties()

    def create(self, req):
        data = req.data
        system = SystemConfig.create(data, req.user)
        messages.info(req, "Configuration for system %s created" % system.hardware_id)
        return system.properties()

    def delete(self, req, id=None):
        ids = [id] if id else req.GET.getlist("object_ids")

        post = SystemConfig.objects.filter(pk__in=ids)
        count = post.count()
        if count:
            for obj in post:
                audit_log(req.user, None, "Delete ACS config %s:%s/%s" % (obj.hardware_id, obj.ip4_addr, obj.ip4_prefix))
            post.delete()

        return rc.DELETED

    def update(self, req, id):
        obj = SystemConfig.objects.get(pk=id)
        ip4_addr, ip4_prefix = SystemConfig.parse_cidr(req.data.get('ip4_cidr'))
        old_ip = obj.ip4_addr
        old_prefix = obj.ip4_prefix
        old_hwid = obj.hardware_id
        if not updateObjProperties(obj, ['hardware_id', 'name', 'location', 'geolocation', 'ip4_addr', 'ip4_prefix',
            'ip4_gateway', 'ip4_nameserver','vlandata','vlanmanagement'], dict(req.data, **{'ip4_addr': ip4_addr, 'ip4_prefix': ip4_prefix})):
            return

        serial=req.data["_serial"]
        obj.save(serial=serial)

        audit_log(req.user, None, "Update ACS config %s:%s/%s -> %s:%s/%s" % (old_hwid, old_ip, old_prefix, obj.hardware_id, obj.ip4_addr, obj.ip4_prefix), obj.details())

        messages.info(req, "Configuration for system %s%s has been changed" % (obj.hardware_id, " (%s)" % obj.name if obj.name else ""))
        return obj.properties()

class SystemSettingsHandler(SettingsHandlerBase):
    allowed_methods = ("GET", "PUT")
    edit_perm = 'acs_admin'
    read_perm = 'acs_admin'

    @staticmethod
    def validate(name, val, klass):
        if name in klass.VLANPARAM:
            err_msg = "Value should be a number in range [1, 4095]"
            if val == '':
                return val
            elif not val.isdigit():
                raise ValidationError(err_msg)
            elif 1 <= int(val) <= 4095:
                return int(val)
            else:
                raise ValidationError(err_msg)

        elif hasattr(klass, 'IPADDR') and name in klass.IPADDR:
            if not val.strip():
                return None
            err_msg = "Value should be a valid IP address"
            import socket
            try:
                socket.inet_pton(socket.AF_INET, val)
                return val
            except socket.error:
                try:
                    socket.inet_pton(socket.AF_INET6, val)
                except socket.error:
                    raise ValidationError(err_msg)

    def update(self, req):
        for name, value in req.data.iteritems():
            if name.startswith("_"):
                continue
            value = self.validate(name, str(value.encode("utf-8")), SystemSettings)

            if value:
                s, created = SystemSettings.objects.get_or_create(name=name,
                    defaults={"value": value})
                if not created:
                    s.value = value
                    s.save()
            else:
                SystemSettings.objects.filter(name=name).update(value='')
        return rc.ALL_OK

from lib.api import Resource
acsconfig_api = Resource(SystemConfigHandler)
acs_settings_api = Resource(SystemSettingsHandler)
