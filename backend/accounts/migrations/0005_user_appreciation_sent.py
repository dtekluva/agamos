from django.db import migrations, models


def mark_existing_sent(apps, schema_editor):
    # The current users already received the appreciation campaign today, so mark
    # them sent — the cron should only email future signups.
    User = apps.get_model("accounts", "User")
    User.objects.update(appreciation_sent=True)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_user_email_verified"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="appreciation_sent",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_existing_sent, noop),
    ]
