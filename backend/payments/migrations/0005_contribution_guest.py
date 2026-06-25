import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0004_notification_flags"),
        ("registries", "0008_eventguest_contributed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="contribution",
            name="guest",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="contributions", to="registries.eventguest",
            ),
        ),
    ]
