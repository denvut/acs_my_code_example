# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import lib.models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='LogEntry',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('source', models.CharField(max_length=45)),
                ('hardware_id', models.CharField(max_length=64)),
                ('system_type', models.CharField(max_length=64)),
                ('message', lib.models.TruncatingCharField(max_length=1024)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ('-timestamp',),
                'db_table': 'acs_logs',
            },
        ),
        migrations.CreateModel(
            name='SystemConfig',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('last_modified', models.DateTimeField(auto_now_add=True)),
                ('serial', models.BigIntegerField(default=0)),
                ('hardware_id', models.CharField(unique=True, max_length=64)),
                ('name', models.CharField(max_length=256, blank=True)),
                ('location', models.CharField(max_length=256, blank=True)),
                ('ip4_addr', models.GenericIPAddressField(unique=True, null=True, protocol=b'ipv4')),
                ('ip4_prefix', models.IntegerField(null=True)),
                ('ip4_gateway', models.GenericIPAddressField(null=True, protocol=b'ipv4')),
                ('ip4_nameserver', models.GenericIPAddressField(null=True, protocol=b'ipv4')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='SystemSettings',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('value', models.CharField(max_length=2048)),
                ('name', models.CharField(unique=True, max_length=1024)),
            ],
            options={
                'db_table': 'acs_systemsettings',
            },
        ),
    ]
