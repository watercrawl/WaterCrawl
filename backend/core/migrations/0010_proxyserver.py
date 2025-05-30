# Generated by Django 5.1.8 on 2025-05-13 19:56

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_searchrequest'),
        ('user', '0012_teaminvitation_invitation_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProxyServer',
            fields=[
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255, verbose_name='name')),
                ('slug', models.SlugField(max_length=255, verbose_name='key')),
                ('is_default', models.BooleanField(default=False, verbose_name='is default')),
                ('proxy_type', models.CharField(choices=[('http', 'HTTP'), ('socks4', 'SOCKS4'), ('socks5', 'SOCKS5')], default='http', max_length=255, verbose_name='proxy type')),
                ('host', models.CharField(max_length=255, verbose_name='host')),
                ('port', models.PositiveIntegerField(default=0, verbose_name='port')),
                ('username', models.CharField(blank=True, max_length=255, null=True, verbose_name='username')),
                ('password', models.CharField(blank=True, max_length=255, null=True, verbose_name='password')),
                ('team', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='proxy_servers', to='user.team', verbose_name='team')),
            ],
            options={
                'verbose_name': 'Proxy Server',
                'verbose_name_plural': 'Proxy Servers',
                'unique_together': {('team', 'slug')},
            },
        ),
    ]
