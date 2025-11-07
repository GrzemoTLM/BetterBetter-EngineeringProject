from django.urls import path
from .views import CouponAnalyticsSummaryView

urlpatterns = [
    path('coupons/summary/', CouponAnalyticsSummaryView.as_view(), name='coupon-analytics-summary'),
]

