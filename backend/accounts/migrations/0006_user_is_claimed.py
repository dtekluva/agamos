from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_user_appreciation_sent"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_claimed",
            field=models.BooleanField(default=True),
        ),
    ]
