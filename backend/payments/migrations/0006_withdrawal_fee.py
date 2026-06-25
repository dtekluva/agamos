from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0005_contribution_guest"),
    ]

    operations = [
        migrations.AddField(
            model_name="withdrawal",
            name="fee",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
