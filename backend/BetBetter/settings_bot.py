from .settings import *

# Minimal apps needed for bot logic (models, auth). Avoid heavy/optional deps.
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'common',
    'users',
    'coupons',
    'finances',
    'coupon_analytics.apps.CouponAnalyticsConfig',
    'django_otp',
    'django_otp.plugins.otp_totp',
]

MIDDLEWARE = []

try:
    DRF_YASG_AVAILABLE = False
except Exception:
    pass
