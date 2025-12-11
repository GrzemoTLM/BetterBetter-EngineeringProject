from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_remove_two_factor_email_fields'),
    ]

    operations = [
        migrations.DeleteModel(
            name='EmailDevice',
        ) if False else migrations.RunSQL(
            "DROP TABLE IF EXISTS otp_email_emaildevice CASCADE;",
            "SELECT 1;",
        ),
        migrations.RunSQL(
            "DROP TABLE IF EXISTS otp_email_sidechanneldevice CASCADE;",
            "SELECT 1;",
        ),
    ]

