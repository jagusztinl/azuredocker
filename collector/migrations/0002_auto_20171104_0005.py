# -*- coding: utf-8 -*-
# Generated by Django 1.11.7 on 2017-11-04 00:05
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('collector', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='jsondata',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, to='collector.JsonData'),
        ),
    ]
