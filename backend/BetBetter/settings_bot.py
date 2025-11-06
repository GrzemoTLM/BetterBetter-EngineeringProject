from .settings import *

# Minimal apps needed for bot logic (models, auth). Avoid heavy/optional deps.
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'common',
    'users',
    'coupons',
    'finances',
]

# Bot doesn't run Django views; keep middleware minimal.
MIDDLEWARE = []

# Disable drf_yasg auto-append if inherited
try:
    DRF_YASG_AVAILABLE = False
except Exception:
    pass

