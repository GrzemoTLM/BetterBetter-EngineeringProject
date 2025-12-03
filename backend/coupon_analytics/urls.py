from django.urls import path
from .views import (
    CouponAnalyticsSummaryView,
    CouponAnalyticsQuerySummaryView,
    AlertRuleListCreateView,
    AlertRuleDetailView,
    AlertRuleEvaluateView,
    AlertEventListView,
    UserStrategyListCreateView,
    UserStrategyDetailView,
    UserStrategySummaryView,
    UserStrategiesSummaryView,
    ReportListCreateView,
    ReportDetailView,
    ReportToggleActiveView,
)

urlpatterns = [
    path('coupons/summary/', CouponAnalyticsSummaryView.as_view(), name='coupon-analytics-summary'),
    path('coupons/queries/<int:pk>/summary/', CouponAnalyticsQuerySummaryView.as_view(), name='coupon-analytics-query-summary'),
    path('alerts/rules/', AlertRuleListCreateView.as_view(), name='alert-rule-list-create'),
    path('alerts/rules/<int:pk>/', AlertRuleDetailView.as_view(), name='alert-rule-detail'),
    path('alerts/rules/<int:pk>/evaluate/', AlertRuleEvaluateView.as_view(), name='alert-rule-evaluate'),
    path('alerts/events/', AlertEventListView.as_view(), name='alert-event-list'),
    # User Strategy endpoints
    path('strategies/', UserStrategyListCreateView.as_view(), name='user-strategy-list-create'),
    path('strategies/<int:pk>/', UserStrategyDetailView.as_view(), name='user-strategy-detail'),
    path('strategies/<int:pk>/summary/', UserStrategySummaryView.as_view(), name='user-strategy-summary'),
    path('strategies/summary/', UserStrategiesSummaryView.as_view(), name='user-strategies-summary'),
    # Periodic Reports endpoints
    path('reports/', ReportListCreateView.as_view(), name='report-list-create'),
    path('reports/<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
    path('reports/<int:pk>/toggle/', ReportToggleActiveView.as_view(), name='report-toggle'),
]
