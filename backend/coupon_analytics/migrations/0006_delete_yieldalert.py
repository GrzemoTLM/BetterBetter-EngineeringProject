from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('coupon_analytics', '0005_alert_event'),
    ]

    operations = [
        migrations.DeleteModel(
            name='YieldAlert',
        ),
    ]

