from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0003_alter_withdrawal_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="contribution",
            name="host_notified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="withdrawal",
            name="notified_status",
            field=models.CharField(blank=True, max_length=12),
        ),
    ]
