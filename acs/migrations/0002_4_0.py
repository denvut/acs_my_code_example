# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acs', '0001_4_0'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemconfig',
            name='vlandata',
            field=models.CharField(max_length=4, blank=True),
        ),
        migrations.AddField(
            model_name='systemconfig',
            name='vlanmanagement',
            field=models.CharField(max_length=4, blank=True),
        ),
    ]
