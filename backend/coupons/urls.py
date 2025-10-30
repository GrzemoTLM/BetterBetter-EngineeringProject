from django.urls import path, include
from rest_framework import routers
from .views.bet_type_dict_view import BetTypeDictViewSet
from .views.discipline_view import DisciplineViewSet
from .views.coupon_view import CouponListCreateView, CouponDetailsView
from .views.bet_view import BetListCreateView, BetDetailsView

router = routers.DefaultRouter()
router.register(r'bet-types', BetTypeDictViewSet, basename='bet-type')
router.register(r'disciplines', DisciplineViewSet, basename='discipline')

urlpatterns = [
    path('', include(router.urls)),
    path('coupons/', CouponListCreateView.as_view(), name='coupon-list-create'),
    path('coupons/<int:pk>/', CouponDetailsView.as_view(), name='coupon-detail'),
    path('coupons/<int:coupon_id>/bets/', BetListCreateView.as_view(), name='bet-list-create'),
    path('coupons/<int:coupon_id>/bets/<int:pk>/', BetDetailsView.as_view(), name='bet-detail'),
]
