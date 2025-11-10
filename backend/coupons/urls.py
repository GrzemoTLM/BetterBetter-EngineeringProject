from django.urls import path, include
from rest_framework import routers
from .views.bet_type_dict_view import BetTypeDictViewSet
from .views.discipline_view import DisciplineViewSet
from .views.coupon_view import CouponListCreateView, CouponDetailsView, CouponRecalcView, CouponSettleView, CouponForceWinView, CouponCopyView
from .views.bet_view import BetListCreateView, BetDetailsView
from .views.event_view import EventViewSet

router = routers.DefaultRouter()
router.register(r'bet-types', BetTypeDictViewSet, basename='bet-type')
router.register(r'disciplines', DisciplineViewSet, basename='discipline')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('coupons/', CouponListCreateView.as_view(), name='coupon-list-create'),
    path('coupons/<int:pk>/', CouponDetailsView.as_view(), name='coupon-detail'),
    path('coupons/<int:pk>/recalc/', CouponRecalcView.as_view(), name='coupon-recalc'),
    path('coupons/<int:pk>/settle/', CouponSettleView.as_view(), name='coupon-settle'),
    path('coupons/<int:pk>/force-win/', CouponForceWinView.as_view(), name='coupon-force-win'),
    path('coupons/<int:pk>/copy/', CouponCopyView.as_view(), name='coupon-copy'),
    path('coupons/<int:coupon_id>/bets/', BetListCreateView.as_view(), name='bet-list-create'),
    path('coupons/<int:coupon_id>/bets/<int:pk>/', BetDetailsView.as_view(), name='bet-detail'),
    path('<int:pk>/', CouponDetailsView.as_view(), name='coupon-detail-short'),
    path('<int:pk>/recalc/', CouponRecalcView.as_view(), name='coupon-recalc-short'),
    path('<int:pk>/settle/', CouponSettleView.as_view(), name='coupon-settle-short'),
    path('<int:pk>/force-win/', CouponForceWinView.as_view(), name='coupon-force-win-short'),
    path('<int:pk>/copy/', CouponCopyView.as_view(), name='coupon-copy-short'),
]
