# -*- coding: utf-8 -*-
# Generated by Django 1.11.7 on 2017-11-11 11:05
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collector', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='error',
            field=models.CharField(default='', help_text='Last error message', max_length=255),
        ),
    ]
