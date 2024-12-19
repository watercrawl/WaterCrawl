# Generated by Django 5.1.4 on 2024-12-19 08:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0003_remove_teaminvitation_active_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_verification_token',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='email verification token'),
        ),
        migrations.AddField(
            model_name='user',
            name='email_verified',
            field=models.BooleanField(default=True, verbose_name='email verified'),
        ),
    ]