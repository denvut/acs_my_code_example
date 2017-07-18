"""
$Id: server.py 78844 2016-12-20 10:41:49Z$
"""
from __future__ import unicode_literals
from django.core.urlresolvers import reverse
from piston.handler import BaseHandler
from django.db import transaction
from acs.models import SystemConfig, SystemSettings, LogEntry
from inventory.models import Node
from cli.keygen import getRSAKeys
from config.models import Settings
from security.models import User, UserSettings
from settings import ACS_ADMIN_USERNAME, URI_PREFIX


def get_api_url(system_type):
    return {
        'ub-ran': (reverse('acs_ubran'), Node.TYPE_RAN)
    }[system_type.lower()]

def acs_log(client_ip, hardware_id, system_type, message):
    with transaction.atomic():
        LogEntry.add(client_ip, hardware_id, system_type, message)

class ACSHandler(BaseHandler):

    def read(self, req):
        hardware_id = req.GET['hardware_id'].upper()
        system_type = req.GET['system_type']
        client_ip = req.META.get('HTTP_X_REAL_IP', None) or req.META['REMOTE_ADDR']

        try:
            api_url, node_type = get_api_url(system_type)
        except Exception:
            msg = "Unknown system type %s" % system_type
            acs_log(client_ip, hardware_id, "Unknown", msg)
            raise Exception(msg)

        type_str = Node.UB_SYSTEMS[node_type]

        user = User.objects.get(username = ACS_ADMIN_USERNAME)
        if not user.has_perm('acs_access'):
            msg = "User % does not have acs_access permissions" % ACS_ADMIN_USERNAME
            acs_log(client_ip, hardware_id, type_str, msg)
            raise Exception(msg)

        try:
            record = SystemConfig.objects.get(hardware_id = hardware_id).properties()
        except SystemConfig.DoesNotExist as e:
            acs_log(client_ip, hardware_id, type_str, "Can't find configuration for the given hardware ID")
            raise e

        setings = {}
        for x in SystemSettings.objects.all():
            setings[x.name] = x.value

        for name_set, value_set in record.iteritems():
            if name_set in setings.keys() and not value_set:
                record[name_set] = setings[name_set]

        other_set = dict([(k, v) for k, v in setings.iteritems() if k not in record])
        # backward compatibility
        other_set.update({'vlandata': record['vlandata'], 'vlanmanagement':record['vlanmanagement']})

        ret = {
            'apiurl'    : "https://%s%s%s" % (Settings.get('public_ip'), URI_PREFIX, api_url),
            'authinfo'  : {
                'type'      : 'basic',
                'realm'     : 'acs',
                'username'  : user.username,
                'password'  : UserSettings.get('plain_password', user=user),
            },
            'network'   : {
                'ipv4': {
                    'cidr_addr'  : record['ip4_cidr'],
                    'gw'         : record['ip4_gateway'],
                    'nameserver' : record['ip4_nameserver'],
                },
                'vlandata'       : record['vlandata'],
                'vlanmanagement' : record['vlanmanagement'],
            },
            'settings'       : other_set,
            'sshkey'         : getRSAKeys().public.toString('OPENSSH'),
            'name'           : record['name'],
            'location'       : record['location'],
        }
        acs_log(client_ip, hardware_id, type_str, "Returned configuration: %s" % record['ip4_cidr'])
        return ret

from piston.resource import Resource
acs = Resource(ACSHandler)
