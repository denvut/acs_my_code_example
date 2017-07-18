"""
$Id: models.py 78844 2016-12-20 10:41:49Z$
"""
from __future__ import unicode_literals
from django.db import models
from security.audit import log as audit_log
from lib import ValidationError, watch
from lib.models import ModTimeModel
from django.db import IntegrityError, transaction
from lib.models import SettingsBase, TruncatingCharField

class SystemConfig(ModTimeModel):

    hardware_id = models.CharField(max_length = 64, unique = True)
    name = models.CharField(max_length = 256, blank = True)
    location = models.CharField(max_length = 256, blank = True)
    ip4_addr = models.GenericIPAddressField(null=True, protocol="ipv4", unique = True)
    ip4_prefix = models.IntegerField(null=True)
    ip4_gateway = models.GenericIPAddressField(null=True, protocol="ipv4")
    ip4_nameserver = models.GenericIPAddressField(null=True, protocol="ipv4")
    vlandata = models.CharField(max_length=4, null=True)
    vlanmanagement = models.CharField(max_length=4, null=True)
    geolocation = models.CharField(max_length = 256, null=True)

    def properties(self):
        return { 'hardware_id'    : self.hardware_id,
                 'name'           : self.name,
                 'location'       : self.location,
                 'ip4_cidr'       : "%s/%s" % (self.ip4_addr, self.ip4_prefix),
                 'ip4_gateway'    : self.ip4_gateway,
                 'ip4_nameserver' : self.ip4_nameserver,
                 'vlandata'       : self.vlandata,
                 'vlanmanagement' : self.vlanmanagement,
                 'geolocation'    : self.geolocation
                 }

    def details(self):
         return "%s:%s/%s, gateway: %s, nameserver:%s%s%s, %s%s" % (self.hardware_id, self.ip4_addr, self.ip4_prefix,
            ", IPv4 Default Gateway: %s" % self.ip4_gateway if self.ip4_gateway else "",
            ", IPv4 Nameserver: %s" % self.ip4_nameserver if self.ip4_nameserver else "",
            ", name: %s" % self.name if self.name else "",
            ", location: %s" % self.location if self.location else "",
            ", VLAN ID for data interface: %s" % self.vlandata if self.vlandata else "",
            ", VLAN ID for management interface: %s" % self.vlanmanagement if self.vlanmanagement else "",
                                                                   )

    @classmethod
    def existing_field(cls, hardware_id, id = None):
        objs = cls.objects.filter(hardware_id = hardware_id)
        if id is not None:
            objs = objs.exclude(pk=id)
        return "Hardware ID" if objs.exists() else "IPv4 address"

    @staticmethod
    def parse_cidr(ip4_cidr):
        return ip4_cidr.split('/') if ip4_cidr is not None else (None, None)

    @classmethod
    def create(cls, properties, user):
        ip4_addr, ip4_prefix = cls.parse_cidr(properties.get('ip4_cidr'))
        config = cls(hardware_id = properties['hardware_id'].upper(),
            name = properties['name'], location = properties['location'],
            ip4_addr = ip4_addr, ip4_prefix = ip4_prefix,
            ip4_gateway = properties.get('ip4_gateway'),
            ip4_nameserver = properties.get('ip4_nameserver'),
            vlandata = properties.get('vlandata'),
            vlanmanagement = properties.get('vlanmanagement'),
            geolocation = properties.get('geolocation')
             )
        try:
            with transaction.atomic():
                config.save()
        except IntegrityError:
            raise ValidationError("%s is already used" % cls.existing_field(properties['hardware_id'].upper()))

        audit_log(user, None, "Create ACS config %s:%s/%s" % (config.hardware_id, config.ip4_addr, config.ip4_prefix), config.details())
        return config

    def save(self, *args, **kwargs):
        val = getattr(self, 'hardware_id', False)
        if val:
            upper_val = val.upper()
            setattr(self, 'hardware_id', upper_val)
        try:
            with transaction.atomic():
                super(SystemConfig, self).save(*args, **kwargs)
        except IntegrityError:
            raise ValidationError("%s is already used" % self.existing_field(self.hardware_id, self.pk))

class LogEntry(models.Model):

    class Meta(object):
        db_table = 'acs_logs'
        ordering = ( '-timestamp', )

    OBJTYPE = "ACS_LOG"

    source = models.CharField(max_length = 45, null = False)
    hardware_id = models.CharField(max_length = 64, null = False)
    system_type = models.CharField(max_length = 64, null = False)
    message = TruncatingCharField(max_length = 1024, null = False, blank = False)
    timestamp = models.DateTimeField(null = False, auto_now_add = True)

    def props(self):
        return { 'source'         : self.source,
                 'hardware_id'    : self.hardware_id,
                 'system_type'    : self.hardware_id,
                 'message'        : self.message }

    @classmethod
    def add(klass, source, hardware_id, system_type, message):
        hardware_id = hardware_id if hardware_id is not None else "Unknown"
        source = source if source is not None else "Unknown"
        entry = klass.objects.create(source = source, hardware_id = hardware_id, system_type = system_type, message = message)
        watch.event(entry, { 'acs_events': [ entry.props() ] })

class SystemSettings(SettingsBase):
    class Meta(object):
        db_table = 'acs_systemsettings'

    SETTINGS = {
        "vlandata"   : ("VLAN ID for data interface", "", ""),
        "vlanmanagement"   : ("VLAN ID for management interface", "", ""),
        "ip4_gateway"   : ("IPv4 Default Gateway", "", ""),
        "ip4_nameserver"   : ("IPv4 Nameserver", "", ""),

    }
    VLANPARAM=('vlandata','vlanmanagement')
    IPADDR=('ip4_gateway','ip4_nameserver')

    name = models.CharField(max_length=1024, null=False, unique=True)


    def __unicode__(self):
        return '%s : %s' % (self.name, self.value)

