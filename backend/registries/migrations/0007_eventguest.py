import django.db.models.deletion
from django.db import migrations, models

import registries.models


class Migration(migrations.Migration):

    dependencies = [
        ("registries", "0006_auto_20260621_2032"),
    ]

    operations = [
        migrations.CreateModel(
            name="EventGuest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("token", models.CharField(default=registries.models.gen_guest_token, editable=False, max_length=64, unique=True)),
                ("code", models.CharField(editable=False, max_length=12, unique=True)),
                ("rsvp_status", models.CharField(choices=[("pending", "Pending"), ("yes", "Attending"), ("no", "Declined")], default="pending", max_length=10)),
                ("party_size", models.PositiveSmallIntegerField(default=1)),
                ("invited_at", models.DateTimeField(blank=True, null=True)),
                ("viewed_at", models.DateTimeField(blank=True, null=True)),
                ("rsvp_at", models.DateTimeField(blank=True, null=True)),
                ("checked_in_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("registry", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="guests", to="registries.registry")),
            ],
            options={
                "ordering": ["name"],
            },
        ),
    ]
