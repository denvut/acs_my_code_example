# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acs', '0003_4_0'),
    ]

    operations = [
        migrations.AlterField(
            model_name='systemconfig',
            name='geolocation',
            field=models.CharField(max_length=256, null=True),
        ),
        migrations.AlterField(
            model_name='systemconfig',
            name='vlandata',
            field=models.CharField(max_length=4, null=True),
        ),
        migrations.AlterField(
            model_name='systemconfig',
            name='vlanmanagement',
            field=models.CharField(max_length=4, null=True),
        ),
    ]
