from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketCategoryViewSet, TicketCommentViewSet

router = DefaultRouter()
router.register(r'categories', TicketCategoryViewSet, basename='category')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'comments', TicketCommentViewSet, basename='comment')

app_name = 'tickets'

urlpatterns = [
    path('', include(router.urls)),
]

