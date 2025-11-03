from django.urls import path, include
from rest_framework import routers

from .views import (
    UserView,
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    GoogleAuthView,
    google_login_succes,
    TwoFactorStartView,
    TwoFactorVerifyView,
    TwoFactorLoginView,
    UserSettingsView,
    RequestPasswordResetView,
    ConfirmPasswordResetView,
    ResendPasswordResetView,
)

router = routers.DefaultRouter()
router.register(r'users', UserView, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('auth/login/verify-2fa/', TwoFactorLoginView.as_view(), name='login_verify_2fa'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('me/', MeView.as_view(), name='user-me'),
    path('settings/', UserSettingsView.as_view(), name='user-settings'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/google/success/', google_login_succes, name='google-login-success'),
    path('two-factor/start/', TwoFactorStartView.as_view(), name='two_factor_start'),
    path('two-factor/verify/', TwoFactorVerifyView.as_view(), name='two_factor_verify'),
    path('password/reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),
    path('password/reset/resend/', ResendPasswordResetView.as_view(), name='password_reset_resend'),
]