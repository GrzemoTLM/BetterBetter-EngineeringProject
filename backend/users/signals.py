from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserSettings
from coupons.models import Currency

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        default_currency = Currency.objects.filter(code='PLN').first()

        UserSettings.objects.create(
            user=instance,
            preferred_currency=default_currency,
            locale='pl-PL',
            date_format='DD-MM-YYYY',
            monthly_budget_limit=50.00,
            notification_gate='none',
            two_factor_enabled=False
        )
