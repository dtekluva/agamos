from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_user_is_claimed"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="kyc_status",
            field=models.CharField(
                choices=[("none", "None"), ("pending", "Pending"), ("verified", "Verified"), ("rejected", "Rejected")],
                default="none", max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="kyc_submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="kyc_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
