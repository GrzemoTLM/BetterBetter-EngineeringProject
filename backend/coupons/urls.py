from django.urls import path, include
from rest_framework import routers
from .views.bet_type_dict_view import BetTypeDictViewSet
from .views.discipline_view import DisciplineViewSet

router = routers.DefaultRouter()
router.register(r'bet-types', BetTypeDictViewSet, basename='bet-type')
router.register(r'disciplines', DisciplineViewSet, basename='discipline')

urlpatterns = [
    path('', include(router.urls)),
]
