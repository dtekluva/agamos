import secrets

from django.db import migrations, models

import registries.models


def unique_tokens_for_existing(apps, schema_editor):
    # AddField bakes a single default value into all existing rows; give each its own.
    Registry = apps.get_model("registries", "Registry")
    for r in Registry.objects.all():
        r.checkin_token = secrets.token_urlsafe(18)
        r.save(update_fields=["checkin_token"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("registries", "0008_eventguest_contributed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="registry",
            name="checkin_token",
            field=models.CharField(blank=True, default=registries.models.gen_checkin_token, max_length=64),
        ),
        migrations.RunPython(unique_tokens_for_existing, noop),
    ]
