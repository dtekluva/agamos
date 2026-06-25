from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("registries", "0007_eventguest"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventguest",
            name="contributed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
