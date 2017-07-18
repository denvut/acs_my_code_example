# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acs', '0002_4_0'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemconfig',
            name='geolocation',
            field=models.CharField(max_length=256, blank=True),
        ),
    ]
