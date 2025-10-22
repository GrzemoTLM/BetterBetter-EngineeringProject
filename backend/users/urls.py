from django.urls import path, include
from rest_framework import routers
from .views import UserView, RegisterView, LoginView, LogoutView, MeView, GoogleAuthView

router = routers.DefaultRouter()
router.register(r'users', UserView, basename='user')
urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('me/', MeView.as_view(), name='user-me'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth')
]