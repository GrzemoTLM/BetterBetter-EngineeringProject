
from django.urls import path, include, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

from users.views import google_login_succes

schema_view = get_schema_view(
    openapi.Info(
        title="BetBetter API",
        default_version='v1',
        description="Dokumentacja REST API aplikacji BetBetter",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/users/', include('users.urls')),
    path('api/coupons/', include('coupons.urls')),
    path('api/finances/', include('finances.urls')),
    path('auth/', include('social_django.urls', namespace='social')),
    path('api/auth/google/success/', google_login_succes, name='google-success'),
]
