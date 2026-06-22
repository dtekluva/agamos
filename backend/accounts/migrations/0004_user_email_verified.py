from django.db import migrations, models


def verify_existing(apps, schema_editor):
    # Existing accounts predate verification — treat them as verified so the
    # soft gate (withdrawals require a verified email) doesn't lock them out.
    User = apps.get_model("accounts", "User")
    User.objects.update(email_verified=True)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_user_phone"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(verify_existing, noop),
    ]
