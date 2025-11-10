# Generated manually for AlertEvent model
from django.db import migrations, models
from django.conf import settings
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('coupon_analytics', '0004_yieldalert_sent_at'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AlertEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('metric', models.CharField(max_length=50)),
                ('comparator', models.CharField(max_length=10)),
                ('threshold_value', models.DecimalField(decimal_places=6, max_digits=18)),
                ('metric_value', models.DecimalField(blank=True, decimal_places=6, max_digits=18, null=True)),
                ('window_start', models.DateTimeField()),
                ('window_end', models.DateTimeField()),
                ('triggered_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('message_rendered', models.TextField(blank=True, null=True)),
                ('rule', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='alert_events', to='coupon_analytics.alertrule')),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='alert_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'coupon_alert_event',
                'ordering': ['-triggered_at'],
                'unique_together': {('rule', 'window_start', 'window_end')},
            },
        ),
    ]
