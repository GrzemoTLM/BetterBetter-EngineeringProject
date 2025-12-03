from django.urls import path, include, re_path
from django.conf import settings
from rest_framework import permissions

try:
    if getattr(settings, 'DRF_YASG_AVAILABLE', False):
        from drf_yasg.views import get_schema_view
        from drf_yasg import openapi
        schema_view = get_schema_view(
            openapi.Info(
                title="BetBetter API",
                default_version='v1',
                description="Dokumentacja REST API aplikacji BetBetter",
            ),
            public=True,
            permission_classes=(permissions.AllowAny,),
        )
    else:
        schema_view = None
except Exception:
    schema_view = None

from users.views import google_login_succes
from monitoring.views import SystemMetricsView, LoggedInUsersView

urlpatterns = [
    path('views/users/', include('users.urls')),
    path('views/coupons/', include('coupons.urls')),
    path('views/finances/', include('finances.urls')),
    path('views/analytics/', include('coupon_analytics.urls')),
    path('views/tickets/', include('tickets.urls')),
    path('auth/', include('social_django.urls', namespace='social')),
    path('views/auth/google/success/', google_login_succes, name='google-success'),
    path("views/monitoring/system-metrics/", SystemMetricsView.as_view(), name="system-metrics"),
    path("views/monitoring/logged-in-users/", LoggedInUsersView.as_view(), name="logged-in-users"),
]

if schema_view is not None:
    urlpatterns += [
        re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
        re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]
