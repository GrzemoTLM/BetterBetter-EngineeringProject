from django.urls import path, include
from rest_framework import routers
from .views import UserView

router = routers.DefaultRouter()
router.register(r'users', UserView, basename='user')
urlpatterns = [
   path('', include(router.urls)),
]