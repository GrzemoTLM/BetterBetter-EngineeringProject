from django.urls import path, include
from rest_framework import routers
from .views.bet_type_dict_view import BetTypeDictViewSet
from .views.discipline_view import DisciplineViewSet
from .views.coupon_view import CouponListCreateView, CouponDetailsView, CouponRecalcView, CouponSettleView, CouponForceWinView, CouponCopyView, CouponSummaryView
from .views.coupon_filter_view import CouponFilterByTeamView, CouponFilterByQueryBuilderView, CouponFilterUniversalView
from .views.bet_view import BetListCreateView, BetDetailsView
from .views.event_view import EventViewSet
from .views.ocr_view import OCRTestView, OCRParseView

router = routers.DefaultRouter()
router.register(r'bet-types', BetTypeDictViewSet, basename='bet-type')
router.register(r'disciplines', DisciplineViewSet, basename='discipline')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('ocr/', OCRTestView.as_view(), name='ocr-test'),
    path('ocr/extract/', OCRTestView.as_view(), name='ocr-extract'),
    path('ocr/parse/', OCRParseView.as_view(), name='ocr-parse'),
    path('coupons/ocr/', OCRTestView.as_view(), name='ocr-test-legacy'),
    path('coupons/ocr/extract/', OCRTestView.as_view(), name='ocr-extract-legacy'),
    path('coupons/ocr/parse/', OCRParseView.as_view(), name='ocr-parse-legacy'),
    path('', include(router.urls)),
    path('coupons/', CouponListCreateView.as_view(), name='coupon-list-create'),
    path('coupons/<int:pk>/', CouponDetailsView.as_view(), name='coupon-detail'),
    path('coupons/<int:pk>/recalc/', CouponRecalcView.as_view(), name='coupon-recalc'),
    path('coupons/<int:pk>/settle/', CouponSettleView.as_view(), name='coupon-settle'),
    path('coupons/<int:pk>/force-win/', CouponForceWinView.as_view(), name='coupon-force-win'),
    path('coupons/<int:pk>/copy/', CouponCopyView.as_view(), name='coupon-copy'),
    path('summary/', CouponSummaryView.as_view(), name='coupon-summary'),
    path('coupons/summary/', CouponSummaryView.as_view(), name='coupon-summary-legacy'),
    path('coupons/<int:coupon_id>/bets/', BetListCreateView.as_view(), name='bet-list-create'),
    path('coupons/<int:coupon_id>/bets/<int:pk>/', BetDetailsView.as_view(), name='bet-detail'),
    path('filter/team/', CouponFilterByTeamView.as_view(), name='coupon-filter-team'),
    path('filter/query-builder/', CouponFilterByQueryBuilderView.as_view(), name='coupon-filter-query-builder'),
    path('filter/universal/', CouponFilterUniversalView.as_view(), name='coupon-filter-universal'),
    path('<int:pk>/', CouponDetailsView.as_view(), name='coupon-detail-short'),
    path('<int:pk>/settle/', CouponSettleView.as_view(), name='coupon-settle-short'),
    path('<int:pk>/force-win/', CouponForceWinView.as_view(), name='coupon-force-win-short'),
    path('<int:pk>/copy/', CouponCopyView.as_view(), name='coupon-copy-short'),
]
